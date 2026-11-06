import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { pool } from '../src/db/index';
import { decrypt } from '../src/lib/crypto';
import { POST, OPTIONS } from '../src/app/api/v1/public/appointments/route';
import { resetRateLimitStore } from '../src/lib/rate-limit';
import { resetIdempotencyStore } from '../src/lib/idempotency';

describe('MT-109: Public Appointments API & Idempotency Acceptance Suite', () => {
  let testTenantId: string;
  const testClinicSlug = `clinic-mt109-${Date.now()}`;

  before(async () => {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
      const res = await client.query(
        `INSERT INTO tenants (slug, name, status)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [testClinicSlug, 'LifeCare Comprehensive Clinic', 'active']
      );
      testTenantId = res.rows[0].id;

      // Seed clinic settings for completeness
      await client.query(
        `INSERT INTO clinic_settings (tenant_id, operating_hours, slot_interval_minutes, max_daily_slots)
         VALUES ($1, $2, $3, $4)`,
        [testTenantId, JSON.stringify({ monday: '09:00-18:00' }), 30, 40]
      );
    } finally {
      client.release();
    }
  });

  after(async () => {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
      await client.query('DELETE FROM tenants WHERE id = $1', [testTenantId]);
    } finally {
      client.release();
      await pool.end();
    }
  });

  beforeEach(() => {
    resetRateLimitStore();
    resetIdempotencyStore();
  });

  it('Acceptance: Valid appointment payload returns HTTP 202 Accepted and creates encrypted DB records', async () => {
    const idemKey = `idem-${randomUUID()}`;
    const patientName = 'Dr. S. K. Mukherjee';
    const patientPhone = '+919876543210';
    const patientEmail = 'mukherjee.care@noida-hospital.in';

    const req = new NextRequest('http://localhost:3000/api/v1/public/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idemKey,
        'X-Forwarded-For': '203.0.113.10',
        Origin: 'http://localhost:5173',
      },
      body: JSON.stringify({
        tenantId: testTenantId,
        patientName,
        patientPhone,
        patientEmail,
        serviceName: 'Echocardiography & Doppler',
        preferredDate: '2026-11-20',
        preferredTimeSlot: '11:00 AM - 11:30 AM',
        notes: 'Follow-up consultation after Holter monitor',
        consent: true,
      }),
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 202, 'Valid booking payload must return 202 Accepted');
    assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), 'http://localhost:5173');

    const body = await res.json();
    assert.strictEqual(body.status, 'accepted');
    assert.ok(body.appointmentId, 'Response must include generated appointmentId');
    assert.strictEqual(body.serviceName, 'Echocardiography & Doppler');
    assert.strictEqual(body.preferredDate, '2026-11-20');

    // Verify Database Persistence & Encryption
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
      const dbRes = await client.query(
        'SELECT * FROM appointments WHERE id = $1',
        [body.appointmentId]
      );
      assert.strictEqual(dbRes.rowCount, 1, 'Appointment row must exist in Postgres');
      const row = dbRes.rows[0];

      assert.strictEqual(row.tenant_id, testTenantId);
      assert.strictEqual(row.status, 'pending');
      assert.strictEqual(row.idempotency_key, idemKey);

      // Verify that patient PII was encrypted via AES-256-GCM
      assert.strictEqual(decrypt(row.patient_name_enc), patientName);
      assert.strictEqual(decrypt(row.patient_phone_enc), patientPhone);
      assert.strictEqual(decrypt(row.patient_email_enc), patientEmail);

      // Verify Transactional Outbox Event
      const outboxRes = await client.query(
        "SELECT * FROM outbox_events WHERE tenant_id = $1 AND type = 'appointment.created' AND payload->>'appointmentId' = $2",
        [testTenantId, body.appointmentId]
      );
      assert.strictEqual(outboxRes.rowCount, 1, 'Outbox event appointment.created must be created atomically');

      // Verify Initial Appointment Event Audit Trail
      const eventRes = await client.query(
        'SELECT * FROM appointment_events WHERE appointment_id = $1',
        [body.appointmentId]
      );
      assert.strictEqual(eventRes.rowCount, 1, 'Initial appointment event must be logged');
      assert.strictEqual(eventRes.rows[0].to_status, 'pending');
    } finally {
      client.release();
    }
  });

  it('Acceptance: Duplicate idempotency key returns replay response with X-Idempotent-Replay header', async () => {
    const idemKey = `idem-replay-${randomUUID()}`;
    const payload = {
      tenantId: testTenantId,
      patientName: 'Ananya Deshmukh',
      patientPhone: '+919811122233',
      serviceName: 'Dermatology Consultation',
      preferredDate: '2026-11-25',
      preferredTimeSlot: '04:00 PM',
      consent: true,
    };

    const makeReq = () =>
      new NextRequest('http://localhost:3000/api/v1/public/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idemKey,
          'X-Forwarded-For': '203.0.113.20',
        },
        body: JSON.stringify(payload),
      });

    // 1. Initial Request
    const res1 = await POST(makeReq());
    assert.strictEqual(res1.status, 202);
    const body1 = await res1.json();
    assert.ok(body1.appointmentId);

    // 2. Exact Duplicate Replay Request
    const res2 = await POST(makeReq());
    assert.strictEqual(res2.status, 202, 'Duplicate request must return 202');
    assert.strictEqual(
      res2.headers.get('X-Idempotent-Replay'),
      'true',
      'Replay response must carry X-Idempotent-Replay header'
    );
    const body2 = await res2.json();
    assert.strictEqual(body2.appointmentId, body1.appointmentId, 'Replay must return original appointmentId');

    // 3. Verify exactly 1 row in DB (zero duplicate inserts)
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
      const checkRes = await client.query(
        'SELECT count(*)::int as cnt FROM appointments WHERE idempotency_key = $1',
        [idemKey]
      );
      assert.strictEqual(checkRes.rows[0].cnt, 1, 'Exactly one DB appointment row must be created');
    } finally {
      client.release();
    }
  });

  it('Acceptance: Idempotency key reused with DIFFERENT body returns 422 E-1302', async () => {
    const idemKey = `idem-conflict-${randomUUID()}`;

    const req1 = new NextRequest('http://localhost:3000/api/v1/public/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idemKey,
        'X-Forwarded-For': '203.0.113.30',
      },
      body: JSON.stringify({
        tenantId: testTenantId,
        patientName: 'Patient Alpha',
        patientPhone: '+919988776655',
        serviceName: 'General Consultation',
        preferredDate: '2026-11-21',
        preferredTimeSlot: '10:00 AM',
        consent: true,
      }),
    });

    const res1 = await POST(req1);
    assert.strictEqual(res1.status, 202);

    // Request with same idempotency key but different patient phone/name
    const req2 = new NextRequest('http://localhost:3000/api/v1/public/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idemKey,
        'X-Forwarded-For': '203.0.113.30',
      },
      body: JSON.stringify({
        tenantId: testTenantId,
        patientName: 'Patient Beta (Different Body)',
        patientPhone: '+919123456789',
        serviceName: 'Cardiology Consultation',
        preferredDate: '2026-11-22',
        preferredTimeSlot: '02:00 PM',
        consent: true,
      }),
    });

    const res2 = await POST(req2);
    assert.strictEqual(res2.status, 422, 'Reused key with different body must return 422');
    const body2 = await res2.json();
    assert.strictEqual(body2.code, 'E-1302');
  });

  it('Acceptance: Missing Idempotency-Key header returns HTTP 400 E-1304', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/public/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '203.0.113.40',
      },
      body: JSON.stringify({
        tenantId: testTenantId,
        patientName: 'Rohan Sharma',
        patientPhone: '+919876543210',
        serviceName: 'General Consultation',
        preferredDate: '2026-11-20',
        preferredTimeSlot: '10:00 AM',
        consent: true,
      }),
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 400, 'Missing Idempotency-Key must return 400');
    const body = await res.json();
    assert.strictEqual(body.code, 'E-1304');
  });

  it('Acceptance: Invalid payload returns HTTP 422 E-1101 with invalidParams list', async () => {
    const idemKey = `idem-invalid-${randomUUID()}`;

    // Payload with invalid phone and missing consent
    const req = new NextRequest('http://localhost:3000/api/v1/public/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idemKey,
        'X-Forwarded-For': '203.0.113.50',
      },
      body: JSON.stringify({
        tenantId: testTenantId,
        patientName: 'X', // too short (< 2 chars)
        patientPhone: '12345', // invalid phone
        serviceName: 'Dental Checkup',
        preferredDate: 'invalid-date', // not YYYY-MM-DD
        preferredTimeSlot: '10:00 AM',
        consent: false, // consent rejected
      }),
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 422, 'Invalid payload must return 422');
    const body = await res.json();
    assert.strictEqual(body.code, 'E-1101');
    assert.ok(Array.isArray(body.invalidParams), 'Response must include invalidParams array');

    const invalidFieldNames = body.invalidParams.map((p: any) => p.name);
    assert.ok(invalidFieldNames.includes('patientName'));
    assert.ok(invalidFieldNames.includes('patientPhone'));
    assert.ok(invalidFieldNames.includes('preferredDate'));
    assert.ok(invalidFieldNames.includes('consent'));
  });

  it('Acceptance: Rate limit (5 requests / min / IP) returns HTTP 429 E-1501 with Retry-After header', async () => {
    const testIp = '198.51.100.99';

    const makeSub = async (index: number) => {
      const req = new NextRequest('http://localhost:3000/api/v1/public/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `idem-rl-${index}-${randomUUID()}`,
          'X-Forwarded-For': testIp,
        },
        body: JSON.stringify({
          tenantId: testTenantId,
          patientName: `Patient RL ${index}`,
          patientPhone: '+919876543210',
          serviceName: 'General Consultation',
          preferredDate: '2026-11-20',
          preferredTimeSlot: '10:00 AM',
          consent: true,
        }),
      });
      return POST(req);
    };

    // First 5 requests must succeed (202)
    for (let i = 1; i <= 5; i++) {
      const res = await makeSub(i);
      assert.strictEqual(res.status, 202, `Request ${i} within limit must return 202`);
    }

    // 6th request from same IP must be rate limited (429)
    const res6 = await makeSub(6);
    assert.strictEqual(res6.status, 429, '6th request from same IP must return 429');
    assert.ok(res6.headers.get('Retry-After'), 'Must include Retry-After header');
    const body6 = await res6.json();
    assert.strictEqual(body6.code, 'E-1501');
  });

  it('Acceptance: CORS OPTIONS preflight returns HTTP 204 with allowed headers', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/public/appointments', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://dr-sharma-clinic.in',
      },
    });

    const res = await OPTIONS(req);
    assert.strictEqual(res.status, 204, 'Preflight OPTIONS must return 204 No Content');
    assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), 'https://dr-sharma-clinic.in');
    assert.ok(res.headers.get('Access-Control-Allow-Methods')?.includes('POST'));
    assert.ok(res.headers.get('Access-Control-Allow-Headers')?.includes('Idempotency-Key'));
  });
});
