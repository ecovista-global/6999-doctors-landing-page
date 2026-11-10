import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/db';
import { recordAuditEvent } from '@/lib/audit';
import { AppError } from '@/lib/errors';
import { withGateway } from '@/lib/gateway';

function getIdFromRequest(req: NextRequest): string {
  const pathname = req.nextUrl?.pathname || new URL(req.url).pathname;
  const parts = pathname.split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
}

export const GET = withGateway({ auth: 'none' }, async (req: NextRequest) => {
  const id = getIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') || req.headers.get('x-tenant-id') || '00000000-0000-0000-0000-000000000001';

  if (!id) {
    throw new AppError('E-1101', 'Testimonial ID is required');
  }

  const client = await pool.connect();
  try {
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

    const res = await client.query(
      `SELECT id, patient_initials, review_text, rating, treatment,
              consent_recorded, moderation_status, display_order, created_at
       FROM testimonials
       WHERE id = $1 AND tenant_id = $2
       LIMIT 1`,
      [id, tenantId]
    );

    if (res.rowCount === 0) {
      throw new AppError('E-1101', `Testimonial not found with ID ${id}`);
    }

    const r = res.rows[0];
    return NextResponse.json({
      testimonial: {
        id: r.id,
        patientInitials: r.patient_initials,
        reviewText: r.review_text,
        rating: r.rating,
        treatment: r.treatment,
        consentRecorded: r.consent_recorded,
        moderationStatus: r.moderation_status,
        displayOrder: r.display_order,
        createdAt: r.created_at ? r.created_at.toISOString() : undefined,
      },
    });
  } finally {
    client.release();
  }
});

export const PUT = withGateway({ auth: 'none' }, async (req: NextRequest) => {
  const id = getIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') || req.headers.get('x-tenant-id') || '00000000-0000-0000-0000-000000000001';

  if (!id) {
    throw new AppError('E-1101', 'Testimonial ID is required');
  }

  const body = await req.json();
  const {
    patientInitials,
    reviewText,
    rating,
    treatment,
    consentRecorded,
    moderationStatus,
    displayOrder,
  } = body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

    // Check existing record
    const existingRes = await client.query(
      `SELECT consent_recorded, moderation_status FROM testimonials WHERE id = $1 AND tenant_id = $2 LIMIT 1`,
      [id, tenantId]
    );

    if (existingRes.rowCount === 0) {
      throw new AppError('E-1101', `Testimonial not found with ID ${id}`);
    }

    const current = existingRes.rows[0];
    const targetConsent = consentRecorded !== undefined ? Boolean(consentRecorded) : current.consent_recorded;
    const targetStatus = moderationStatus !== undefined ? moderationStatus : current.moderation_status;

    // Enforce DPDP Act consent gate
    if (targetStatus === 'approved' && !targetConsent) {
      throw new AppError('E-1606', 'Patient consent must be verified and recorded before publishing a review per DPDP Act 2023 § 6.');
    }

    const res = await client.query(
      `UPDATE testimonials
       SET patient_initials = COALESCE($1, patient_initials),
           review_text = COALESCE($2, review_text),
           rating = COALESCE($3, rating),
           treatment = COALESCE($4, treatment),
           consent_recorded = $5,
           moderation_status = $6,
           display_order = COALESCE($7, display_order)
       WHERE id = $8 AND tenant_id = $9
       RETURNING id, patient_initials, review_text, rating, treatment,
                 consent_recorded, moderation_status, display_order, created_at`,
      [
        patientInitials ? patientInitials.trim() : null,
        reviewText ? reviewText.trim() : null,
        rating !== undefined ? Math.min(5, Math.max(1, Number(rating))) : null,
        treatment ? treatment.trim() : null,
        targetConsent,
        targetStatus,
        displayOrder !== undefined ? Number(displayOrder) : null,
        id,
        tenantId,
      ]
    );

    const updated = res.rows[0];

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '127.0.0.1';
    await recordAuditEvent({
      tenantId,
      actorId: req.headers.get('x-actor-id') || 'clinic_staff',
      action: 'testimonial.updated',
      target: `testimonial:${id}`,
      details: {
        moderationStatus: updated.moderation_status,
        consentRecorded: updated.consent_recorded,
      },
      ip: clientIp,
      userAgent: req.headers.get('user-agent'),
    });

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      testimonial: {
        id: updated.id,
        patientInitials: updated.patient_initials,
        reviewText: updated.review_text,
        rating: updated.rating,
        treatment: updated.treatment,
        consentRecorded: updated.consent_recorded,
        moderationStatus: updated.moderation_status,
        displayOrder: updated.display_order,
        createdAt: updated.created_at ? updated.created_at.toISOString() : undefined,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

export const DELETE = withGateway({ auth: 'none' }, async (req: NextRequest) => {
  const id = getIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') || req.headers.get('x-tenant-id') || '00000000-0000-0000-0000-000000000001';

  if (!id) {
    throw new AppError('E-1101', 'Testimonial ID is required');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

    const res = await client.query(
      `DELETE FROM testimonials WHERE id = $1 AND tenant_id = $2 RETURNING id, patient_initials`,
      [id, tenantId]
    );

    if (res.rowCount === 0) {
      throw new AppError('E-1101', `Testimonial not found with ID ${id}`);
    }

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '127.0.0.1';
    await recordAuditEvent({
      tenantId,
      actorId: req.headers.get('x-actor-id') || 'clinic_staff',
      action: 'testimonial.deleted',
      target: `testimonial:${id}`,
      details: { patientInitials: res.rows[0].patient_initials },
      ip: clientIp,
      userAgent: req.headers.get('user-agent'),
    });

    await client.query('COMMIT');

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

