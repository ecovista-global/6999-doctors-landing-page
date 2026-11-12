import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { pool } from '@/db';
import { encrypt } from '@/lib/crypto';
import { AppError } from '@/lib/errors';
import { withGateway } from '@/lib/gateway';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  processIdempotency,
  saveIdempotencyResponse,
  clearIdempotency,
} from '@/lib/idempotency';
import { validateSpamProtection } from '@/lib/spam-protection';
import { appointmentSubmissionSchema } from '@/lib/appointment-schemas';
import { resolvePublicTenantId } from '@/lib/defaultTenant';

// ==============================================================================
// 1. CORS Preflight & Security Headers
// ==============================================================================
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') || '*';
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Idempotency-Key, X-Request-ID, X-Trace-ID, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// ==============================================================================
// 2. Main POST Handler (/v1/public/appointments)
// ==============================================================================
export const POST = withGateway({ auth: 'none' }, async (req: NextRequest, ctx) => {
  const origin = req.headers.get('origin') || '*';
  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';

  // --- 1. Rate Limiting (5/min/IP per SD-002) ---
  const rl = checkRateLimit(clientIp, 5, 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        type: 'https://api.doctorsite.in/errors/e-1501',
        title: 'Rate limited',
        status: 429,
        code: 'E-1501',
        detail: 'Too many attempts, try later.',
        traceId: ctx.traceId,
      },
      {
        status: 429,
        headers: {
          'Content-Type': 'application/problem+json',
          'Retry-After': String(rl.resetSeconds),
          'X-RateLimit-Limit': String(rl.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rl.resetSeconds),
          'Access-Control-Allow-Origin': origin,
        },
      }
    );
  }

  // --- 2. Idempotency Key Validation (SD-001) ---
  const idempotencyKey = req.headers.get('Idempotency-Key')?.trim();
  if (!idempotencyKey) {
    throw new AppError('E-1304', 'Missing Idempotency-Key header on mutating request');
  }

  // Read raw body for SHA-256 hash calculation and idempotency check
  const rawBodyText = await req.text();
  const idemResult = processIdempotency(idempotencyKey, rawBodyText);

  if (idemResult.isReplay && idemResult.record) {
    return NextResponse.json(idemResult.record.body, {
      status: idemResult.record.status,
      headers: {
        ...idemResult.record.headers,
        'X-Idempotent-Replay': 'true',
        'Access-Control-Allow-Origin': origin,
      },
    });
  }

  // --- 3. Parse & Validate Payload with Zod (E-1101) ---
  let jsonPayload: unknown;
  try {
    jsonPayload = JSON.parse(rawBodyText);
  } catch {
    clearIdempotency(idempotencyKey);
    throw new AppError('E-1101', 'Malformed JSON payload');
  }

  const validationResult = appointmentSubmissionSchema.safeParse(jsonPayload);
  if (!validationResult.success) {
    clearIdempotency(idempotencyKey);
    const invalidParams = validationResult.error.errors.map((err) => ({
      name: err.path.join('.'),
      reason: err.message,
    }));
    throw new AppError('E-1101', 'Validation failed for appointment submission', invalidParams);
  }

  const data = validationResult.data;

  // --- 3.1 Bot & Spam Protection (SD-055 / E-1604) ---
  try {
    await validateSpamProtection({
      honeypot: data.honeypot,
      formRenderedAt: data.formRenderedAt,
      turnstileToken: data.turnstileToken,
      clientIp,
    });
  } catch (err) {
    clearIdempotency(idempotencyKey);
    throw err;
  }

  // --- 4. Database Transaction: Insert Encrypted Appointment + Outbox Event ---
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 4.1 Resolve Tenant ID
    const resolvedTenantId = await resolvePublicTenantId(client, data.tenantId, data.clinicSlug);

    if (!resolvedTenantId) {
      throw new AppError('E-1101', 'Unable to resolve clinic tenant for appointment booking');
    }

    // Set transaction-level tenant scoping for RLS compliance (MT-107)
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [resolvedTenantId]);

    // 4.1.5 Optional Slot Conflict Guard (Premium Multi-Doctor & Strict Slot Selection)
    let resolvedDoctorName = data.doctorName || null;
    if (data.doctorId) {
      const docRes = await client.query<{ id: string; name: string }>(
        'SELECT id, name FROM doctors WHERE id = $1 AND tenant_id = $2 LIMIT 1',
        [data.doctorId, resolvedTenantId]
      );
      if (docRes.rowCount && docRes.rows[0]) {
        resolvedDoctorName = resolvedDoctorName || docRes.rows[0].name;
      }
    }

    if (data.doctorId || data.strictSlotCheck) {
      const conflictRes = data.doctorId
        ? await client.query(
            `SELECT id FROM appointments
             WHERE tenant_id = $1
               AND doctor_id = $2
               AND preferred_date = $3
               AND preferred_time_slot = $4
               AND status IN ('pending', 'confirmed')
             LIMIT 1
             FOR UPDATE`,
            [resolvedTenantId, data.doctorId, data.preferredDate, data.preferredTimeSlot]
          )
        : await client.query(
            `SELECT id FROM appointments
             WHERE tenant_id = $1
               AND doctor_id IS NULL
               AND preferred_date = $2
               AND preferred_time_slot = $3
               AND status IN ('pending', 'confirmed')
             LIMIT 1
             FOR UPDATE`,
            [resolvedTenantId, data.preferredDate, data.preferredTimeSlot]
          );

      if (conflictRes.rowCount && conflictRes.rowCount > 0) {
        await client.query('ROLLBACK');
        clearIdempotency(idempotencyKey);
        throw new AppError(
          'E-1608',
          `Time slot "${data.preferredTimeSlot}" on ${data.preferredDate}${resolvedDoctorName ? ` with ${resolvedDoctorName}` : ''} is already booked`
        );
      }
    }

    // 4.2 Check Database Idempotency Constraint Backstop
    const existingAppt = await client.query(
      'SELECT id, service_name, created_at FROM appointments WHERE idempotency_key = $1',
      [idempotencyKey]
    );

    if (existingAppt.rowCount && existingAppt.rowCount > 0) {
      await client.query('COMMIT');
      const replayPayload = {
        status: 'accepted',
        appointmentId: existingAppt.rows[0].id,
        serviceName: existingAppt.rows[0].service_name,
        message: 'Appointment request received and queued for confirmation.',
      };

      saveIdempotencyResponse(idempotencyKey, rawBodyText, 202, replayPayload);

      return NextResponse.json(replayPayload, {
        status: 202,
        headers: {
          'X-Idempotent-Replay': 'true',
          'Access-Control-Allow-Origin': origin,
        },
      });
    }

    // 4.3 Encrypt Patient PII using AES-256-GCM (MT-108 / DPDP Act)
    const patientNameEnc = encrypt(data.patientName);
    const patientPhoneEnc = encrypt(data.patientPhone);
    const patientEmailEnc = data.patientEmail ? encrypt(data.patientEmail) : null;

    // Hash client IP address for DPDP compliance (no raw IP stored in database)
    const ipHash = crypto.createHash('sha256').update(clientIp).digest('hex');

    // 4.4 Insert Appointment Record
    const insertApptRes = await client.query(
      `INSERT INTO appointments (
        tenant_id,
        patient_name_enc,
        patient_phone_enc,
        patient_email_enc,
        doctor_id,
        doctor_name,
        service_name,
        preferred_date,
        preferred_time_slot,
        status,
        notes,
        consent_at,
        idempotency_key,
        ip_hash
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now(), $12, $13)
      RETURNING id, created_at`,
      [
        resolvedTenantId,
        patientNameEnc,
        patientPhoneEnc,
        patientEmailEnc,
        data.doctorId || null,
        resolvedDoctorName,
        data.serviceName,
        data.preferredDate,
        data.preferredTimeSlot,
        'pending',
        data.notes || null,
        idempotencyKey,
        ipHash,
      ]
    );

    const createdAppointment = insertApptRes.rows[0];
    const appointmentId = createdAppointment.id;

    // 4.5 Insert Transactional Outbox Event for Asynchronous Notification Worker (F-10)
    await client.query(
      `INSERT INTO outbox_events (
        tenant_id,
        type,
        payload
      ) VALUES ($1, $2, $3)`,
      [
        resolvedTenantId,
        'appointment.created',
        JSON.stringify({
          appointmentId,
          tenantId: resolvedTenantId,
          doctorId: data.doctorId || null,
          doctorName: resolvedDoctorName,
          serviceName: data.serviceName,
          preferredDate: data.preferredDate,
          preferredTimeSlot: data.preferredTimeSlot,
          createdAt: createdAppointment.created_at,
        }),
      ]
    );

    // 4.6 Insert Initial Appointment Lifecycle Event
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
        resolvedTenantId,
        'public_form',
        'none',
        'pending',
        resolvedDoctorName
          ? `Online booking request for ${resolvedDoctorName} (${data.preferredTimeSlot})`
          : 'Initial online booking request received from patient portal',
      ]
    );

    await client.query('COMMIT');

    const successPayload = {
      status: 'accepted',
      appointmentId,
      doctorId: data.doctorId || null,
      doctorName: resolvedDoctorName,
      serviceName: data.serviceName,
      preferredDate: data.preferredDate,
      preferredTimeSlot: data.preferredTimeSlot,
      message: 'Appointment request received and queued for confirmation.',
    };

    // Cache completed response in idempotency store
    saveIdempotencyResponse(idempotencyKey, rawBodyText, 202, successPayload);

    return NextResponse.json(successPayload, {
      status: 202,
      headers: {
        Location: `/v1/public/appointments/${appointmentId}`,
        'X-RateLimit-Limit': String(rl.limit),
        'X-RateLimit-Remaining': String(rl.remaining),
        'Access-Control-Allow-Origin': origin,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    clearIdempotency(idempotencyKey);
    throw err;
  } finally {
    client.release();
  }
});
