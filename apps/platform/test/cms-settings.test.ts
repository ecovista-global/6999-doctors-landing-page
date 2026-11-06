import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { pool } from '../src/db/index';
import { getAuditTrail } from '../src/lib/audit';
import { GET as getSettings, PUT as putSettings } from '../src/app/api/v1/cms/settings/route';
import { GET as getAvailability } from '../src/app/api/v1/public/availability/route';

describe('MT-119: Clinic Settings CMS (Hours, Slots & Notifications) Acceptance Suite', () => {
  const tenantId = randomUUID();

  before(async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");

      // 1. Seed Tenant
      await client.query(
        'INSERT INTO tenants (id, slug, name, status) VALUES ($1, $2, $3, $4)',
        [tenantId, `settings-clinic-${Date.now()}`, 'City Care Wellness Clinic', 'active']
      );

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
      await client.query('DELETE FROM clinic_settings WHERE tenant_id = $1', [tenantId]);
      await client.query('DELETE FROM audit_log WHERE tenant_id = $1', [tenantId]);
      await client.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  it('Acceptance: PUT saves clinic settings, operating hours, slot interval, and logs audit event', async () => {
    const settingsPayload = {
      operatingHours: {
        monday: { open: '10:00', close: '16:00', closed: false },
        tuesday: { open: '10:00', close: '16:00', closed: false },
        wednesday: { open: '10:00', close: '16:00', closed: false },
        thursday: { open: '10:00', close: '16:00', closed: false },
        friday: { open: '10:00', close: '16:00', closed: false },
        saturday: { open: '10:00', close: '13:00', closed: false },
        sunday: { open: '10:00', close: '13:00', closed: true },
      },
      slotIntervalMinutes: 45,
      maxDailySlots: 20,
      notificationEmails: ['dr.sharma@citycare.in', 'reception@citycare.in'],
      spamThreshold: 8,
    };

    const req = new NextRequest(`http://localhost:3000/api/v1/cms/settings?tenantId=${tenantId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId,
        'x-actor-id': 'doctor_owner_sharma',
      },
      body: JSON.stringify(settingsPayload),
    });

    const res = await putSettings(req);
    assert.strictEqual(res.status, 200);

    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.slotIntervalMinutes, 45);
    assert.strictEqual(json.maxDailySlots, 20);
    assert.strictEqual(json.spamThreshold, 8);
    assert.deepStrictEqual(json.notificationEmails, ['dr.sharma@citycare.in', 'reception@citycare.in']);

    // Direct DB assertion
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
      const dbRes = await client.query('SELECT slot_interval_minutes, spam_threshold FROM clinic_settings WHERE tenant_id = $1', [tenantId]);
      assert.strictEqual(dbRes.rows[0].slot_interval_minutes, 45);
      assert.strictEqual(dbRes.rows[0].spam_threshold, 8);
    } finally {
      client.release();
    }

    // Audit trail assertion
    const auditLogs = await getAuditTrail({ tenantId, target: 'clinic_settings' });
    const updateLog = auditLogs.find((l) => l.action === 'settings.update');
    assert.ok(updateLog, 'Must record settings.update in audit_log');
    assert.strictEqual(updateLog.actorId, 'doctor_owner_sharma');
  });

  it('Acceptance: Public availability endpoint updates immediately after settings change', async () => {
    // Check Monday availability (configured 10:00 to 16:00 with 45 min slots)
    // 10:00, 10:45, 11:30, 12:15, 13:00, 13:45, 14:30, 15:15
    const mondayDate = '2026-11-09'; // 2026-11-09 is Monday

    const req = new NextRequest(
      `http://localhost:3000/api/v1/public/availability?tenantId=${tenantId}&date=${mondayDate}`,
      { method: 'GET' }
    );

    const res = await getAvailability(req);
    assert.strictEqual(res.status, 200);

    const data = await res.json();
    assert.strictEqual(data.isClosed, false);
    assert.strictEqual(data.slotIntervalMinutes, 45);
    assert.ok(data.availableSlots.length > 0);
    assert.ok(data.availableSlots.some((s: string) => s.startsWith('10:00 AM')));
    assert.ok(data.availableSlots.some((s: string) => s.startsWith('10:45 AM')));
    assert.ok(data.availableSlots.some((s: string) => s.startsWith('11:30 AM')));

    // Check Sunday availability (configured closed)
    const sundayDate = '2026-11-08'; // 2026-11-08 is Sunday
    const reqSunday = new NextRequest(
      `http://localhost:3000/api/v1/public/availability?tenantId=${tenantId}&date=${sundayDate}`,
      { method: 'GET' }
    );
    const resSunday = await getAvailability(reqSunday);
    const dataSunday = await resSunday.json();
    assert.strictEqual(dataSunday.isClosed, true);
    assert.strictEqual(dataSunday.totalSlots, 0);
  });

  it('Acceptance: Validation blocks invalid email format with 422 E-1101', async () => {
    const invalidPayload = {
      slotIntervalMinutes: 30,
      notificationEmails: ['valid@clinic.com', 'invalid-email-no-at'],
    };

    const req = new NextRequest(`http://localhost:3000/api/v1/cms/settings?tenantId=${tenantId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify(invalidPayload),
    });

    const res = await putSettings(req);
    assert.strictEqual(res.status, 422);

    const json = await res.json();
    assert.strictEqual(json.code, 'E-1101');
    assert.ok(json.detail.includes('Invalid email format'));
  });

  it('Acceptance: Validation blocks more than 3 notification emails with 422 E-1101', async () => {
    const tooManyEmailsPayload = {
      slotIntervalMinutes: 30,
      notificationEmails: [
        'email1@clinic.com',
        'email2@clinic.com',
        'email3@clinic.com',
        'email4@clinic.com',
      ],
    };

    const req = new NextRequest(`http://localhost:3000/api/v1/cms/settings?tenantId=${tenantId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify(tooManyEmailsPayload),
    });

    const res = await putSettings(req);
    assert.strictEqual(res.status, 422);

    const json = await res.json();
    assert.strictEqual(json.code, 'E-1101');
    assert.ok(json.detail.includes('Maximum of 3 notification emails permitted'));
  });

  it('Acceptance: Validation blocks unsupported slot intervals with 422 E-1101', async () => {
    const invalidIntervalPayload = {
      slotIntervalMinutes: 22, // Only 15, 30, 45, 60 allowed
      notificationEmails: ['email@clinic.com'],
    };

    const req = new NextRequest(`http://localhost:3000/api/v1/cms/settings?tenantId=${tenantId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify(invalidIntervalPayload),
    });

    const res = await putSettings(req);
    assert.strictEqual(res.status, 422);

    const json = await res.json();
    assert.strictEqual(json.code, 'E-1101');
    assert.ok(json.detail.includes('Invalid slot interval'));
  });
});
