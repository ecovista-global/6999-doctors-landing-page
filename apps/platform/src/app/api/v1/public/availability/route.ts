import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/db';
import { AppError } from '@/lib/errors';
import { withGateway } from '@/lib/gateway';
import { checkRateLimit } from '@/lib/rate-limit';

// ==============================================================================
// 1. CORS Preflight & Security Headers
// ==============================================================================
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') || '*';
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, X-Request-ID, X-Trace-ID, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// ==============================================================================
// 2. Helper: Generate Slot Windows from Operating Hours
// ==============================================================================
function generateSlots(
  timeRange: string,
  intervalMinutes: number,
  maxSlots: number
): string[] {
  // Example timeRange: "09:00-18:00" or "09:00 AM - 05:00 PM"
  const cleanRange = timeRange.trim().toLowerCase();
  if (cleanRange === 'closed' || !cleanRange.includes('-')) {
    return [];
  }

  const parts = cleanRange.split('-').map((s) => s.trim());
  if (parts.length !== 2 || !parts[0] || !parts[1]) return [];

  const parseToMinutes = (timeStr: string): number => {
    const isPm = timeStr.includes('pm');
    const isAm = timeStr.includes('am');
    const bare = timeStr.replace(/(am|pm)/g, '').trim();
    const [hStr, mStr] = bare.split(':');
    let h = parseInt(hStr || '0', 10);
    const m = parseInt(mStr || '0', 10);
    if (isPm && h < 12) h += 12;
    if (isAm && h === 12) h = 0;
    return h * 60 + m;
  };

  const startMinutes = parseToMinutes(parts[0]);
  const endMinutes = parseToMinutes(parts[1]);
  if (isNaN(startMinutes) || isNaN(endMinutes) || endMinutes <= startMinutes) {
    return [];
  }

  const formatSlot = (min: number): string => {
    const h24 = Math.floor(min / 60);
    const m = min % 60;
    const period = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    const mPadded = m.toString().padStart(2, '0');
    return `${h12.toString().padStart(2, '0')}:${mPadded} ${period}`;
  };

  const slots: string[] = [];
  let current = startMinutes;
  while (current + intervalMinutes <= endMinutes && slots.length < maxSlots) {
    const slotLabel = `${formatSlot(current)} - ${formatSlot(current + intervalMinutes)}`;
    slots.push(slotLabel);
    current += intervalMinutes;
  }

  return slots;
}

// ==============================================================================
// 3. Main GET Handler (/v1/public/availability)
// ==============================================================================
export const GET = withGateway({ auth: 'none' }, async (req: NextRequest, ctx) => {
  const origin = req.headers.get('origin') || '*';
  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';

  // --- 1. Rate Limiting (60/min/IP per 07 § 1) ---
  const rl = checkRateLimit(`avail:${clientIp}`, 60, 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        type: 'https://api.doctorsite.in/errors/e-1501',
        title: 'Rate limited',
        status: 429,
        code: 'E-1501',
        detail: 'Too many availability requests, try later.',
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

  const searchParams = req.nextUrl.searchParams;
  const clinicSlug = searchParams.get('clinicSlug')?.trim();
  const tenantIdParam = searchParams.get('tenantId')?.trim();
  const dateParam = searchParams.get('date')?.trim();

  // Validate date parameter
  const targetDateStr = dateParam || new Date().toISOString().split('T')[0]!;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDateStr)) {
    throw new AppError('E-1101', 'Invalid date format. Expected YYYY-MM-DD');
  }

  const client = await pool.connect();
  try {
    // 2. Resolve Tenant
    let resolvedTenantId = tenantIdParam;

    if (!resolvedTenantId && clinicSlug) {
      const tenantLookup = await client.query(
        'SELECT id FROM tenants WHERE slug = $1 LIMIT 1',
        [clinicSlug]
      );
      if (tenantLookup.rowCount && tenantLookup.rowCount > 0) {
        resolvedTenantId = tenantLookup.rows[0].id;
      }
    }

    if (!resolvedTenantId) {
      const defaultTenantLookup = await client.query(
        'SELECT id FROM tenants WHERE status = $1 ORDER BY created_at ASC LIMIT 1',
        ['active']
      );
      if (defaultTenantLookup.rowCount && defaultTenantLookup.rowCount > 0) {
        resolvedTenantId = defaultTenantLookup.rows[0].id;
      }
    }

    if (!resolvedTenantId) {
      throw new AppError('E-1101', 'Clinic tenant not found');
    }

    // Set RLS scope
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [resolvedTenantId]);

    // 3. Query Clinic Settings
    const settingsRes = await client.query(
      `SELECT operating_hours, slot_interval_minutes, max_daily_slots
       FROM clinic_settings
       WHERE tenant_id = $1
       LIMIT 1`,
      [resolvedTenantId]
    );

    const defaultHours: Record<string, string> = {
      monday: '09:00-18:00',
      tuesday: '09:00-18:00',
      wednesday: '09:00-18:00',
      thursday: '09:00-18:00',
      friday: '09:00-18:00',
      saturday: '09:00-14:00',
      sunday: 'closed',
    };

    const operatingHours: Record<string, string> =
      settingsRes.rowCount && settingsRes.rowCount > 0 && settingsRes.rows[0].operating_hours
        ? (settingsRes.rows[0].operating_hours as Record<string, string>)
        : defaultHours;

    const slotInterval =
      settingsRes.rowCount && settingsRes.rowCount > 0
        ? settingsRes.rows[0].slot_interval_minutes || 30
        : 30;

    const maxDailySlots =
      settingsRes.rowCount && settingsRes.rowCount > 0
        ? settingsRes.rows[0].max_daily_slots || 40
        : 40;

    // 4. Calculate day of week
    const targetDate = new Date(`${targetDateStr}T00:00:00Z`);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = dayNames[targetDate.getUTCDay()] || 'monday';

    let rawDayHours: any = operatingHours[dayOfWeek] || 'closed';
    let dayHours = 'closed';
    if (typeof rawDayHours === 'object' && rawDayHours !== null) {
      dayHours = rawDayHours.closed ? 'closed' : `${rawDayHours.open || '09:00'}-${rawDayHours.close || '18:00'}`;
    } else if (typeof rawDayHours === 'string') {
      dayHours = rawDayHours;
    }
    const isClosed = dayHours.toLowerCase() === 'closed';

    if (isClosed) {
      return NextResponse.json(
        {
          date: targetDateStr,
          dayOfWeek,
          isClosed: true,
          operatingHours: 'Closed',
          slotIntervalMinutes: slotInterval,
          maxDailySlots,
          totalSlots: 0,
          availableSlots: [],
          bookedSlots: [],
        },
        {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': origin,
            'Cache-Control': 'public, max-age=60, s-maxage=60',
          },
        }
      );
    }

    // 5. Generate Total Slots
    const allSlots = generateSlots(dayHours, slotInterval, maxDailySlots);

    // 6. Query Existing Bookings for this clinic and date
    const bookingsRes = await client.query(
      `SELECT preferred_time_slot
       FROM appointments
       WHERE tenant_id = $1
         AND preferred_date = $2
         AND status != 'cancelled'`,
      [resolvedTenantId, targetDateStr]
    );

    const bookedSlotsSet = new Set<string>();
    for (const row of bookingsRes.rows) {
      if (row.preferred_time_slot) {
        bookedSlotsSet.add(row.preferred_time_slot.trim());
      }
    }

    const availableSlots = allSlots.filter((slot) => !bookedSlotsSet.has(slot.trim()));
    const bookedSlots = Array.from(bookedSlotsSet);

    return NextResponse.json(
      {
        date: targetDateStr,
        dayOfWeek,
        isClosed: false,
        operatingHours: dayHours,
        slotIntervalMinutes: slotInterval,
        maxDailySlots,
        totalSlots: allSlots.length,
        availableSlots,
        bookedSlots,
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Cache-Control': 'public, max-age=60, s-maxage=60',
        },
      }
    );
  } finally {
    client.release();
  }
});
