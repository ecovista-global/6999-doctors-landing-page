import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { pool } from '../src/db/index';
import { encrypt } from '../src/lib/crypto';
import { getAuditTrail } from '../src/lib/audit';
import {
  validateStatusTransition,
  assertValidStatusTransition,
} from '../src/lib/appointment-state-machine';
import { PATCH } from '../src/app/api/v1/cms/submissions/appointments/[id]/route';

describe('MT-117: Appointment Status State Machine & Allowed Transitions Acceptance Suite', () => {
  const tenantId = randomUUID();
  let appointmentId: string;

  before(async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");

      // 1. Seed Tenant
      await client.query(
        'INSERT INTO tenants (id, slug, name, status) VALUES ($1, $2, $3, $4)',
        [tenantId, `status-machine-${Date.now()}`, 'City Orthopedic Clinic', 'active']
      );

      // 2. Seed Initial Pending Appointment
      const encName = encrypt('Deepak Verma');
      const encPhone = encrypt('+919812345678');

      const apptRes = await client.query(
        `INSERT INTO appointments (
          tenant_id, patient_name_enc, patient_phone_enc,
          service_name, preferred_date, preferred_time_slot, status,
          consent_at, idempotency_key
        ) VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, 'pending', NOW(), $6)
        RETURNING id`,
        [tenantId, encName, encPhone, 'Orthopedic Evaluation', '11:00 AM', randomUUID()]
      );
      appointmentId = apptRes.rows[0].id;

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  });

  after(async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
      await client.query("SELECT set_config('app.bypass_audit_immutability', 'on', true)");
      await client.query('DELETE FROM appointment_events WHERE tenant_id = $1', [tenantId]);
      await client.query('DELETE FROM appointments WHERE tenant_id = $1', [tenantId]);
      await client.query('DELETE FROM audit_log WHERE tenant_id = $1', [tenantId]);
      await client.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  describe('Unit: State Machine Transition Guard', () => {
    it('validates allowed transitions correctly', () => {
      // Pending transitions
      assert.strictEqual(validateStatusTransition('pending', 'confirmed'), true);
      assert.strictEqual(validateStatusTransition('pending', 'cancelled'), true);
      assert.strictEqual(validateStatusTransition('pending', 'completed'), false); // Cannot jump directly to completed

      // Confirmed transitions
      assert.strictEqual(validateStatusTransition('confirmed', 'completed'), true);
      assert.strictEqual(validateStatusTransition('confirmed', 'cancelled'), true);
      assert.strictEqual(validateStatusTransition('confirmed', 'pending'), false);

      // Cancelled transitions
      assert.strictEqual(validateStatusTransition('cancelled', 'pending'), true);
      assert.strictEqual(validateStatusTransition('cancelled', 'completed'), false);

      // Completed (terminal) transitions
      assert.strictEqual(validateStatusTransition('completed', 'pending'), false);
      assert.strictEqual(validateStatusTransition('completed', 'confirmed'), false);
      assert.strictEqual(validateStatusTransition('completed', 'cancelled'), false);

      // Identity transitions
      assert.strictEqual(validateStatusTransition('pending', 'pending'), true);
      assert.strictEqual(validateStatusTransition('completed', 'completed'), true);
    });

    it('assertValidStatusTransition throws 422 E-1603 on disallowed transitions', () => {
      assert.throws(
        () => assertValidStatusTransition('completed', 'pending'),
        (err: any) => err.code === 'E-1603' && err.status === 422
      );

      assert.throws(
        () => assertValidStatusTransition('pending', 'completed'),
        (err: any) => err.code === 'E-1603' && err.status === 422
      );
    });
  });

  describe('Integration: API Route State Machine Enforcement', () => {
    it('Acceptance: Transition Pending -> Confirmed succeeds and records events in DB & audit_log', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/v1/cms/submissions/appointments/${appointmentId}?tenantId=${tenantId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': tenantId,
            'x-actor-id': 'doctor_neha',
          },
          body: JSON.stringify({ status: 'confirmed' }),
        }
      );

      const res = await PATCH(req);
      assert.strictEqual(res.status, 200);

      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.status, 'confirmed');

      // Verify appointment_events table has new event
      const client = await pool.connect();
      try {
        await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
        const eventRes = await client.query(
          `SELECT from_status, to_status, actor_id FROM appointment_events WHERE appointment_id = $1 ORDER BY created_at DESC LIMIT 1`,
          [appointmentId]
        );
        assert.strictEqual(eventRes.rowCount, 1);
        assert.strictEqual(eventRes.rows[0].from_status, 'pending');
        assert.strictEqual(eventRes.rows[0].to_status, 'confirmed');
        assert.strictEqual(eventRes.rows[0].actor_id, 'doctor_neha');
      } finally {
        client.release();
      }

      // Verify audit_log entry
      const auditTrail = await getAuditTrail({
        tenantId,
        target: `appointment:${appointmentId}`,
      });
      const statusLog = auditTrail.find((l) => l.action === 'appointment.status_change');
      assert.ok(statusLog, 'Must have recorded appointment.status_change in audit_log');
      assert.strictEqual(statusLog.details?.fromStatus, 'pending');
      assert.strictEqual(statusLog.details?.newStatus, 'confirmed');
    });

    it('Acceptance: Transition Confirmed -> Completed succeeds', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/v1/cms/submissions/appointments/${appointmentId}?tenantId=${tenantId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': tenantId,
            'x-actor-id': 'doctor_neha',
          },
          body: JSON.stringify({ status: 'completed' }),
        }
      );

      const res = await PATCH(req);
      assert.strictEqual(res.status, 200);

      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.status, 'completed');
    });

    it('Acceptance: Transition Completed -> Pending is REJECTED with 422 E-1603 (terminal state)', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/v1/cms/submissions/appointments/${appointmentId}?tenantId=${tenantId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': tenantId,
            'x-actor-id': 'doctor_neha',
          },
          body: JSON.stringify({ status: 'pending' }),
        }
      );

      const res = await PATCH(req);
      assert.strictEqual(res.status, 422);

      const json = await res.json();
      assert.strictEqual(json.code, 'E-1603');
      assert.strictEqual(json.status, 422);
      assert.ok(json.detail.includes('Invalid appointment status transition'));
    });

    it('Acceptance: Transition Completed -> Cancelled is REJECTED with 422 E-1603', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/v1/cms/submissions/appointments/${appointmentId}?tenantId=${tenantId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': tenantId,
          },
          body: JSON.stringify({ status: 'cancelled' }),
        }
      );

      const res = await PATCH(req);
      assert.strictEqual(res.status, 422);

      const json = await res.json();
      assert.strictEqual(json.code, 'E-1603');
    });
  });
});
