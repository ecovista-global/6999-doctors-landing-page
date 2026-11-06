/**
 * Outbox Notifier Worker (MT-112 per 03 § 2, 06 § 2)
 * Drains transactional outbox events ('appointment.created', 'enquiry.created')
 * and delivers email notifications to doctors and clinic staff via Resend.
 */

import { pool } from '@/db';
import { decrypt } from '@/lib/crypto';
import { sendEmail } from '@/lib/resend';

export interface ProcessOutboxResult {
  totalProcessed: number;
  succeeded: number;
  failed: number;
  errors: Array<{ eventId: string; error: string }>;
}

export async function processOutboxEvents(batchSize: number = 20): Promise<ProcessOutboxResult> {
  const client = await pool.connect();
  const result: ProcessOutboxResult = {
    totalProcessed: 0,
    succeeded: 0,
    failed: 0,
    errors: [],
  };

  try {
    // 1. Fetch pending outbox events (ordered by creation for FIFO processing)
    // Use app.bypass_rls = on so background worker can service all clinic outboxes
    await client.query("SELECT set_config('app.bypass_rls', 'on', true)");

    const pendingRes = await client.query(
      `SELECT id, tenant_id, type, payload, created_at
       FROM outbox_events
       WHERE dispatched_at IS NULL
       ORDER BY created_at ASC
       LIMIT $1`,
      [batchSize]
    );

    if (pendingRes.rowCount === 0) {
      return result;
    }

    result.totalProcessed = pendingRes.rowCount;

    for (const event of pendingRes.rows) {
      try {
        const tenantId = event.tenant_id;
        const payload = typeof event.payload === 'string' ? JSON.parse(event.payload) : event.payload;

        // 2. Fetch Clinic Settings for Notification Recipients
        const settingsRes = await client.query(
          `SELECT notification_emails
           FROM clinic_settings
           WHERE tenant_id = $1
           LIMIT 1`,
          [tenantId]
        );

        let recipients: string[] = ['clinic-alerts@doctorsite.in'];
        if (
          settingsRes.rowCount &&
          settingsRes.rowCount > 0 &&
          Array.isArray(settingsRes.rows[0].notification_emails) &&
          settingsRes.rows[0].notification_emails.length > 0
        ) {
          recipients = settingsRes.rows[0].notification_emails;
        }

        // 3. Handle Event Types
        if (event.type === 'appointment.created') {
          const appointmentId = payload.appointmentId;

          // Query appointment record and decrypt patient contact info
          const apptRes = await client.query(
            `SELECT patient_name_enc, patient_phone_enc, patient_email_enc,
                    service_name, preferred_date, preferred_time_slot, notes
             FROM appointments
             WHERE id = $1`,
            [appointmentId]
          );

          if (apptRes.rowCount && apptRes.rowCount > 0) {
            const appt = apptRes.rows[0];
            const patientName = decrypt(appt.patient_name_enc);
            const patientPhone = decrypt(appt.patient_phone_enc);
            const patientEmail = appt.patient_email_enc ? decrypt(appt.patient_email_enc) : 'Not provided';

            const emailSubject = `New Appointment: ${appt.service_name} on ${appt.preferred_date} (${appt.preferred_time_slot})`;
            const emailHtml = `
              <h2>New Online Appointment Booking</h2>
              <p>You have received a new patient appointment request from your clinic portal:</p>
              <ul>
                <li><strong>Patient Name:</strong> ${patientName}</li>
                <li><strong>Phone Number:</strong> ${patientPhone}</li>
                <li><strong>Email:</strong> ${patientEmail}</li>
                <li><strong>Service:</strong> ${appt.service_name}</li>
                <li><strong>Requested Date:</strong> ${appt.preferred_date}</li>
                <li><strong>Requested Time Slot:</strong> ${appt.preferred_time_slot}</li>
                <li><strong>Notes:</strong> ${appt.notes || 'None'}</li>
              </ul>
              <p><a href="https://app.doctorsite.in/cms/submissions">Open Submissions Dashboard</a></p>
            `;

            const sendRes = await sendEmail({
              to: recipients,
              subject: emailSubject,
              html: emailHtml,
            });

            if (!sendRes.success) {
              throw new Error(sendRes.error || 'Failed to dispatch email via Resend');
            }

            // Log notification dispatch in appointment_events
            await client.query(
              `INSERT INTO appointment_events (
                appointment_id,
                tenant_id,
                actor_id,
                from_status,
                to_status,
                note
              ) VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                appointmentId,
                tenantId,
                'worker_resend',
                'pending',
                'pending',
                `Notification email dispatched to ${recipients.join(', ')} via Resend (ID: ${sendRes.id})`,
              ]
            );
          }
        } else if (event.type === 'enquiry.created') {
          const enquiryId = payload.enquiryId;

          const enqRes = await client.query(
            `SELECT name_enc, phone_enc, email_enc, message_enc, service
             FROM enquiries
             WHERE id = $1`,
            [enquiryId]
          );

          if (enqRes.rowCount && enqRes.rowCount > 0) {
            const enq = enqRes.rows[0];
            const name = decrypt(enq.name_enc);
            const phone = decrypt(enq.phone_enc);
            const email = enq.email_enc ? decrypt(enq.email_enc) : 'Not provided';
            const message = decrypt(enq.message_enc);

            const emailSubject = `New Enquiry from ${name}: ${enq.service || 'General'}`;
            const emailHtml = `
              <h2>New Patient Enquiry</h2>
              <p>A new enquiry was submitted through your clinic website:</p>
              <ul>
                <li><strong>Name:</strong> ${name}</li>
                <li><strong>Phone:</strong> ${phone}</li>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Service / Subject:</strong> ${enq.service || 'General Enquiry'}</li>
                <li><strong>Message:</strong> ${message}</li>
              </ul>
              <p><a href="https://app.doctorsite.in/cms/submissions">View in Clinic Dashboard</a></p>
            `;

            const sendRes = await sendEmail({
              to: recipients,
              subject: emailSubject,
              html: emailHtml,
            });

            if (!sendRes.success) {
              throw new Error(sendRes.error || 'Failed to dispatch email via Resend');
            }
          }
        }

        // 4. Mark Outbox Event as Dispatched
        await client.query(
          `UPDATE outbox_events
           SET dispatched_at = now()
           WHERE id = $1`,
          [event.id]
        );

        result.succeeded += 1;
      } catch (err: any) {
        result.failed += 1;
        result.errors.push({
          eventId: event.id,
          error: err?.message || 'Unknown processing error',
        });
      }
    }

    return result;
  } finally {
    client.release();
  }
}
