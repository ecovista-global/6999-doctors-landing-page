import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/db';
import { withGateway } from '@/lib/gateway';

export const GET = withGateway({ auth: 'none' }, async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') || req.headers.get('x-tenant-id') || '00000000-0000-0000-0000-000000000001';

  const client = await pool.connect();
  try {
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

    // DPDP Act: Only serve approved reviews with documented consent
    const res = await client.query(
      `SELECT id, patient_initials, review_text, rating, treatment, display_order, moderation_status, consent_recorded, created_at
       FROM testimonials
       WHERE tenant_id = $1 AND moderation_status = 'approved' AND consent_recorded = true
       ORDER BY display_order ASC, created_at DESC`,
      [tenantId]
    );

    const testimonials = res.rows.map((r) => ({
      id: r.id,
      patientInitials: r.patient_initials,
      reviewText: r.review_text,
      rating: r.rating,
      treatment: r.treatment || 'General Consultation',
      moderationStatus: r.moderation_status,
      consentRecorded: r.consent_recorded,
      date: r.created_at ? r.created_at.toISOString().slice(0, 10) : 'Recent',
      verified: true,
    }));

    return NextResponse.json({ testimonials });
  } finally {
    client.release();
  }
});

