import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { pool } from '../src/db/index';

describe('MT-107: PostgreSQL Row-Level Security (RLS) & Two-Clinic Isolation Suite', () => {
  const tenantAId = randomUUID();
  const tenantBId = randomUUID();

  const tenantASlug = `clinic-a-${Date.now()}`;
  const tenantBSlug = `clinic-b-${Date.now()}`;

  let apptAId: string;
  let apptBId: string;
  let enquiryAId: string;
  let enquiryBId: string;
  let postAId: string;
  let postBId: string;
  let faqAId: string;
  let faqBId: string;
  let testimonialAId: string;
  let testimonialBId: string;

  before(async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Use bypass mode during test setup to seed two distinct clinics
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");

      // 1. Seed Clinic A & Clinic B Tenants
      await client.query(
        'INSERT INTO tenants (id, slug, name, status) VALUES ($1, $2, $3, $4)',
        [tenantAId, tenantASlug, 'Dr. Sharma Cardiology Clinic', 'active']
      );
      await client.query(
        'INSERT INTO tenants (id, slug, name, status) VALUES ($1, $2, $3, $4)',
        [tenantBId, tenantBSlug, 'Dr. Verma Dermatology Care', 'active']
      );

      // 2. Seed Sites
      const siteARes = await client.query(
        'INSERT INTO sites (tenant_id, plan, theme, status) VALUES ($1, $2, $3, $4) RETURNING id',
        [tenantAId, 'professional', 'green', 'published']
      );
      const siteBRes = await client.query(
        'INSERT INTO sites (tenant_id, plan, theme, status) VALUES ($1, $2, $3, $4) RETURNING id',
        [tenantBId, 'professional', 'teal', 'published']
      );
      const siteAId = siteARes.rows[0].id;
      const siteBId = siteBRes.rows[0].id;

      // 3. Seed Domains
      await client.query(
        'INSERT INTO domains (site_id, host, expires_on) VALUES ($1, $2, $3)',
        [siteAId, `sharma-${Date.now()}.example.com`, '2027-11-06']
      );
      await client.query(
        'INSERT INTO domains (site_id, host, expires_on) VALUES ($1, $2, $3)',
        [siteBId, `verma-${Date.now()}.example.com`, '2027-11-06']
      );

      // 4. Seed Content Sheets
      await client.query(
        'INSERT INTO content_sheets (site_id, version, data, created_by) VALUES ($1, $2, $3, $4)',
        [siteAId, 1, JSON.stringify({ clinic: 'Sharma' }), 'system']
      );
      await client.query(
        'INSERT INTO content_sheets (site_id, version, data, created_by) VALUES ($1, $2, $3, $4)',
        [siteBId, 1, JSON.stringify({ clinic: 'Verma' }), 'system']
      );

      // 5. Seed Subscriptions
      await client.query(
        'INSERT INTO subscriptions (tenant_id, plan, current_period_end, renewal_price_paise) VALUES ($1, $2, $3, $4)',
        [tenantAId, 'professional', '2027-11-06', 999900]
      );
      await client.query(
        'INSERT INTO subscriptions (tenant_id, plan, current_period_end, renewal_price_paise) VALUES ($1, $2, $3, $4)',
        [tenantBId, 'professional', '2027-11-06', 999900]
      );

      // 6. Seed Appointments & Events
      const apptARes = await client.query(
        `INSERT INTO appointments (
          tenant_id, patient_name_enc, patient_phone_enc, service_name,
          preferred_date, preferred_time_slot, consent_at, idempotency_key
        ) VALUES ($1, $2, $3, $4, $5, $6, now(), $7) RETURNING id`,
        [tenantAId, 'EncA', 'PhoneA', 'ECG & Echo', '2026-11-10', '10:00 AM', `idem-appt-a-${Date.now()}`]
      );
      apptAId = apptARes.rows[0].id;

      const apptBRes = await client.query(
        `INSERT INTO appointments (
          tenant_id, patient_name_enc, patient_phone_enc, service_name,
          preferred_date, preferred_time_slot, consent_at, idempotency_key
        ) VALUES ($1, $2, $3, $4, $5, $6, now(), $7) RETURNING id`,
        [tenantBId, 'EncB', 'PhoneB', 'Skin Consultation', '2026-11-11', '02:00 PM', `idem-appt-b-${Date.now()}`]
      );
      apptBId = apptBRes.rows[0].id;

      await client.query(
        'INSERT INTO appointment_events (appointment_id, tenant_id, actor_id, from_status, to_status) VALUES ($1, $2, $3, $4, $5)',
        [apptAId, tenantAId, 'system', 'none', 'pending']
      );
      await client.query(
        'INSERT INTO appointment_events (appointment_id, tenant_id, actor_id, from_status, to_status) VALUES ($1, $2, $3, $4, $5)',
        [apptBId, tenantBId, 'system', 'none', 'pending']
      );

      // 7. Seed Enquiries
      const enqARes = await client.query(
        `INSERT INTO enquiries (
          tenant_id, name_enc, phone_enc, message_enc, service, consent_at, idempotency_key
        ) VALUES ($1, $2, $3, $4, $5, now(), $6) RETURNING id`,
        [tenantAId, 'NameA', 'PhoneA', 'MsgA', 'Cardiac Checkup', `idem-enq-a-${Date.now()}`]
      );
      enquiryAId = enqARes.rows[0].id;

      const enqBRes = await client.query(
        `INSERT INTO enquiries (
          tenant_id, name_enc, phone_enc, message_enc, service, consent_at, idempotency_key
        ) VALUES ($1, $2, $3, $4, $5, now(), $6) RETURNING id`,
        [tenantBId, 'NameB', 'PhoneB', 'MsgB', 'Laser Treatment', `idem-enq-b-${Date.now()}`]
      );
      enquiryBId = enqBRes.rows[0].id;

      // 8. Seed Posts (Blog)
      const postARes = await client.query(
        'INSERT INTO posts (tenant_id, title, slug, excerpt) VALUES ($1, $2, $3, $4) RETURNING id',
        [tenantAId, 'Heart Health Guide', 'heart-health', 'Tips for a healthy heart']
      );
      postAId = postARes.rows[0].id;

      const postBRes = await client.query(
        'INSERT INTO posts (tenant_id, title, slug, excerpt) VALUES ($1, $2, $3, $4) RETURNING id',
        [tenantBId, 'Skincare Routine in Winter', 'skincare-winter', 'Daily skincare guide']
      );
      postBId = postBRes.rows[0].id;

      // 9. Seed FAQs
      const faqARes = await client.query(
        'INSERT INTO faqs (tenant_id, question, answer, category) VALUES ($1, $2, $3, $4) RETURNING id',
        [tenantAId, 'Do I need fasting before lipid profile?', 'Yes, 10-12 hours.', 'Prep']
      );
      faqAId = faqARes.rows[0].id;

      const faqBRes = await client.query(
        'INSERT INTO faqs (tenant_id, question, answer, category) VALUES ($1, $2, $3, $4) RETURNING id',
        [tenantBId, 'Is patch testing required?', 'Yes, 24 hours prior.', 'Safety']
      );
      faqBId = faqBRes.rows[0].id;

      // 10. Seed Testimonials
      const testARes = await client.query(
        'INSERT INTO testimonials (tenant_id, patient_initials, review_text, consent_recorded, moderation_status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [tenantAId, 'R.K.', 'Great cardiologist, very thorough diagnosis.', true, 'approved']
      );
      testimonialAId = testARes.rows[0].id;

      const testBRes = await client.query(
        'INSERT INTO testimonials (tenant_id, patient_initials, review_text, consent_recorded, moderation_status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [tenantBId, 'M.S.', 'Acne treatment worked wonders.', true, 'approved']
      );
      testimonialBId = testBRes.rows[0].id;

      // 11. Seed Clinic Settings
      await client.query(
        'INSERT INTO clinic_settings (tenant_id, operating_hours, slot_interval_minutes, max_daily_slots) VALUES ($1, $2, $3, $4)',
        [tenantAId, JSON.stringify({ monday: '09:00-17:00' }), 30, 25]
      );
      await client.query(
        'INSERT INTO clinic_settings (tenant_id, operating_hours, slot_interval_minutes, max_daily_slots) VALUES ($1, $2, $3, $4)',
        [tenantBId, JSON.stringify({ monday: '10:00-19:00' }), 20, 35]
      );

      // 12. Seed Usage Counters
      await client.query(
        'INSERT INTO usage_counters (tenant_id, period_start, appointment_count, enquiry_count) VALUES ($1, $2, $3, $4)',
        [tenantAId, '2026-11-01', 5, 12]
      );
      await client.query(
        'INSERT INTO usage_counters (tenant_id, period_start, appointment_count, enquiry_count) VALUES ($1, $2, $3, $4)',
        [tenantBId, '2026-11-01', 8, 20]
      );

      // 13. Seed Leads & Events
      const leadARes = await client.query(
        'INSERT INTO leads (tenant_id, phone_enc, consent_at, idempotency_key) VALUES ($1, $2, now(), $3) RETURNING id',
        [tenantAId, 'PhoneA', `idem-lead-a-${Date.now()}`]
      );
      await client.query(
        'INSERT INTO lead_events (lead_id, kind) VALUES ($1, $2)',
        [leadARes.rows[0].id, 'received']
      );

      const leadBRes = await client.query(
        'INSERT INTO leads (tenant_id, phone_enc, consent_at, idempotency_key) VALUES ($1, $2, now(), $3) RETURNING id',
        [tenantBId, 'PhoneB', `idem-lead-b-${Date.now()}`]
      );
      await client.query(
        'INSERT INTO lead_events (lead_id, kind) VALUES ($1, $2)',
        [leadBRes.rows[0].id, 'received']
      );

      // 14. Seed Outbox Events
      await client.query(
        'INSERT INTO outbox_events (tenant_id, type, payload) VALUES ($1, $2, $3)',
        [tenantAId, 'appointment.created', JSON.stringify({ clinic: 'Sharma' })]
      );
      await client.query(
        'INSERT INTO outbox_events (tenant_id, type, payload) VALUES ($1, $2, $3)',
        [tenantBId, 'appointment.created', JSON.stringify({ clinic: 'Verma' })]
      );

      // 15. Seed Audit Log
      await client.query(
        'INSERT INTO audit_log (tenant_id, actor_id, action, target) VALUES ($1, $2, $3, $4)',
        [tenantAId, 'dr_sharma', 'UPDATE', 'clinic_settings']
      );
      await client.query(
        'INSERT INTO audit_log (tenant_id, actor_id, action, target) VALUES ($1, $2, $3, $4)',
        [tenantBId, 'dr_verma', 'UPDATE', 'clinic_settings']
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  });

  after(async () => {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
      await client.query('DELETE FROM audit_log WHERE tenant_id IN ($1, $2)', [tenantAId, tenantBId]);
      await client.query('DELETE FROM tenants WHERE id IN ($1, $2)', [tenantAId, tenantBId]);
    } finally {
      client.release();
      await pool.end();
    }
  });

  it('Acceptance: RLS is active (rowsecurity = true) on all 16 tenant tables', async () => {
    const expectedTables = [
      'appointments',
      'appointment_events',
      'enquiries',
      'posts',
      'faqs',
      'testimonials',
      'clinic_settings',
      'usage_counters',
      'sites',
      'domains',
      'content_sheets',
      'leads',
      'lead_events',
      'subscriptions',
      'outbox_events',
      'audit_log',
    ];

    const res = await pool.query(
      `SELECT tablename, rowsecurity
       FROM pg_tables
       WHERE schemaname = 'public' AND tablename = ANY($1)`,
      [expectedTables]
    );

    assert.strictEqual(
      res.rowCount,
      expectedTables.length,
      `Expected ${expectedTables.length} tables to exist in schema`
    );

    for (const row of res.rows) {
      assert.strictEqual(
        row.rowsecurity,
        true,
        `Expected table ${row.tablename} to have rowsecurity active (true)`
      );
    }
  });

  it('Acceptance: Zero cross-reads when queried as Clinic A (app.tenant_id = tenantAId)', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Set session to Clinic A
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantAId]);

      // 1. Appointments: only Clinic A visible
      const apptRes = await client.query('SELECT id, service_name, tenant_id FROM appointments');
      assert.ok(apptRes.rows.length >= 1, 'Clinic A should see its appointments');
      for (const row of apptRes.rows) {
        assert.strictEqual(row.tenant_id, tenantAId, 'Appointment tenant_id must match Clinic A');
      }

      // 2. Appointment Events: only Clinic A visible
      const eventRes = await client.query('SELECT id, tenant_id FROM appointment_events');
      assert.ok(eventRes.rows.length >= 1, 'Clinic A should see its appointment events');
      for (const row of eventRes.rows) {
        assert.strictEqual(row.tenant_id, tenantAId);
      }

      // 3. Enquiries: only Clinic A visible
      const enqRes = await client.query('SELECT id, service, tenant_id FROM enquiries');
      assert.ok(enqRes.rows.length >= 1, 'Clinic A should see its enquiries');
      for (const row of enqRes.rows) {
        assert.strictEqual(row.tenant_id, tenantAId);
      }

      // 4. Posts: only Clinic A visible
      const postRes = await client.query('SELECT id, title, tenant_id FROM posts');
      assert.ok(postRes.rows.length >= 1, 'Clinic A should see its posts');
      for (const row of postRes.rows) {
        assert.strictEqual(row.tenant_id, tenantAId);
      }

      // 5. FAQs: only Clinic A visible
      const faqRes = await client.query('SELECT id, question, tenant_id FROM faqs');
      assert.ok(faqRes.rows.length >= 1, 'Clinic A should see its FAQs');
      for (const row of faqRes.rows) {
        assert.strictEqual(row.tenant_id, tenantAId);
      }

      // 6. Testimonials: only Clinic A visible
      const testRes = await client.query('SELECT id, patient_initials, tenant_id FROM testimonials');
      assert.ok(testRes.rows.length >= 1, 'Clinic A should see its testimonials');
      for (const row of testRes.rows) {
        assert.strictEqual(row.tenant_id, tenantAId);
      }

      // 7. Clinic Settings: only Clinic A visible
      const settingsRes = await client.query('SELECT id, slot_interval_minutes, tenant_id FROM clinic_settings');
      assert.strictEqual(settingsRes.rows.length, 1, 'Clinic A should see exactly 1 settings row');
      assert.strictEqual(settingsRes.rows[0].tenant_id, tenantAId);
      assert.strictEqual(settingsRes.rows[0].slot_interval_minutes, 30);

      // 8. Usage Counters: only Clinic A visible
      const countersRes = await client.query('SELECT tenant_id, appointment_count FROM usage_counters');
      assert.strictEqual(countersRes.rows.length, 1);
      assert.strictEqual(countersRes.rows[0].tenant_id, tenantAId);
      assert.strictEqual(countersRes.rows[0].appointment_count, 5);

      // 9. Sites: only Clinic A visible
      const siteRes = await client.query('SELECT id, theme, tenant_id FROM sites');
      assert.strictEqual(siteRes.rows.length, 1);
      assert.strictEqual(siteRes.rows[0].tenant_id, tenantAId);
      assert.strictEqual(siteRes.rows[0].theme, 'green');

      // 10. Leads: only Clinic A visible
      const leadRes = await client.query('SELECT id, tenant_id FROM leads');
      assert.ok(leadRes.rows.length >= 1);
      for (const row of leadRes.rows) {
        assert.strictEqual(row.tenant_id, tenantAId);
      }

      // 11. Subscriptions: only Clinic A visible
      const subRes = await client.query('SELECT id, tenant_id FROM subscriptions');
      assert.strictEqual(subRes.rows.length, 1);
      assert.strictEqual(subRes.rows[0].tenant_id, tenantAId);

      // 12. Outbox Events: only Clinic A visible
      const outboxRes = await client.query('SELECT id, tenant_id FROM outbox_events');
      assert.ok(outboxRes.rows.length >= 1);
      for (const row of outboxRes.rows) {
        assert.strictEqual(row.tenant_id, tenantAId);
      }

      // 13. Audit Log: only Clinic A visible
      const auditRes = await client.query('SELECT id, tenant_id FROM audit_log');
      assert.ok(auditRes.rows.length >= 1);
      for (const row of auditRes.rows) {
        assert.strictEqual(row.tenant_id, tenantAId);
      }

      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  it('Acceptance: Direct cross-tenant queries for Clinic B records return EMPTY (0 rows)', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Set session to Clinic A
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantAId]);

      // Direct query for Clinic B appointment by ID
      const crossAppt = await client.query('SELECT * FROM appointments WHERE id = $1', [apptBId]);
      assert.strictEqual(crossAppt.rows.length, 0, 'Clinic A must not read Clinic B appointment');

      // Direct query for Clinic B appointment by tenant_id
      const crossApptByTenant = await client.query('SELECT * FROM appointments WHERE tenant_id = $1', [tenantBId]);
      assert.strictEqual(crossApptByTenant.rows.length, 0, 'Direct cross-tenant query by tenant_id must return 0 rows');

      // Direct query for Clinic B enquiry by ID
      const crossEnq = await client.query('SELECT * FROM enquiries WHERE id = $1', [enquiryBId]);
      assert.strictEqual(crossEnq.rows.length, 0, 'Clinic A must not read Clinic B enquiry');

      // Direct query for Clinic B post by ID and slug
      const crossPost = await client.query('SELECT * FROM posts WHERE id = $1', [postBId]);
      assert.strictEqual(crossPost.rows.length, 0, 'Clinic A must not read Clinic B post');
      const crossPostSlug = await client.query('SELECT * FROM posts WHERE slug = $1', ['skincare-winter']);
      assert.strictEqual(crossPostSlug.rows.length, 0, 'Clinic A must not read Clinic B post by slug');

      // Direct query for Clinic B FAQ by ID
      const crossFaq = await client.query('SELECT * FROM faqs WHERE id = $1', [faqBId]);
      assert.strictEqual(crossFaq.rows.length, 0, 'Clinic A must not read Clinic B FAQ');

      // Direct query for Clinic B Testimonial by ID
      const crossTest = await client.query('SELECT * FROM testimonials WHERE id = $1', [testimonialBId]);
      assert.strictEqual(crossTest.rows.length, 0, 'Clinic A must not read Clinic B testimonial');

      // Direct query for Clinic B settings
      const crossSettings = await client.query('SELECT * FROM clinic_settings WHERE tenant_id = $1', [tenantBId]);
      assert.strictEqual(crossSettings.rows.length, 0, 'Clinic A must not read Clinic B clinic_settings');

      // Direct query for Clinic B usage counters
      const crossCounters = await client.query('SELECT * FROM usage_counters WHERE tenant_id = $1', [tenantBId]);
      assert.strictEqual(crossCounters.rows.length, 0, 'Clinic A must not read Clinic B usage_counters');

      // Cross-tenant mutation: UPDATE on Clinic B appointment must affect 0 rows
      const updateRes = await client.query(
        'UPDATE appointments SET service_name = $1 WHERE id = $2',
        ['Malicious Tampering', apptBId]
      );
      assert.strictEqual(updateRes.rowCount, 0, 'Cross-tenant UPDATE must affect 0 rows');

      // Cross-tenant mutation: DELETE on Clinic B appointment must affect 0 rows
      const deleteRes = await client.query('DELETE FROM appointments WHERE id = $1', [apptBId]);
      assert.strictEqual(deleteRes.rowCount, 0, 'Cross-tenant DELETE must affect 0 rows');

      // Cross-tenant mutation: INSERT with Clinic B tenant_id while in Clinic A session must fail WITH CHECK
      await assert.rejects(
        async () => {
          await client.query(
            `INSERT INTO appointments (
              tenant_id, patient_name_enc, patient_phone_enc, service_name,
              preferred_date, preferred_time_slot, consent_at, idempotency_key
            ) VALUES ($1, $2, $3, $4, $5, $6, now(), $7)`,
            [tenantBId, 'FraudName', 'FraudPhone', 'Spoofed Svc', '2026-11-12', '11:00 AM', `idem-fraud-${Date.now()}`]
          );
        },
        (err: any) => {
          assert.match(err.message, /violates row-level security policy/);
          return true;
        },
        'Inserting with a different tenant_id must violate RLS policy'
      );

      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  it('Acceptance: Zero cross-reads when queried as Clinic B (app.tenant_id = tenantBId)', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Set session to Clinic B
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantBId]);

      // 1. Appointments: only Clinic B visible
      const apptRes = await client.query('SELECT id, service_name, tenant_id FROM appointments');
      assert.ok(apptRes.rows.length >= 1, 'Clinic B should see its appointments');
      for (const row of apptRes.rows) {
        assert.strictEqual(row.tenant_id, tenantBId, 'Appointment tenant_id must match Clinic B');
      }

      // Clinic B cannot see Clinic A appointment
      const crossAppt = await client.query('SELECT * FROM appointments WHERE id = $1', [apptAId]);
      assert.strictEqual(crossAppt.rows.length, 0, 'Clinic B must not see Clinic A appointment');

      // 2. Enquiries: only Clinic B visible
      const enqRes = await client.query('SELECT id, service, tenant_id FROM enquiries');
      assert.ok(enqRes.rows.length >= 1, 'Clinic B should see its enquiries');
      for (const row of enqRes.rows) {
        assert.strictEqual(row.tenant_id, tenantBId);
      }

      // 3. Posts: only Clinic B visible
      const postRes = await client.query('SELECT id, title, tenant_id FROM posts');
      assert.ok(postRes.rows.length >= 1, 'Clinic B should see its posts');
      for (const row of postRes.rows) {
        assert.strictEqual(row.tenant_id, tenantBId);
      }
      const crossPostA = await client.query('SELECT * FROM posts WHERE id = $1', [postAId]);
      assert.strictEqual(crossPostA.rows.length, 0, 'Clinic B must not see Clinic A post');

      // 4. Clinic Settings: only Clinic B visible
      const settingsRes = await client.query('SELECT id, slot_interval_minutes, tenant_id FROM clinic_settings');
      assert.strictEqual(settingsRes.rows.length, 1);
      assert.strictEqual(settingsRes.rows[0].tenant_id, tenantBId);
      assert.strictEqual(settingsRes.rows[0].slot_interval_minutes, 20);

      // 5. Usage Counters: only Clinic B visible
      const countersRes = await client.query('SELECT tenant_id, appointment_count FROM usage_counters');
      assert.strictEqual(countersRes.rows.length, 1);
      assert.strictEqual(countersRes.rows[0].tenant_id, tenantBId);
      assert.strictEqual(countersRes.rows[0].appointment_count, 8);

      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  it('Acceptance: Unauthenticated request with enforced RLS (app.enforce_rls = on and app.tenant_id empty) returns 0 rows', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.tenant_id', '', true)");
      await client.query("SELECT set_config('app.enforce_rls', 'on', true)");

      const tablesToTest = [
        'appointments',
        'appointment_events',
        'enquiries',
        'posts',
        'faqs',
        'testimonials',
        'clinic_settings',
        'usage_counters',
        'sites',
        'leads',
        'subscriptions',
        'outbox_events',
      ];

      for (const table of tablesToTest) {
        const res = await client.query(`SELECT * FROM "${table}"`);
        assert.strictEqual(
          res.rows.length,
          0,
          `Enforced RLS query without tenant_id on table ${table} must return 0 rows`
        );
      }

      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  it('Acceptance: Operator bypass mode (app.bypass_rls = on) sees records from all clinics', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");

      const apptRes = await client.query(
        'SELECT id, tenant_id FROM appointments WHERE id IN ($1, $2)',
        [apptAId, apptBId]
      );
      assert.strictEqual(apptRes.rows.length, 2, 'Bypass mode must see appointments from both Clinic A and B');

      const settingsRes = await client.query(
        'SELECT id, tenant_id FROM clinic_settings WHERE tenant_id IN ($1, $2)',
        [tenantAId, tenantBId]
      );
      assert.strictEqual(settingsRes.rows.length, 2, 'Bypass mode must see settings from both clinics');

      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });
});
