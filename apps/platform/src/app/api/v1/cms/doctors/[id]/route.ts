import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pool } from '@/db';
import { withGateway } from '@/lib/gateway';
import { AppError } from '@/lib/errors';
import { recordAuditEvent } from '@/lib/audit';
import { mapDoctorRow } from '@/lib/doctorsDirectory';

const UpdateDoctorSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  role: z.string().min(2).max(160).optional(),
  degrees: z.string().min(2).max(160).optional(),
  college: z.string().max(200).optional().nullable(),
  registration: z.string().min(2).max(120).optional(),
  department: z.string().min(2).max(100).optional(),
  specialties: z.array(z.string().min(1).max(80)).min(1).max(12).optional(),
  experience: z.string().max(100).optional().nullable(),
  schedule: z.string().max(260).optional().nullable(),
  operatingHours: z.record(z.string(), z.unknown()).optional().nullable(),
  fee: z.coerce.number().int().min(0).max(50000).optional(),
  bio: z.string().max(1500).optional().nullable(),
  photoUrl: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
  displayOrder: z.coerce.number().int().min(0).max(999).optional(),
});

function extractDoctorId(req: NextRequest): string {
  const parts = req.nextUrl?.pathname ? req.nextUrl.pathname.split('/') : [];
  return parts[parts.length - 1] || '';
}

export const PUT = withGateway({ auth: 'none' }, async (req: NextRequest) => {
  const tenantId = req.nextUrl?.searchParams?.get('tenantId') || req.headers.get('x-tenant-id');
  const id = extractDoctorId(req);

  if (!tenantId || !id) {
    throw new AppError('E-1101', 'Tenant ID and Doctor ID are required');
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new AppError('E-1101', 'Invalid JSON body');
  }

  const parsed = UpdateDoctorSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError('E-1101', parsed.error.issues[0]?.message || 'Invalid doctor update payload');
  }

  const data = parsed.data;
  const sets: string[] = ['updated_at = now()'];
  const values: unknown[] = [];
  let idx = 1;

  const mapField = (col: string, val: unknown, isJson = false) => {
    sets.push(`${col} = $${idx++}`);
    values.push(isJson && val !== null ? JSON.stringify(val) : val);
  };

  if (data.name !== undefined) mapField('name', data.name);
  if (data.role !== undefined) mapField('role', data.role);
  if (data.degrees !== undefined) mapField('degrees', data.degrees);
  if (data.college !== undefined) mapField('college', data.college);
  if (data.registration !== undefined) mapField('registration', data.registration);
  if (data.department !== undefined) mapField('department', data.department);
  if (data.specialties !== undefined) mapField('specialties', data.specialties);
  if (data.experience !== undefined) mapField('experience', data.experience);
  if (data.schedule !== undefined) mapField('schedule', data.schedule);
  if (data.operatingHours !== undefined) mapField('operating_hours', data.operatingHours, true);
  if (data.fee !== undefined) mapField('fee', data.fee);
  if (data.bio !== undefined) mapField('bio', data.bio);
  if (data.photoUrl !== undefined) mapField('photo_url', data.photoUrl);
  if (data.isActive !== undefined) mapField('is_active', data.isActive);
  if (data.displayOrder !== undefined) mapField('display_order', data.displayOrder);

  values.push(id, tenantId);

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

    const res = await client.query(
      `UPDATE doctors
       SET ${sets.join(', ')}
       WHERE id = $${idx} AND tenant_id = $${idx + 1}
       RETURNING *`,
      values
    );

    if (res.rowCount === 0) {
      await client.query('ROLLBACK');
      throw new AppError('E-1101', 'Doctor profile not found');
    }

    const item = mapDoctorRow(res.rows[0]);
    await recordAuditEvent({
      tenantId,
      actorId,
      action: 'doctor.update',
      target: `doctor:${item.id}`,
      details: { name: item.name, updatedFields: Object.keys(data) },
      ip: clientIp,
      userAgent,
    });

    await client.query('COMMIT');
    return NextResponse.json({ item });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
});

export const DELETE = withGateway({ auth: 'none' }, async (req: NextRequest) => {
  const tenantId = req.nextUrl?.searchParams?.get('tenantId') || req.headers.get('x-tenant-id');
  const id = extractDoctorId(req);

  if (!tenantId || !id) {
    throw new AppError('E-1101', 'Tenant ID and Doctor ID are required');
  }

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

    const res = await client.query(
      `DELETE FROM doctors WHERE id = $1 AND tenant_id = $2 RETURNING id, name`,
      [id, tenantId]
    );
    if (res.rowCount === 0) {
      await client.query('ROLLBACK');
      throw new AppError('E-1101', 'Doctor profile not found');
    }

    await recordAuditEvent({
      tenantId,
      actorId,
      action: 'doctor.delete',
      target: `doctor:${id}`,
      details: { name: res.rows[0].name },
      ip: clientIp,
      userAgent,
    });

    await client.query('COMMIT');
    return NextResponse.json({ deleted: true, id });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
});

