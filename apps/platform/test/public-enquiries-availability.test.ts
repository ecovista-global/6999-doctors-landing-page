import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { pool } from '../src/db/index';
import { decrypt, encrypt } from '../src/lib/crypto';
import { POST as enquiriesPOST, OPTIONS as enquiriesOPTIONS } from '../src/app/api/v1/public/enquiries/route';
import { GET as availabilityGET, OPTIONS as availabilityOPTIONS } from '../src/app/api/v1/public/availability/route';
import { resetRateLimitStore } from '../src/lib/rate-limit';
import { resetIdempotencyStore } from '../src/lib/idempotency';

describe('MT-110: Public Enquiries API & Availability Endpoint Acceptance Suite', () => {
  let testTenantId: string;
  const testClinicSlug = `clinic-mt110-${Date.now()}`;

  before(async () => {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
      const res = await client.query(
        `INSERT INTO tenants (slug, name, status)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [testClinicSlug, 'Metro Wellness & Polyclinic', 'active']
      );
      testTenantId = res.rows[0].id;

      // Seed custom clinic operating hours: Monday-Friday 10:00-14:00, Saturday 10:00-12:00, Sunday closed
      await client.query(
        `INSERT INTO clinic_settings (
          tenant_id,
          operating_hours,
          slot_interval_minutes,
          max_daily_slots
        ) VALUES ($1, $2, $3, $4)`,
        [
          testTenantId,
          JSON.stringify({
            monday: '10:00-14:00',
            tuesday: '10:00-14:00',
            wednesday: '10:00-14:00',
            thursday: '10:00-14:00',
            friday: '10:00-14:00',
            saturday: '10:00-12:00',
            sunday: 'closed',
          }),
          30,
          20,
        ]
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

  // ============================================================================
  // Section A: Public Enquiries API (POST /v1/public/enquiries)
  // ============================================================================

  it('Acceptance: Valid enquiry returns 202 Accepted, encrypts PII, and stores consent timestamp', async () => {
    const idemKey = `idem-enq-${randomUUID()}`;
    const name = 'Vikramaditya Roy';
    const phone = '+919876543210';
    const email = 'vikram.roy@kolkata-health.org';
    const message = 'I would like to inquire about cardiology consultation fees and diagnostic packages.';

    const req = new NextRequest('http://localhost:3000/api/v1/public/enquiries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idemKey,
        'X-Forwarded-For': '203.0.113.101',
        Origin: 'https://metrowellness.in',
      },
      body: JSON.stringify({
        tenantId: testTenantId,
        name,
        phone,
        email,
        service: 'Cardiology',
        message,
        consent: true,
      }),
    });

    const res = await enquiriesPOST(req);
    assert.strictEqual(res.status, 202, 'Enquiry submission must return 202 Accepted');
    assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), 'https://metrowellness.in');

    const body = await res.json();
    assert.strictEqual(body.status, 'accepted');
    assert.ok(body.enquiryId, 'Response must return enquiryId');

    // Verify DB Row
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
      const dbRes = await client.query('SELECT * FROM enquiries WHERE id = $1', [body.enquiryId]);
      assert.strictEqual(dbRes.rowCount, 1, 'Enquiry row must exist in DB');
      const row = dbRes.rows[0];

      assert.strictEqual(row.tenant_id, testTenantId);
      assert.strictEqual(row.status, 'pending');
      assert.ok(row.consent_at, 'Enquiry row must store consent timestamp');
      assert.strictEqual(row.idempotency_key, idemKey);

      // Decrypt PII contact details
      assert.strictEqual(decrypt(row.name_enc), name);
      assert.strictEqual(decrypt(row.phone_enc), phone);
      assert.strictEqual(decrypt(row.email_enc), email);
      assert.strictEqual(decrypt(row.message_enc), message);

      // Verify Outbox Event
      const outboxRes = await client.query(
        "SELECT * FROM outbox_events WHERE tenant_id = $1 AND type = 'enquiry.created' AND payload->>'enquiryId' = $2",
        [testTenantId, body.enquiryId]
      );
      assert.strictEqual(outboxRes.rowCount, 1, 'Outbox event enquiry.created must be generated atomically');
    } finally {
      client.release();
    }
  });

  it('Acceptance: Duplicate enquiry submission returns cached replay with X-Idempotent-Replay header', async () => {
    const idemKey = `idem-enq-replay-${randomUUID()}`;
    const payload = {
      tenantId: testTenantId,
      name: 'Sunita Mehra',
      phone: '+919812345678',
      message: 'Need information about Saturday morning pediatric OPD.',
      consent: true,
    };

    const makeReq = () =>
      new NextRequest('http://localhost:3000/api/v1/public/enquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idemKey,
          'X-Forwarded-For': '203.0.113.102',
        },
        body: JSON.stringify(payload),
      });

    const res1 = await enquiriesPOST(makeReq());
    assert.strictEqual(res1.status, 202);
    const body1 = await res1.json();

    const res2 = await enquiriesPOST(makeReq());
    assert.strictEqual(res2.status, 202);
    assert.strictEqual(res2.headers.get('X-Idempotent-Replay'), 'true');
    const body2 = await res2.json();
    assert.strictEqual(body2.enquiryId, body1.enquiryId);
  });

  it('Acceptance: Enquiry payload without mandatory DPDP consent returns 422 E-1101', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/public/enquiries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': `idem-noconsent-${randomUUID()}`,
        'X-Forwarded-For': '203.0.113.103',
      },
      body: JSON.stringify({
        tenantId: testTenantId,
        name: 'Aakash Verma',
        phone: '+919876543210',
        message: 'Looking for physiotherapy slots.',
        consent: false,
      }),
    });

    const res = await enquiriesPOST(req);
    assert.strictEqual(res.status, 422);
    const body = await res.json();
    assert.strictEqual(body.code, 'E-1101');
    assert.ok(body.invalidParams?.some((p: any) => p.name === 'consent'));
  });

  it('Acceptance: Enquiry rate limit (5 req/min/IP) returns 429 E-1501 with Retry-After', async () => {
    const testIp = '198.51.100.110';
    for (let i = 1; i <= 5; i++) {
      const req = new NextRequest('http://localhost:3000/api/v1/public/enquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `idem-rl-${i}-${randomUUID()}`,
          'X-Forwarded-For': testIp,
        },
        body: JSON.stringify({
          tenantId: testTenantId,
          name: `Rate Limit Test ${i}`,
          phone: '+919876543210',
          message: 'Testing rate limits on public enquiries endpoint.',
          consent: true,
        }),
      });
      const res = await enquiriesPOST(req);
      assert.strictEqual(res.status, 202);
    }

    // 6th request from same IP
    const req6 = new NextRequest('http://localhost:3000/api/v1/public/enquiries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': `idem-rl-6-${randomUUID()}`,
        'X-Forwarded-For': testIp,
      },
      body: JSON.stringify({
        tenantId: testTenantId,
        name: 'Rate Limit Test 6',
        phone: '+919876543210',
        message: 'Testing rate limits on public enquiries endpoint.',
        consent: true,
      }),
    });
    const res6 = await enquiriesPOST(req6);
    assert.strictEqual(res6.status, 429);
    assert.ok(res6.headers.get('Retry-After'));
    const body6 = await res6.json();
    assert.strictEqual(body6.code, 'E-1501');
  });

  // ============================================================================
  // Section B: Public Availability API (GET /v1/public/availability)
  // ============================================================================

  it('Acceptance: Availability endpoint respects configured clinic operating hours and slot intervals', async () => {
    // 2026-11-23 is a Monday (operating_hours: 10:00-14:00, 30 min intervals -> 8 slots)
    const req = new NextRequest(
      `http://localhost:3000/api/v1/public/availability?tenantId=${testTenantId}&date=2026-11-23`,
      {
        method: 'GET',
        headers: {
          'X-Forwarded-For': '203.0.113.104',
          Origin: 'https://metrowellness.in',
        },
      }
    );

    const res = await availabilityGET(req);
    assert.strictEqual(res.status, 200, 'Availability check must return 200 OK');
    assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), 'https://metrowellness.in');

    const body = await res.json();
    assert.strictEqual(body.date, '2026-11-23');
    assert.strictEqual(body.dayOfWeek, 'monday');
    assert.strictEqual(body.isClosed, false);
    assert.strictEqual(body.slotIntervalMinutes, 30);
    assert.strictEqual(body.operatingHours, '10:00-14:00');

    // 10:00 to 14:00 in 30-min increments yields 8 slots:
    // 10:00-10:30, 10:30-11:00, 11:00-11:30, 11:30-12:00, 12:00-12:30, 12:30-01:00, 01:00-01:30, 01:30-02:00
    assert.strictEqual(body.totalSlots, 8);
    assert.ok(body.availableSlots.includes('10:00 AM - 10:30 AM'));
    assert.ok(body.availableSlots.includes('01:30 PM - 02:00 PM'));
  });

  it('Acceptance: Availability marks booked appointment slots as unavailable', async () => {
    const mondayDate = '2026-11-23';
    const bookedSlot = '10:00 AM - 10:30 AM';

    // Seed an appointment for that slot
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
      await client.query(
        `INSERT INTO appointments (
          tenant_id,
          patient_name_enc,
          patient_phone_enc,
          service_name,
          preferred_date,
          preferred_time_slot,
          status,
          consent_at,
          idempotency_key
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, now(), $8)`,
        [
          testTenantId,
          encrypt('Patient Booked'),
          encrypt('+919876543210'),
          'Cardiology',
          mondayDate,
          bookedSlot,
          'confirmed',
          `booking-seed-${randomUUID()}`,
        ]
      );
    } finally {
      client.release();
    }

    const req = new NextRequest(
      `http://localhost:3000/api/v1/public/availability?tenantId=${testTenantId}&date=${mondayDate}`,
      {
        method: 'GET',
        headers: { 'X-Forwarded-For': '203.0.113.105' },
      }
    );

    const res = await availabilityGET(req);
    assert.strictEqual(res.status, 200);
    const body = await res.json();

    assert.ok(body.bookedSlots.includes(bookedSlot), 'Booked slot must be listed in bookedSlots');
    assert.strictEqual(
      body.availableSlots.includes(bookedSlot),
      false,
      'Booked slot must NOT be present in availableSlots'
    );
    assert.strictEqual(body.availableSlots.length, body.totalSlots - 1);
  });

  it('Acceptance: Availability returns isClosed = true for closed days (Sunday)', async () => {
    // 2026-11-22 is a Sunday (configured as 'closed')
    const req = new NextRequest(
      `http://localhost:3000/api/v1/public/availability?tenantId=${testTenantId}&date=2026-11-22`,
      {
        method: 'GET',
        headers: { 'X-Forwarded-For': '203.0.113.106' },
      }
    );

    const res = await availabilityGET(req);
    assert.strictEqual(res.status, 200);
    const body = await res.json();

    assert.strictEqual(body.date, '2026-11-22');
    assert.strictEqual(body.dayOfWeek, 'sunday');
    assert.strictEqual(body.isClosed, true);
    assert.strictEqual(body.totalSlots, 0);
    assert.deepStrictEqual(body.availableSlots, []);
  });

  it('Acceptance: Availability rate limiting (60/min/IP) returns 429 E-1501 on burst', async () => {
    const burstIp = '198.51.100.111';
    for (let i = 1; i <= 60; i++) {
      const req = new NextRequest(
        `http://localhost:3000/api/v1/public/availability?tenantId=${testTenantId}&date=2026-11-23`,
        {
          method: 'GET',
          headers: { 'X-Forwarded-For': burstIp },
        }
      );
      const res = await availabilityGET(req);
      assert.strictEqual(res.status, 200);
    }

    // 61st request from same IP
    const req61 = new NextRequest(
      `http://localhost:3000/api/v1/public/availability?tenantId=${testTenantId}&date=2026-11-23`,
      {
        method: 'GET',
        headers: { 'X-Forwarded-For': burstIp },
      }
    );
    const res61 = await availabilityGET(req61);
    assert.strictEqual(res61.status, 429, '61st request within 1 min must return 429');
    const body61 = await res61.json();
    assert.strictEqual(body61.code, 'E-1501');
  });

  it('Acceptance: Preflight OPTIONS requests return 204 No Content for both endpoints', async () => {
    const enqOpt = await enquiriesOPTIONS(
      new NextRequest('http://localhost:3000/api/v1/public/enquiries', {
        method: 'OPTIONS',
        headers: { Origin: 'https://client-site.in' },
      })
    );
    assert.strictEqual(enqOpt.status, 204);
    assert.strictEqual(enqOpt.headers.get('Access-Control-Allow-Origin'), 'https://client-site.in');

    const availOpt = await availabilityOPTIONS(
      new NextRequest('http://localhost:3000/api/v1/public/availability', {
        method: 'OPTIONS',
        headers: { Origin: 'https://client-site.in' },
      })
    );
    assert.strictEqual(availOpt.status, 204);
    assert.strictEqual(availOpt.headers.get('Access-Control-Allow-Origin'), 'https://client-site.in');
  });
});
