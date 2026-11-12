import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/db';
import { recordAuditEvent } from '@/lib/audit';
import { AppError } from '@/lib/errors';
import { withGateway } from '@/lib/gateway';
import {
  ALLOWED_PAGE_SLOTS,
  PREMIUM_ALLOWED_PAGE_SLOTS,
  PAGE_SLOTS_METADATA,
  PREMIUM_PAGE_SLOTS_METADATA,
  validatePageSlots,
} from '@ecodigitech/content-schema';

export const GET = withGateway({ auth: 'none' }, async (req: NextRequest, ctx) => {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') || req.headers.get('x-tenant-id');

  if (!tenantId) {
    throw new AppError('E-1101', 'Tenant ID is required for pages access');
  }

  const client = await pool.connect();
  try {
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

    const siteRes = await client.query<{ plan: string }>(
      `SELECT plan FROM sites WHERE tenant_id = $1 LIMIT 1`,
      [tenantId]
    );
    const sitePlan = siteRes.rows[0]?.plan === 'premium' ? 'premium' : 'professional';
    const maxAllowedPages = sitePlan === 'premium' ? 10 : 7;
    const allPageSlots = sitePlan === 'premium' ? PREMIUM_PAGE_SLOTS_METADATA : PAGE_SLOTS_METADATA;
    const defaultPages = sitePlan === 'premium' ? [...PREMIUM_ALLOWED_PAGE_SLOTS] : [...ALLOWED_PAGE_SLOTS];

    const res = await client.query(
      `SELECT enabled_pages FROM clinic_settings WHERE tenant_id = $1 LIMIT 1`,
      [tenantId]
    );

    const enabledPages =
      res.rowCount && res.rows[0].enabled_pages && res.rows[0].enabled_pages.length > 0
        ? res.rows[0].enabled_pages
        : defaultPages;

    return NextResponse.json({
      plan: sitePlan,
      enabledPages,
      maxAllowedPages,
      allPageSlots,
    });
  } finally {
    client.release();
  }
});

export const PUT = withGateway({ auth: 'none' }, async (req: NextRequest, ctx) => {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') || req.headers.get('x-tenant-id');

  if (!tenantId) {
    throw new AppError('E-1101', 'Tenant ID is required for updating pages');
  }

  const body = await req.json();
  const { enabledPages } = body;

  if (!Array.isArray(enabledPages)) {
    throw new AppError('E-1101', 'enabledPages must be an array of page slot strings');
  }

  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';
  const userAgent = req.headers.get('user-agent') || 'Unknown';
  const actorId = req.headers.get('x-actor-id') || 'doctor_owner';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

    const siteRes = await client.query<{ plan: string }>(
      `SELECT plan FROM sites WHERE tenant_id = $1 LIMIT 1`,
      [tenantId]
    );
    const requestedPlan = body.plan === 'premium' ? 'premium' : undefined;
    const sitePlan: 'professional' | 'premium' =
      requestedPlan || (siteRes.rows[0]?.plan === 'premium' ? 'premium' : 'professional');
    const maxAllowedPages = sitePlan === 'premium' ? 10 : 7;

    // 1. Plan-aware page limit check (7 for Professional ₹18,999; 10 for Premium ₹24,999)
    if (enabledPages.length > maxAllowedPages) {
      await client.query('ROLLBACK');
      throw new AppError(
        'E-1601',
        `Page limit exceeded: maximum of ${maxAllowedPages} pages allowed on the ${sitePlan === 'premium' ? 'Premium' : 'Professional'} Clinic plan, received ${enabledPages.length}`
      );
    }

    // 2. Validate allowed page slot names for the active plan
    const validation = validatePageSlots(enabledPages, sitePlan);
    if (!validation.valid) {
      await client.query('ROLLBACK');
      throw new AppError('E-1101', validation.error || 'Invalid page slots');
    }

    // Upsert into clinic_settings
    await client.query(
      `INSERT INTO clinic_settings (
        tenant_id, operating_hours, enabled_pages, updated_at
      ) VALUES (
        $1,
        '{"monday":{"open":"09:00","close":"18:00","closed":false}}'::jsonb,
        $2,
        NOW()
      )
      ON CONFLICT (tenant_id) DO UPDATE SET
        enabled_pages = EXCLUDED.enabled_pages,
        updated_at = NOW()`,
      [tenantId, enabledPages]
    );

    // Update draft content sheet if it exists
    await client.query(
      `UPDATE content_sheets
       SET data = jsonb_set(COALESCE(data, '{}'::jsonb), '{enabledPages}', $1::jsonb)
       WHERE site_id IN (SELECT id FROM sites WHERE tenant_id = $2)`,
      [JSON.stringify(enabledPages), tenantId]
    );

    // Record immutable audit event
    await recordAuditEvent({
      tenantId,
      actorId,
      action: 'pages.update',
      target: 'clinic_settings:enabled_pages',
      details: {
        plan: sitePlan,
        enabledPages,
        pageCount: enabledPages.length,
        maxAllowedPages,
      },
      ip: clientIp,
      userAgent,
    });

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      plan: sitePlan,
      enabledPages,
      pageCount: enabledPages.length,
      maxAllowedPages,
      savedAt: new Date().toISOString(),
    });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
});
