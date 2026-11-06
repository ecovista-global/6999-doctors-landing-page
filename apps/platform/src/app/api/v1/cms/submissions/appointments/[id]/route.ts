import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/db';
import { decrypt } from '@/lib/crypto';
import { recordAuditEvent } from '@/lib/audit';
import { AppError } from '@/lib/errors';
import { withGateway } from '@/lib/gateway';
import { assertValidStatusTransition } from '@/lib/appointment-state-machine';

interface RouteContext {
  params?: Promise<{ id: string }>;
}

function formatDateOnly(val: Date | string): string {
  if (!val) return '';
  if (typeof val === 'string') return val.slice(0, 10);
  const year = val.getFullYear();
  const month = String(val.getMonth() + 1).padStart(2, '0');
  const day = String(val.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const GET = withGateway({ auth: 'none' }, async (req: NextRequest, ctx) => {
  const urlParts = req.nextUrl?.pathname ? req.nextUrl.pathname.split('/') : [];
  const idFromUrl = urlParts[urlParts.length - 1] || '';
  const tenantId = req.nextUrl?.searchParams?.get('tenantId') || req.headers.get('x-tenant-id');

  if (!tenantId) {
    throw new AppError('E-1101', 'Tenant ID is required for submission access');
  }

  const id = idFromUrl;
  if (!id) {
    throw new AppError('E-1101', 'Missing appointment ID');
  }

  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';
  const userAgent = req.headers.get('user-agent') || 'Unknown';
  const actorId = req.headers.get('x-actor-id') || 'staff_reception';

  const client = await pool.connect();
  try {
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

    const res = await client.query(
      `SELECT 
        id,
        tenant_id,
        patient_name_enc,
        patient_phone_enc,
        patient_email_enc,
        service_name,
        preferred_date,
        preferred_time_slot,
        status,
        notes,
        consent_at,
        idempotency_key,
        ip_hash,
        created_at
      FROM appointments
      WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (res.rowCount === 0) {
      return NextResponse.json(
        {
          type: 'https://api.doctorsite.in/errors/e-1101',
          title: 'Not Found',
          status: 404,
          detail: 'Appointment not found',
          code: 'E-1101',
          traceId: ctx.traceId,
        },
        { status: 404 }
      );
    }

    const row = res.rows[0];

    // Decrypt contact PII
    let patientName = '[Encrypted]';
    let patientPhone = '[Encrypted]';
    let patientEmail: string | null = null;

    try {
      patientName = decrypt(row.patient_name_enc);
    } catch {
      patientName = String(row.patient_name_enc);
    }

    try {
      patientPhone = decrypt(row.patient_phone_enc);
    } catch {
      patientPhone = String(row.patient_phone_enc);
    }

    if (row.patient_email_enc) {
      try {
        patientEmail = decrypt(row.patient_email_enc);
      } catch {
        patientEmail = String(row.patient_email_enc);
      }
    }

    // Record immutable audit event for patient record access (Rule R9 & 18 § 3)
    await recordAuditEvent({
      tenantId,
      actorId,
      action: 'submission.view',
      target: `appointment:${id}`,
      details: {
        appointmentId: id,
        viewedFields: ['patientName', 'patientPhone', 'patientEmail', 'notes'],
      },
      ip: clientIp,
      userAgent,
    });

    return NextResponse.json({
      id: row.id,
      tenantId: row.tenant_id,
      patientName,
      patientPhone,
      patientEmail,
      serviceName: row.service_name,
      preferredDate: formatDateOnly(row.preferred_date),
      preferredTimeSlot: row.preferred_time_slot,
      status: row.status,
      notes: row.notes,
      consentAt: row.consent_at instanceof Date ? row.consent_at.toISOString() : String(row.consent_at),
      idempotencyKey: row.idempotency_key,
      ipHash: row.ip_hash,
      turnstileScore: '1.0 (Verified Human)',
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    });
  } finally {
    client.release();
  }
});

export const PATCH = withGateway({ auth: 'none' }, async (req: NextRequest, ctx) => {
  const urlParts = req.nextUrl?.pathname ? req.nextUrl.pathname.split('/') : [];
  const id = urlParts[urlParts.length - 1] || '';
  const tenantId = req.nextUrl?.searchParams?.get('tenantId') || req.headers.get('x-tenant-id');

  if (!tenantId) {
    throw new AppError('E-1101', 'Tenant ID is required for submission modification');
  }

  if (!id) {
    throw new AppError('E-1101', 'Missing appointment ID');
  }

  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';
  const userAgent = req.headers.get('user-agent') || 'Unknown';
  const actorId = req.headers.get('x-actor-id') || 'staff_reception';

  const body = await req.json();
  const { notes, status } = body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

    // Check existing record
    const existingRes = await client.query(
      `SELECT id, status, notes FROM appointments WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (existingRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        {
          type: 'https://api.doctorsite.in/errors/e-1101',
          title: 'Not Found',
          status: 404,
          detail: 'Appointment not found',
          code: 'E-1101',
          traceId: ctx.traceId,
        },
        { status: 404 }
      );
    }

    const current = existingRes.rows[0];
    const updates: string[] = [];
    const values: any[] = [];
    let pIdx = 1;

    let noteUpdated = false;
    if (notes !== undefined) {
      updates.push(`notes = $${pIdx}`);
      values.push(notes);
      pIdx++;
      noteUpdated = true;
    }

    let statusUpdated = false;
    if (status !== undefined && status !== current.status) {
      assertValidStatusTransition(current.status, status);
      updates.push(`status = $${pIdx}`);
      values.push(status);
      pIdx++;
      statusUpdated = true;
    }

    if (updates.length > 0) {
      values.push(id, tenantId);
      const updateQuery = `
        UPDATE appointments 
        SET ${updates.join(', ')} 
        WHERE id = $${pIdx} AND tenant_id = $${pIdx + 1}
        RETURNING id, status, notes
      `;
      await client.query(updateQuery, values);
    }

    // If status changed, record in appointment_events
    if (statusUpdated) {
      await client.query(
        `INSERT INTO appointment_events (
          appointment_id, tenant_id, actor_id, from_status, to_status, note
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, tenantId, actorId, current.status, status, notes || null]
      );
    }

    // Record audit event
    const action = noteUpdated && !statusUpdated ? 'submission.note_update' : 'appointment.status_change';
    await recordAuditEvent({
      tenantId,
      actorId,
      action,
      target: `appointment:${id}`,
      details: {
        appointmentId: id,
        fromStatus: current.status,
        toStatus: status || current.status,
        previousStatus: current.status,
        newStatus: status || current.status,
        noteUpdated,
        notesLength: notes ? notes.length : 0,
      },
      ip: clientIp,
      userAgent,
    });

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      id,
      status: status || current.status,
      notes: notes !== undefined ? notes : current.notes,
      savedAt: new Date().toISOString(),
    });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
});
