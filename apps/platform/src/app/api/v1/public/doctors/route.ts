import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/db';
import { AppError } from '@/lib/errors';
import { withGateway } from '@/lib/gateway';
import { ensureDefaultDoctorsSeeded, mapDoctorRow } from '@/lib/doctorsDirectory';
import { resolvePublicTenantId } from '@/lib/defaultTenant';

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') || '*';
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Request-ID, X-Trace-ID, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export const GET = withGateway({ auth: 'none' }, async (req: NextRequest) => {
  const origin = req.headers.get('origin') || '*';
  const searchParams = req.nextUrl.searchParams;
  const tenantIdParam = searchParams.get('tenantId')?.trim();
  const clinicSlug = searchParams.get('clinicSlug')?.trim();
  const specialty = searchParams.get('specialty')?.trim().toLowerCase();
  const department = searchParams.get('department')?.trim().toLowerCase();

  const client = await pool.connect();
  try {
    const resolvedTenantId = await resolvePublicTenantId(client, tenantIdParam, clinicSlug);

    if (!resolvedTenantId) {
      throw new AppError('E-1101', 'Clinic tenant not found');
    }

    await client.query("SELECT set_config('app.tenant_id', $1, true)", [resolvedTenantId]);
    await ensureDefaultDoctorsSeeded(client, resolvedTenantId);

    const res = await client.query(
      `SELECT *
       FROM doctors
       WHERE tenant_id = $1 AND is_active = true
       ORDER BY display_order ASC, created_at ASC`,
      [resolvedTenantId]
    );

    let items = res.rows.map(mapDoctorRow);
    const departments = Array.from(new Set(items.map((d) => d.department).filter(Boolean)));
    const specialties = Array.from(new Set(items.flatMap((d) => d.specialties).filter(Boolean)));

    if (department && department !== 'all') {
      items = items.filter((d) => d.department.toLowerCase() === department);
    }
    if (specialty && specialty !== 'all') {
      items = items.filter(
        (d) =>
          d.department.toLowerCase().includes(specialty) ||
          d.specialties.some((s) => s.toLowerCase().includes(specialty))
      );
    }

    return NextResponse.json(
      {
        tenantId: resolvedTenantId,
        items,
        departments,
        specialties,
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Cache-Control': 'public, max-age=30, s-maxage=30',
        },
      }
    );
  } finally {
    client.release();
  }
});

