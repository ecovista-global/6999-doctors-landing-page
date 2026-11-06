import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { pool } from '../src/db/index';
import { encrypt } from '../src/lib/crypto';
import { getAuditTrail } from '../src/lib/audit';
import { GET, PATCH } from '../src/app/api/v1/cms/submissions/appointments/[id]/route';

describe('MT-116: Submission Detail Drawer & Staff Notes Acceptance Suite', () => {
  const tenantAId = randomUUID();
  const tenantBId = randomUUID();
  let appointmentId: string;

  before(async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");

      // 1. Seed Clinics
      await client.query(
        'INSERT INTO tenants (id, slug, name, status) VALUES ($1, $2, $3, $4)',
        [tenantAId, `drawer-clinic-a-${Date.now()}`, 'Apollo Heart Clinic', 'active']
      );
      await client.query(
        'INSERT INTO tenants (id, slug, name, status) VALUES ($1, $2, $3, $4)',
        [tenantBId, `drawer-clinic-b-${Date.now()}`, 'Fortis Eye Care', 'active']
      );

      // 2. Seed Test Appointment for Clinic A with encrypted PII
      const encName = encrypt('Kavita Krishnan');
      const encPhone = encrypt('+919845012345');
      const encEmail = encrypt('kavita.krishnan@example.com');

      const apptRes = await client.query(
        `INSERT INTO appointments (
          tenant_id, patient_name_enc, patient_phone_enc, patient_email_enc,
          service_name, preferred_date, preferred_time_slot, status, notes,
          consent_at, idempotency_key, ip_hash
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE + INTERVAL '2 days', $6, $7, $8, NOW(), $9, $10)
        RETURNING id`,
        [
          tenantAId,
          encName,
          encPhone,
          encEmail,
          'Cardiology Screening',
          '03:00 PM',
          'pending',
          'Initial booking request notes',
          randomUUID(),
          'test_ip_hash_abc123',
        ]
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
      await client.query('DELETE FROM appointments WHERE tenant_id IN ($1, $2)', [tenantAId, tenantBId]);
      await client.query('DELETE FROM audit_log WHERE tenant_id IN ($1, $2)', [tenantAId, tenantBId]);
      await client.query('DELETE FROM tenants WHERE id IN ($1, $2)', [tenantAId, tenantBId]);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  it('Acceptance: GET appointment detail returns decrypted patient contact info and logs audit access', async () => {
    const req = new NextRequest(
      `http://localhost:3000/api/v1/cms/submissions/appointments/${appointmentId}?tenantId=${tenantAId}`,
      {
        method: 'GET',
        headers: {
          'x-tenant-id': tenantAId,
          'x-actor-id': 'receptionist_priya',
          'user-agent': 'Antigravity CMS Platform Test',
        },
      }
    );

    const res = await GET(req);
    assert.strictEqual(res.status, 200);

    const data = await res.json();
    assert.strictEqual(data.id, appointmentId);
    assert.strictEqual(data.patientName, 'Kavita Krishnan');
    assert.strictEqual(data.patientPhone, '+919845012345');
    assert.strictEqual(data.patientEmail, 'kavita.krishnan@example.com');
    assert.strictEqual(data.serviceName, 'Cardiology Screening');
    assert.strictEqual(data.preferredTimeSlot, '03:00 PM');
    assert.strictEqual(data.status, 'pending');
    assert.strictEqual(data.turnstileScore, '1.0 (Verified Human)');

    // Verify Audit Trail was populated with submission.view action
    const auditLogs = await getAuditTrail({
      tenantId: tenantAId,
      target: `appointment:${appointmentId}`,
    });

    assert.ok(auditLogs.length >= 1, 'Audit log entry must be created on viewing patient details');
    const viewLog = auditLogs.find((l) => l.action === 'submission.view');
    assert.ok(viewLog, 'submission.view action must be present in audit trail');
    assert.strictEqual(viewLog.actorId, 'receptionist_priya');
  });

  it('Acceptance: PATCH updates staff notes and persists directly to DB', async () => {
    const updatedNoteContent = 'Patient requested wheelchair assistance and Hindi-speaking staff.';

    const req = new NextRequest(
      `http://localhost:3000/api/v1/cms/submissions/appointments/${appointmentId}?tenantId=${tenantAId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantAId,
          'x-actor-id': 'receptionist_priya',
        },
        body: JSON.stringify({ notes: updatedNoteContent }),
      }
    );

    const res = await PATCH(req);
    assert.strictEqual(res.status, 200);

    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.notes, updatedNoteContent);

    // Verify DB direct query
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
      const dbRes = await client.query('SELECT notes FROM appointments WHERE id = $1', [appointmentId]);
      assert.strictEqual(dbRes.rows[0].notes, updatedNoteContent);
    } finally {
      client.release();
    }

    // Verify Audit Trail was populated with submission.note_update action
    const auditLogs = await getAuditTrail({
      tenantId: tenantAId,
      target: `appointment:${appointmentId}`,
    });

    const noteLog = auditLogs.find((l) => l.action === 'submission.note_update');
    assert.ok(noteLog, 'submission.note_update action must be logged in audit trail');
    assert.strictEqual(noteLog.actorId, 'receptionist_priya');
  });

  it('Acceptance: Cross-tenant access is rejected with 404 (zero leakage across clinic boundaries)', async () => {
    const req = new NextRequest(
      `http://localhost:3000/api/v1/cms/submissions/appointments/${appointmentId}?tenantId=${tenantBId}`,
      {
        method: 'GET',
        headers: {
          'x-tenant-id': tenantBId,
          'x-actor-id': 'unauthorized_staff',
        },
      }
    );

    const res = await GET(req);
    assert.strictEqual(res.status, 404, 'Cross-tenant request must return 404 Not Found under tenant isolation');
  });
});
