import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/db';
import { recordAuditEvent } from '@/lib/audit';
import { AppError } from '@/lib/errors';
import { withGateway } from '@/lib/gateway';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_SLOT_INTERVALS = [15, 30, 45, 60];

const DEFAULT_OPERATING_HOURS = {
  monday: { open: '09:00', close: '18:00', closed: false },
  tuesday: { open: '09:00', close: '18:00', closed: false },
  wednesday: { open: '09:00', close: '18:00', closed: false },
  thursday: { open: '09:00', close: '18:00', closed: false },
  friday: { open: '09:00', close: '18:00', closed: false },
  saturday: { open: '09:00', close: '14:00', closed: false },
  sunday: { open: '09:00', close: '14:00', closed: true },
};

export const GET = withGateway({ auth: 'none' }, async (req: NextRequest, ctx) => {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') || req.headers.get('x-tenant-id');

  if (!tenantId) {
    throw new AppError('E-1101', 'Tenant ID is required for settings access');
  }

  const client = await pool.connect();
  try {
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

    const res = await client.query(
      `SELECT operating_hours, slot_interval_minutes, max_daily_slots, notification_emails, spam_threshold, enabled_pages
       FROM clinic_settings
       WHERE tenant_id = $1
       LIMIT 1`,
      [tenantId]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({
        operatingHours: DEFAULT_OPERATING_HOURS,
        slotIntervalMinutes: 30,
        maxDailySlots: 40,
        notificationEmails: [],
        spamThreshold: 5,
        enabledPages: ['home', 'about', 'services', 'doctors', 'testimonials-faq', 'blog', 'contact'],
      });
    }

    const row = res.rows[0];
    return NextResponse.json({
      operatingHours: row.operating_hours || DEFAULT_OPERATING_HOURS,
      slotIntervalMinutes: row.slot_interval_minutes || 30,
      maxDailySlots: row.max_daily_slots || 40,
      notificationEmails: row.notification_emails || [],
      spamThreshold: row.spam_threshold || 5,
      enabledPages: row.enabled_pages || ['home', 'about', 'services', 'doctors', 'testimonials-faq', 'blog', 'contact'],
    });
  } finally {
    client.release();
  }
});

export const PUT = withGateway({ auth: 'none' }, async (req: NextRequest, ctx) => {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') || req.headers.get('x-tenant-id');

  if (!tenantId) {
    throw new AppError('E-1101', 'Tenant ID is required for updating settings');
  }

  const body = await req.json();
  const {
    operatingHours,
    slotIntervalMinutes = 30,
    maxDailySlots = 40,
    notificationEmails = [],
    spamThreshold = 5,
    enabledPages,
  } = body;

  // 1. Validate slot interval
  if (!ALLOWED_SLOT_INTERVALS.includes(Number(slotIntervalMinutes))) {
    throw new AppError(
      'E-1101',
      `Invalid slot interval ${slotIntervalMinutes}. Allowed intervals: ${ALLOWED_SLOT_INTERVALS.join(', ')} minutes`
    );
  }

  // 2. Validate notification emails list (max 3, format check)
  if (!Array.isArray(notificationEmails)) {
    throw new AppError('E-1101', 'notificationEmails must be an array');
  }
  if (notificationEmails.length > 3) {
    throw new AppError('E-1101', 'Maximum of 3 notification emails permitted');
  }
  for (const email of notificationEmails) {
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      throw new AppError('E-1101', `Invalid email format: '${email}'`);
    }
  }
  const cleanEmails = notificationEmails.map((e: string) => e.trim().toLowerCase());

  // 3. Validate spam threshold
  const thresholdNum = Number(spamThreshold);
  if (isNaN(thresholdNum) || thresholdNum < 1 || thresholdNum > 10) {
    throw new AppError('E-1101', 'spamThreshold must be between 1 and 10');
  }

  // 4. Validate operating hours format
  const hoursToSave = operatingHours || DEFAULT_OPERATING_HOURS;

  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';
  const userAgent = req.headers.get('user-agent') || 'Unknown';
  const actorId = req.headers.get('x-actor-id') || 'clinic_owner';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

    const upsertQuery = `
      INSERT INTO clinic_settings (
        tenant_id, operating_hours, slot_interval_minutes, max_daily_slots,
        notification_emails, spam_threshold, enabled_pages, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (tenant_id) DO UPDATE SET
        operating_hours = EXCLUDED.operating_hours,
        slot_interval_minutes = EXCLUDED.slot_interval_minutes,
        max_daily_slots = EXCLUDED.max_daily_slots,
        notification_emails = EXCLUDED.notification_emails,
        spam_threshold = EXCLUDED.spam_threshold,
        enabled_pages = COALESCE(EXCLUDED.enabled_pages, clinic_settings.enabled_pages),
        updated_at = NOW()
      RETURNING operating_hours, slot_interval_minutes, max_daily_slots, notification_emails, spam_threshold, enabled_pages
    `;

    const res = await client.query(upsertQuery, [
      tenantId,
      JSON.stringify(hoursToSave),
      slotIntervalMinutes,
      maxDailySlots,
      cleanEmails,
      thresholdNum,
      enabledPages || null,
    ]);

    // Record immutable audit event
    await recordAuditEvent({
      tenantId,
      actorId,
      action: 'settings.update',
      target: 'clinic_settings',
      details: {
        slotIntervalMinutes,
        maxDailySlots,
        notificationEmailsCount: cleanEmails.length,
        spamThreshold: thresholdNum,
      },
      ip: clientIp,
      userAgent,
    });

    await client.query('COMMIT');

    const saved = res.rows[0];
    return NextResponse.json({
      success: true,
      operatingHours: saved.operating_hours,
      slotIntervalMinutes: saved.slot_interval_minutes,
      maxDailySlots: saved.max_daily_slots,
      notificationEmails: saved.notification_emails,
      spamThreshold: saved.spam_threshold,
      enabledPages: saved.enabled_pages,
      savedAt: new Date().toISOString(),
    });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
});
