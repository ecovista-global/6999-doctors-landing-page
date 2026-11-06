import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { pool } from '../src/db/index';
import { encrypt } from '../src/lib/crypto';
import { sendEmail, getSentEmails, clearSentEmails } from '../src/lib/resend';
import { processOutboxEvents } from '../src/jobs/notifier';

describe('MT-112: Outbox Notifier Job with Resend Acceptance Suite', () => {
  let testTenantId: string;
  const testClinicSlug = `clinic-mt112-${Date.now()}`;
  const notificationEmail = 'doctor-primary@cliniccare.in';

  before(async () => {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
      const res = await client.query(
        `INSERT INTO tenants (slug, name, status)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [testClinicSlug, 'Care & Cure Polyclinic', 'active']
      );
      testTenantId = res.rows[0].id;

      // Seed clinic settings with custom notification emails
      await client.query(
        `INSERT INTO clinic_settings (
          tenant_id,
          operating_hours,
          notification_emails
        ) VALUES ($1, $2, $3)`,
        [
          testTenantId,
          JSON.stringify({ monday: '09:00-18:00' }),
          [notificationEmail, 'reception@cliniccare.in'],
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
    clearSentEmails();
  });

  it('Acceptance: Direct sendEmail helper dispatches email and records into delivery log', async () => {
    const res = await sendEmail({
      to: notificationEmail,
      subject: 'Test Notification',
      html: '<p>Testing direct email client</p>',
    });

    assert.strictEqual(res.success, true);
    assert.ok(res.id, 'Must return email dispatch id');

    const sent = getSentEmails();
    assert.strictEqual(sent.length, 1);
    const firstSent = sent[0];
    assert.ok(firstSent);
    assert.strictEqual(firstSent.subject, 'Test Notification');
    assert.deepStrictEqual(firstSent.to, [notificationEmail]);
  });

  it('Acceptance: processOutboxEvents drains appointment.created events and sends email to clinic settings recipients', async () => {
    const client = await pool.connect();
    let appointmentId: string;
    let eventId: string;

    try {
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");

      // 1. Seed Appointment with Encrypted PII
      const apptRes = await client.query(
        `INSERT INTO appointments (
          tenant_id,
          patient_name_enc,
          patient_phone_enc,
          patient_email_enc,
          service_name,
          preferred_date,
          preferred_time_slot,
          status,
          consent_at,
          idempotency_key
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), $9)
        RETURNING id`,
        [
          testTenantId,
          encrypt('Pooja Banerjee'),
          encrypt('+919830012345'),
          encrypt('pooja.b@example.com'),
          'Orthopedics Consultation',
          '2026-11-28',
          '11:00 AM - 11:30 AM',
          'pending',
          `idem-job-appt-${randomUUID()}`,
        ]
      );
      appointmentId = apptRes.rows[0].id;

      // 2. Seed Pending Outbox Event
      const outboxRes = await client.query(
        `INSERT INTO outbox_events (
          tenant_id,
          type,
          payload
        ) VALUES ($1, $2, $3)
        RETURNING id`,
        [
          testTenantId,
          'appointment.created',
          JSON.stringify({ appointmentId, tenantId: testTenantId }),
        ]
      );
      eventId = outboxRes.rows[0].id;
    } finally {
      client.release();
    }

    // 3. Run Outbox Worker
    const result = await processOutboxEvents(10);
    assert.ok(result.totalProcessed >= 1);
    assert.ok(result.succeeded >= 1);

    // 4. Verify Email Dispatch
    const sent = getSentEmails();
    const apptEmail = sent.find((e) => e.subject.includes('Orthopedics Consultation'));
    assert.ok(apptEmail, 'Email for Orthopedics Consultation must have been sent');
    assert.ok(apptEmail.html.includes('Pooja Banerjee'), 'Decrypted patient name must appear in email');
    assert.ok(apptEmail.html.includes('+919830012345'), 'Decrypted patient phone must appear in email');
    assert.ok(apptEmail.to.includes(notificationEmail), 'Configured recipient must be in TO list');

    // 5. Verify Outbox Row was marked as dispatched
    const clientCheck = await pool.connect();
    try {
      await clientCheck.query("SELECT set_config('app.bypass_rls', 'on', true)");
      const checkRes = await clientCheck.query(
        'SELECT dispatched_at FROM outbox_events WHERE id = $1',
        [eventId]
      );
      assert.ok(checkRes.rows[0].dispatched_at, 'outbox_events.dispatched_at must be populated');

      // 6. Verify appointment_events audit trail entry
      const auditRes = await clientCheck.query(
        "SELECT * FROM appointment_events WHERE appointment_id = $1 AND actor_id = 'worker_resend'",
        [appointmentId]
      );
      assert.strictEqual(auditRes.rowCount, 1, 'Delivery event must be logged in appointment_events');
    } finally {
      clientCheck.release();
    }
  });

  it('Acceptance: processOutboxEvents drains enquiry.created events and notifies staff', async () => {
    const client = await pool.connect();
    let enquiryId: string;
    let eventId: string;

    try {
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");

      // 1. Seed Enquiry with Encrypted PII
      const enqRes = await client.query(
        `INSERT INTO enquiries (
          tenant_id,
          name_enc,
          phone_enc,
          email_enc,
          message_enc,
          service,
          status,
          consent_at,
          idempotency_key
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, now(), $8)
        RETURNING id`,
        [
          testTenantId,
          encrypt('Amitabh Ghosh'),
          encrypt('+919822233344'),
          encrypt('amitabh.ghosh@clinic.in'),
          encrypt('Do you offer Sunday morning blood tests and ECG?'),
          'Pathology',
          'pending',
          `idem-job-enq-${randomUUID()}`,
        ]
      );
      enquiryId = enqRes.rows[0].id;

      // 2. Seed Pending Outbox Event
      const outboxRes = await client.query(
        `INSERT INTO outbox_events (
          tenant_id,
          type,
          payload
        ) VALUES ($1, $2, $3)
        RETURNING id`,
        [
          testTenantId,
          'enquiry.created',
          JSON.stringify({ enquiryId, tenantId: testTenantId }),
        ]
      );
      eventId = outboxRes.rows[0].id;
    } finally {
      client.release();
    }

    // 3. Run Outbox Worker
    const result = await processOutboxEvents(10);
    assert.ok(result.totalProcessed >= 1);
    assert.ok(result.succeeded >= 1);

    // 4. Verify Email Sent
    const sent = getSentEmails();
    const enqEmail = sent.find((e) => e.subject.includes('Amitabh Ghosh'));
    assert.ok(enqEmail, 'Email for Amitabh Ghosh enquiry must have been sent');
    assert.ok(enqEmail.html.includes('Do you offer Sunday morning blood tests and ECG?'));

    // 5. Verify Outbox dispatched_at
    const clientCheck = await pool.connect();
    try {
      await clientCheck.query("SELECT set_config('app.bypass_rls', 'on', true)");
      const checkRes = await clientCheck.query(
        'SELECT dispatched_at FROM outbox_events WHERE id = $1',
        [eventId]
      );
      assert.ok(checkRes.rows[0].dispatched_at, 'outbox_events.dispatched_at must be populated');
    } finally {
      clientCheck.release();
    }
  });

  it('Acceptance: Empty queue returns 0 processed without error', async () => {
    const result = await processOutboxEvents(10);
    assert.strictEqual(result.failed, 0);
  });
});
