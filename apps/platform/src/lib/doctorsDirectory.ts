import type pg from 'pg';
import { CLINICAL_DOCTORS } from '@/lib/doctorsRoster';

export interface DirectoryDoctor {
  id: string;
  tenantId: string;
  slug: string;
  name: string;
  role: string;
  degrees: string;
  college: string | null;
  registration: string;
  department: string;
  specialties: string[];
  experience: string | null;
  schedule: string | null;
  operatingHours: Record<string, any> | null;
  fee: number;
  bio: string | null;
  photoUrl: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export function slugifyDoctorName(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/^dr\.?\s+/i, 'dr-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return base || `doctor-${Date.now()}`;
}

export function parseFeeToInt(fee: string | number): number {
  if (typeof fee === 'number' && Number.isFinite(fee)) {
    return Math.max(0, Math.round(fee));
  }
  const digits = String(fee).replace(/[^\d]/g, '');
  const parsed = parseInt(digits, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 600;
}

export const DEFAULT_DOCTOR_SEED = CLINICAL_DOCTORS.map((doc, idx) => {
  const department =
    idx === 0
      ? 'Internal Medicine'
      : idx === 1
        ? 'Family & Pediatric Medicine'
        : 'Clinical Nutrition';
  const defaultOperatingHours =
    idx === 0
      ? {
          monday: '09:00-20:00',
          tuesday: '09:00-20:00',
          wednesday: '09:00-20:00',
          thursday: '09:00-20:00',
          friday: '09:00-20:00',
          saturday: '09:00-16:00',
          sunday: 'closed',
          slotIntervalMinutes: 30,
        }
      : idx === 1
        ? {
            monday: 'closed',
            tuesday: '14:00-18:00',
            wednesday: 'closed',
            thursday: '14:00-18:00',
            friday: 'closed',
            saturday: '14:00-18:00',
            sunday: 'closed',
            slotIntervalMinutes: 30,
          }
        : {
            monday: '10:00-14:00',
            tuesday: 'closed',
            wednesday: '10:00-14:00',
            thursday: 'closed',
            friday: '10:00-14:00',
            saturday: 'closed',
            sunday: 'closed',
            slotIntervalMinutes: 30,
          };

  return {
    slug: slugifyDoctorName(doc.name),
    name: doc.name,
    role: doc.role,
    degrees: doc.degrees,
    college: doc.college,
    registration: doc.registration,
    department,
    specialties: doc.specialties,
    experience: doc.experience,
    schedule: doc.schedule,
    operatingHours: defaultOperatingHours,
    fee: parseFeeToInt(doc.fee),
    bio: doc.bio,
    photoUrl: idx === 0 ? '/images/dr-maanvita.jpg' : null,
    isActive: true,
    displayOrder: idx,
  };
});

export function mapDoctorRow(row: any): DirectoryDoctor {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    slug: row.slug,
    name: row.name,
    role: row.role,
    degrees: row.degrees,
    college: row.college || null,
    registration: row.registration,
    department: row.department || 'General Medicine',
    specialties: Array.isArray(row.specialties) ? row.specialties : [],
    experience: row.experience || null,
    schedule: row.schedule || null,
    operatingHours: row.operating_hours || null,
    fee: typeof row.fee === 'number' ? row.fee : Number(row.fee || 600),
    bio: row.bio || null,
    photoUrl: row.photo_url || null,
    isActive: row.is_active !== false,
    displayOrder: typeof row.display_order === 'number' ? row.display_order : 0,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

/**
 * Ensures any active tenant has the baseline multi-doctor roster on first read
 * so public and CMS directories immediately render meaningful clinical profiles.
 */
export async function ensureDefaultDoctorsSeeded(
  client: pg.PoolClient,
  tenantId: string
): Promise<void> {
  const countRes = await client.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM doctors WHERE tenant_id = $1`,
    [tenantId]
  );
  if (Number(countRes.rows[0]?.count || '0') > 0) {
    return;
  }

  for (const doc of DEFAULT_DOCTOR_SEED) {
    await client.query(
      `INSERT INTO doctors (
        tenant_id, slug, name, role, degrees, college, registration,
        department, specialties, experience, schedule, operating_hours,
        fee, bio, photo_url, is_active, display_order
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17
      )
      ON CONFLICT (tenant_id, slug) DO NOTHING`,
      [
        tenantId,
        doc.slug,
        doc.name,
        doc.role,
        doc.degrees,
        doc.college,
        doc.registration,
        doc.department,
        doc.specialties,
        doc.experience,
        doc.schedule,
        JSON.stringify(doc.operatingHours),
        doc.fee,
        doc.bio,
        doc.photoUrl,
        doc.isActive,
        doc.displayOrder,
      ]
    );
  }
}

