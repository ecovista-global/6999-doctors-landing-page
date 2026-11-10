import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/db';
import { recordAuditEvent } from '@/lib/audit';
import { AppError } from '@/lib/errors';
import { withGateway } from '@/lib/gateway';

export const GET = withGateway({ auth: 'none' }, async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') || req.headers.get('x-tenant-id') || '00000000-0000-0000-0000-000000000001';
  const status = searchParams.get('status');

  const client = await pool.connect();
  try {
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

    let query = `
      SELECT id, patient_initials, review_text, rating, treatment,
             consent_recorded, moderation_status, display_order, created_at
      FROM testimonials
      WHERE tenant_id = $1
    `;
    const params: any[] = [tenantId];

    if (status && status !== 'all' && status !== 'All') {
      params.push(status);
      query += ` AND moderation_status = $${params.length}`;
    }

    query += ` ORDER BY display_order ASC, created_at DESC`;

    const res = await client.query(query, params);
    const testimonials = res.rows.map((r) => ({
      id: r.id,
      patientInitials: r.patient_initials,
      reviewText: r.review_text,
      rating: r.rating,
      treatment: r.treatment || 'General Consultation',
      consentRecorded: r.consent_recorded,
      moderationStatus: r.moderation_status,
      displayOrder: r.display_order,
      createdAt: r.created_at ? r.created_at.toISOString() : undefined,
    }));

    return NextResponse.json({ testimonials });
  } finally {
    client.release();
  }
});

export const POST = withGateway({ auth: 'none' }, async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') || req.headers.get('x-tenant-id') || '00000000-0000-0000-0000-000000000001';

  const body = await req.json();
  const {
    patientInitials,
    reviewText,
    rating = 5,
    treatment = 'General Consultation',
    consentRecorded = false,
    moderationStatus = 'draft',
    displayOrder = 0,
  } = body;

  if (!patientInitials || typeof patientInitials !== 'string' || !patientInitials.trim()) {
    throw new AppError('E-1101', 'Patient initials are required');
  }
  if (!reviewText || typeof reviewText !== 'string' || !reviewText.trim()) {
    throw new AppError('E-1101', 'Review text is required');
  }

  // Enforce DPDP Act: cannot approve review without recorded consent
  if (moderationStatus === 'approved' && !consentRecorded) {
    throw new AppError('E-1606', 'Patient consent must be verified and recorded before publishing a review per DPDP Act 2023 § 6.');
  }

  const cleanInitials = patientInitials.trim().slice(0, 30);
  const cleanRating = Math.min(5, Math.max(1, Number(rating) || 5));

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

    const res = await client.query(
      `INSERT INTO testimonials (
         tenant_id, patient_initials, review_text, rating, treatment,
         consent_recorded, moderation_status, display_order, created_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING id, patient_initials, review_text, rating, treatment,
                 consent_recorded, moderation_status, display_order, created_at`,
      [
        tenantId,
        cleanInitials,
        reviewText.trim(),
        cleanRating,
        treatment.trim(),
        Boolean(consentRecorded),
        moderationStatus,
        Number(displayOrder) || 0,
      ]
    );

    const newRev = res.rows[0];

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '127.0.0.1';
    await recordAuditEvent({
      tenantId,
      actorId: req.headers.get('x-actor-id') || 'clinic_staff',
      action: 'testimonial.created',
      target: `testimonial:${newRev.id}`,
      details: {
        patientInitials: newRev.patient_initials,
        rating: newRev.rating,
        moderationStatus: newRev.moderation_status,
        consentRecorded: newRev.consent_recorded,
      },
      ip: clientIp,
      userAgent: req.headers.get('user-agent'),
    });

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      testimonial: {
        id: newRev.id,
        patientInitials: newRev.patient_initials,
        reviewText: newRev.review_text,
        rating: newRev.rating,
        treatment: newRev.treatment,
        consentRecorded: newRev.consent_recorded,
        moderationStatus: newRev.moderation_status,
        displayOrder: newRev.display_order,
        createdAt: newRev.created_at.toISOString(),
      },
    }, { status: 201 });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

