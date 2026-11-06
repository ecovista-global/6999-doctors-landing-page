import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { pool } from '../src/db/index';
import { encrypt } from '../src/lib/crypto';
import { fetchCmsAppointments, decodeCursor, encodeCursor } from '../src/lib/cms-submissions';

describe('MT-115: CMS Submissions Dashboard & Keyset Pagination Acceptance Suite', () => {
  const tenantId = randomUUID();
  const otherTenantId = randomUUID();

  const appointmentIds: string[] = [];

  before(async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");

      // 1. Seed Tenants
      await client.query(
        'INSERT INTO tenants (id, slug, name, status) VALUES ($1, $2, $3, $4)',
        [tenantId, `clinic-submissions-${Date.now()}`, 'City Care Heart Clinic', 'active']
      );
      await client.query(
        'INSERT INTO tenants (id, slug, name, status) VALUES ($1, $2, $3, $4)',
        [otherTenantId, `other-clinic-${Date.now()}`, 'Other Clinic', 'active']
      );

      // 2. Seed Test Appointments
      // Row 1: Today OPD, Pending, Cardiology, Sunita Sharma
      const pName1 = encrypt('Sunita Sharma');
      const pPhone1 = encrypt('+919876543210');
      const pEmail1 = encrypt('sunita.sharma@example.com');
      const r1 = await client.query(
        `INSERT INTO appointments (
          tenant_id, patient_name_enc, patient_phone_enc, patient_email_enc,
          service_name, preferred_date, preferred_time_slot, status,
          consent_at, idempotency_key
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6, $7, NOW(), $8) RETURNING id`,
        [tenantId, pName1, pPhone1, pEmail1, 'Cardiology Screening', '10:00 AM', 'pending', randomUUID()]
      );
      appointmentIds.push(r1.rows[0].id);

      // Row 2: Today OPD, Confirmed, General Consultation, Rohan Mehta
      const pName2 = encrypt('Rohan Mehta');
      const pPhone2 = encrypt('+919811122233');
      const r2 = await client.query(
        `INSERT INTO appointments (
          tenant_id, patient_name_enc, patient_phone_enc,
          service_name, preferred_date, preferred_time_slot, status,
          consent_at, idempotency_key
        ) VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6, NOW(), $7) RETURNING id`,
        [tenantId, pName2, pPhone2, 'General Consultation', '11:30 AM', 'confirmed', randomUUID()]
      );
      appointmentIds.push(r2.rows[0].id);

      // Row 3: Tomorrow (not today), Completed, Pediatrics, Ananya Verma
      const pName3 = encrypt('Ananya Verma');
      const pPhone3 = encrypt('+919922334455');
      const r3 = await client.query(
        `INSERT INTO appointments (
          tenant_id, patient_name_enc, patient_phone_enc,
          service_name, preferred_date, preferred_time_slot, status,
          consent_at, idempotency_key
        ) VALUES ($1, $2, $3, $4, CURRENT_DATE + INTERVAL '1 day', $5, $6, NOW(), $7) RETURNING id`,
        [tenantId, pName3, pPhone3, 'Pediatric Care', '04:00 PM', 'completed', randomUUID()]
      );
      appointmentIds.push(r3.rows[0].id);

      // Row 4: Other Tenant row
      await client.query(
        `INSERT INTO appointments (
          tenant_id, patient_name_enc, patient_phone_enc,
          service_name, preferred_date, preferred_time_slot, status,
          consent_at, idempotency_key
        ) VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6, NOW(), $7)`,
        [otherTenantId, encrypt('Alien Patient'), encrypt('+919000000000'), 'Cardiology Screening', '02:00 PM', 'pending', randomUUID()]
      );

      // Seed a larger batch (100 rows) to test keyset pagination and benchmark latency
      for (let i = 0; i < 50; i++) {
        await client.query(
          `INSERT INTO appointments (
            tenant_id, patient_name_enc, patient_phone_enc,
            service_name, preferred_date, preferred_time_slot, status,
            consent_at, idempotency_key, created_at
          ) VALUES ($1, $2, $3, $4, CURRENT_DATE, '09:00 AM', 'pending', NOW(), $5, NOW() - ($6 || ' seconds')::interval)`,
          [tenantId, encrypt(`Batch Patient ${i}`), encrypt(`+9198000000${i.toString().padStart(2, '0')}`), 'General Consultation', randomUUID(), (i + 10).toString()]
        );
      }

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
      await client.query('DELETE FROM appointments WHERE tenant_id IN ($1, $2)', [tenantId, otherTenantId]);
      await client.query('DELETE FROM tenants WHERE id IN ($1, $2)', [tenantId, otherTenantId]);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  it('Acceptance: Today OPD tab filters appointments for CURRENT_DATE only', async () => {
    const res = await fetchCmsAppointments({
      tenantId,
      tab: 'today',
      limit: 100,
    });

    assert.ok(res.items.length >= 2, 'Should return at least the 2 seeded today rows');
    const now = new Date();
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    for (const item of res.items) {
      assert.strictEqual(
        item.preferredDate,
        todayIso,
        `Expected preferred_date to be today ${todayIso}, got ${item.preferredDate}`
      );
    }

    // Verify tomorrow's appointment (Ananya Verma) is not in Today's tab
    const hasTomorrowPatient = res.items.some((it) => it.patientName === 'Ananya Verma');
    assert.strictEqual(hasTomorrowPatient, false, 'Tomorrow patient should not appear in Today OPD');
  });

  it('Acceptance: Decrypts patient contact PII accurately for CMS staff', async () => {
    const res = await fetchCmsAppointments({
      tenantId,
      tab: 'all',
      search: 'Sunita Sharma',
    });

    assert.strictEqual(res.items.length, 1);
    const sunita = res.items[0];
    assert.ok(sunita);
    assert.strictEqual(sunita.patientName, 'Sunita Sharma');
    assert.strictEqual(sunita.patientPhone, '+919876543210');
    assert.strictEqual(sunita.patientEmail, 'sunita.sharma@example.com');
    assert.strictEqual(sunita.serviceName, 'Cardiology Screening');
    assert.strictEqual(sunita.status, 'pending');
  });

  it('Acceptance: Status filter correctly isolates records', async () => {
    const res = await fetchCmsAppointments({
      tenantId,
      tab: 'all',
      status: 'confirmed',
    });

    assert.ok(res.items.length >= 1);
    for (const item of res.items) {
      assert.strictEqual(item.status, 'confirmed');
    }
    const rohan = res.items.find((it) => it.patientName === 'Rohan Mehta');
    assert.ok(rohan, 'Should contain Rohan Mehta with confirmed status');
  });

  it('Acceptance: Search query matches patient name and phone number', async () => {
    // Search by partial phone
    const res = await fetchCmsAppointments({
      tenantId,
      tab: 'all',
      search: '9811122233',
    });

    assert.strictEqual(res.items.length, 1);
    const rohan = res.items[0];
    assert.ok(rohan);
    assert.strictEqual(rohan.patientName, 'Rohan Mehta');
  });

  it('Acceptance: Keyset cursor pagination correctly paginates without offsets', async () => {
    // Page 1: limit 5
    const page1 = await fetchCmsAppointments({
      tenantId,
      tab: 'all',
      limit: 5,
    });

    assert.strictEqual(page1.items.length, 5);
    assert.strictEqual(page1.hasMore, true);
    assert.ok(page1.nextCursor, 'Should provide nextCursor');

    const decoded = decodeCursor(page1.nextCursor!);
    assert.ok(decoded);
    assert.ok(decoded.createdAt);
    assert.ok(decoded.id);

    // Page 2: with cursor
    const page2 = await fetchCmsAppointments({
      tenantId,
      tab: 'all',
      cursor: page1.nextCursor,
      limit: 5,
    });

    assert.strictEqual(page2.items.length, 5);
    // Page 2 IDs must not overlap with Page 1 IDs
    const page1Ids = new Set(page1.items.map((i) => i.id));
    for (const item of page2.items) {
      assert.strictEqual(page1Ids.has(item.id), false, 'Page 2 item must not be in Page 1');
    }
  });

  it('Acceptance: Cursor pagination query latency asserts P99 < 300 ms benchmark', async () => {
    const iterations = 20;
    const latencies: number[] = [];

    let currentCursor: string | null = null;
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const res = await fetchCmsAppointments({
        tenantId,
        tab: 'all',
        cursor: currentCursor,
        limit: 10,
      });
      const duration = performance.now() - start;
      latencies.push(duration);
      currentCursor = res.nextCursor;
      if (!res.hasMore) break;
    }

    latencies.sort((a, b) => a - b);
    const p99Index = Math.min(latencies.length - 1, Math.floor(latencies.length * 0.99));
    const p99Latency = latencies[p99Index] ?? 0;

    // Assert strictly < 300 ms per specification accept criteria
    assert.ok(
      p99Latency < 300,
      `Expected P99 latency < 300 ms, measured ${p99Latency.toFixed(2)} ms`
    );
  });

  it('Acceptance: RLS tenant isolation blocks cross-tenant reads', async () => {
    const resOther = await fetchCmsAppointments({
      tenantId: otherTenantId,
      tab: 'all',
    });

    assert.strictEqual(resOther.items.length, 1);
    const alien = resOther.items[0];
    assert.ok(alien);
    assert.strictEqual(alien.patientName, 'Alien Patient');
    // Verify no appointments from tenantId appear in otherTenantId
    const leaked = resOther.items.some((it) => it.patientName === 'Sunita Sharma');
    assert.strictEqual(leaked, false, 'Tenant A data must not leak to other tenant');
  });
});
