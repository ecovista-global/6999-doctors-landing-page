import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pool } from '@/db';
import { withGateway } from '@/lib/gateway';
import { AppError } from '@/lib/errors';
import { recordAuditEvent } from '@/lib/audit';
import {
  ensureDefaultDoctorsSeeded,
  mapDoctorRow,
  slugifyDoctorName,
} from '@/lib/doctorsDirectory';

const CreateDoctorSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(80).optional(),
  role: z.string().min(2).max(160),
  degrees: z.string().min(2).max(160),
  college: z.string().max(200).optional().nullable(),
  registration: z.string().min(2).max(120),
  department: z.string().min(2).max(100).default('Internal Medicine'),
  specialties: z.array(z.string().min(1).max(80)).min(1).max(12),
  experience: z.string().max(100).optional().nullable(),
  schedule: z.string().max(260).optional().nullable(),
  operatingHours: z.record(z.string(), z.unknown()).optional().nullable(),
  fee: z.coerce.number().int().min(0).max(50000).default(600),
  bio: z.string().max(1500).optional().nullable(),
  photoUrl: z.string().max(500).optional().nullable(),
  isActive: z.boolean().default(true),
  displayOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export const GET = withGateway({ auth: 'none' }, async (req: NextRequest, ctx) => {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') || req.headers.get('x-tenant-id');
  const specialty = searchParams.get('specialty')?.trim().toLowerCase();
  const department = searchParams.get('department')?.trim().toLowerCase();

  if (!tenantId) {
    throw new AppError('E-1101', 'Tenant ID is required for doctors directory access');
  }

  const client = await pool.connect();
  try {
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
    await ensureDefaultDoctorsSeeded(client, tenantId);

    const res = await client.query(
      `SELECT *
       FROM doctors
       WHERE tenant_id = $1
       ORDER BY display_order ASC, created_at ASC`,
      [tenantId]
    );

    let items = res.rows.map(mapDoctorRow);
    const allDepartments = Array.from(new Set(items.map((d) => d.department).filter(Boolean)));
    const allSpecialties = Array.from(new Set(items.flatMap((d) => d.specialties).filter(Boolean)));

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
        items,
        departments: allDepartments,
        specialties: allSpecialties,
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'X-Trace-ID': ctx.traceId,
        },
      }
    );
  } finally {
    client.release();
  }
});

export const POST = withGateway({ auth: 'none' }, async (req: NextRequest, ctx) => {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') || req.headers.get('x-tenant-id');
  if (!tenantId) {
    throw new AppError('E-1101', 'Tenant ID is required for creating a doctor profile');
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new AppError('E-1101', 'Invalid JSON payload');
  }

  const parsed = CreateDoctorSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError('E-1101', parsed.error.issues[0]?.message || 'Validation failed');
  }

  const data = parsed.data;
  const slug = data.slug ? slugifyDoctorName(data.slug) : slugifyDoctorName(data.name);

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

    // Ensure unique slug per tenant cleanly
    const existingSlug = await client.query(
      `SELECT id FROM doctors WHERE tenant_id = $1 AND slug = $2 LIMIT 1`,
      [tenantId, slug]
    );
    const finalSlug = existingSlug.rowCount && existingSlug.rowCount > 0 ? `${slug}-${Date.now().toString().slice(-4)}` : slug;

    const inserted = await client.query(
      `INSERT INTO doctors (
        tenant_id, slug, name, role, degrees, college, registration,
        department, specialties, experience, schedule, operating_hours,
        fee, bio, photo_url, is_active, display_order
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17
      )
      RETURNING *`,
      [
        tenantId,
        finalSlug,
        data.name,
        data.role,
        data.degrees,
        data.college || null,
        data.registration,
        data.department,
        data.specialties,
        data.experience || null,
        data.schedule || null,
        data.operatingHours ? JSON.stringify(data.operatingHours) : null,
        data.fee,
        data.bio || null,
        data.photoUrl || null,
        data.isActive,
        data.displayOrder,
      ]
    );

    const item = mapDoctorRow(inserted.rows[0]);

    await recordAuditEvent({
      tenantId,
      actorId,
      action: 'doctor.create',
      target: `doctor:${item.id}`,
      details: { name: item.name, department: item.department, specialties: item.specialties },
      ip: clientIp,
      userAgent,
    });

    await client.query('COMMIT');
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
});

