import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { pool } from '../src/db/index';
import { recordAuditEvent, getAuditTrail } from '../src/lib/audit';

describe('MT-114: Audit Trail Engine & Immutability Acceptance Suite', () => {
  let testTenantId: string;
  const testClinicSlug = `clinic-mt114-${Date.now()}`;

  before(async () => {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
      const res = await client.query(
        `INSERT INTO tenants (slug, name, status)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [testClinicSlug, 'Audit Trail Verification Clinic', 'active']
      );
      testTenantId = res.rows[0].id;
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
      await client.query('DELETE FROM audit_log WHERE tenant_id = $1', [testTenantId]);
      await client.query('DELETE FROM tenants WHERE id = $1', [testTenantId]);
      await client.query('COMMIT');
    } finally {
      client.release();
      await pool.end();
    }
  });

  it('Acceptance: recordAuditEvent inserts structured audit entry into audit_log', async () => {
    const target = `appointment:${randomUUID()}`;
    const logId = await recordAuditEvent({
      tenantId: testTenantId,
      actorId: 'user_doctor_123',
      action: 'appointment.status_change',
      target,
      details: {
        fromStatus: 'pending',
        toStatus: 'confirmed',
        note: 'Patient confirmed by phone call',
      },
      ip: '203.0.113.88',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    });

    assert.ok(logId, 'Must return generated audit log UUID');

    const logs = await getAuditTrail({ tenantId: testTenantId, target });
    assert.strictEqual(logs.length, 1);
    const firstLog = logs[0];
    assert.ok(firstLog);
    assert.strictEqual(firstLog.actorId, 'user_doctor_123');
    assert.strictEqual(firstLog.action, 'appointment.status_change');
    assert.strictEqual(firstLog.target, target);
    assert.strictEqual(firstLog.details?.fromStatus, 'pending');
    assert.strictEqual(firstLog.details?.toStatus, 'confirmed');
    assert.ok(firstLog.details?.ipHash, 'IP must be recorded as SHA-256 hash');
  });

  it('Acceptance: Immutability trigger raises SQL exception on UPDATE attempt', async () => {
    const logId = await recordAuditEvent({
      tenantId: testTenantId,
      actorId: 'user_admin_001',
      action: 'settings.update',
      target: 'clinic_settings',
      details: { change: 'operating_hours' },
    });

    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");

      await assert.rejects(
        async () => {
          await client.query("UPDATE audit_log SET action = 'tampered' WHERE id = $1", [logId]);
        },
        (err: any) => {
          assert.match(err.message, /audit_log is append-only and cannot be modified/i);
          return true;
        }
      );
    } finally {
      client.release();
    }
  });

  it('Acceptance: Immutability trigger raises SQL exception on DELETE attempt', async () => {
    const logId = await recordAuditEvent({
      tenantId: testTenantId,
      actorId: 'user_admin_001',
      action: 'post.publish',
      target: 'post:blog-post-1',
      details: { title: 'Heart Health' },
    });

    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");

      await assert.rejects(
        async () => {
          await client.query('DELETE FROM audit_log WHERE id = $1', [logId]);
        },
        (err: any) => {
          assert.match(err.message, /audit_log is append-only and cannot be deleted/i);
          return true;
        }
      );
    } finally {
      client.release();
    }
  });

  it('Acceptance: Sensitive patient PII in audit details is scrubbed to prevent data leaks (Rule R9)', async () => {
    const rawPatientName = 'Shantanu Mukherjee';
    const rawPatientPhone = '+919876543210';
    const rawPatientEmail = 'shantanu@mumbai-cardiac.in';

    const logId = await recordAuditEvent({
      tenantId: testTenantId,
      actorId: 'receptionist_42',
      action: 'appointment.view_details',
      target: `appointment:${randomUUID()}`,
      details: {
        patientName: rawPatientName,
        patientPhone: rawPatientPhone,
        patientEmail: rawPatientEmail,
        notes: `Call patient ${rawPatientName} at ${rawPatientPhone} to confirm surgery preparation.`,
      },
    });

    const logs = await getAuditTrail({ tenantId: testTenantId });
    const log = logs.find((l) => l.id === logId);
    assert.ok(log);

    const jsonStr = JSON.stringify(log.details);
    assert.strictEqual(
      jsonStr.includes(rawPatientName),
      false,
      'Raw patient name must NEVER be stored in audit_log'
    );
    assert.strictEqual(
      jsonStr.includes(rawPatientPhone),
      false,
      'Raw patient phone must NEVER be stored in audit_log'
    );
    assert.strictEqual(
      jsonStr.includes(rawPatientEmail),
      false,
      'Raw patient email must NEVER be stored in audit_log'
    );
    assert.ok(jsonStr.includes('[REDACTED_PII]') || jsonStr.includes('[REDACTED_PHONE]'));
  });
});
