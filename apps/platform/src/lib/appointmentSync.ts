import type { PoolClient } from 'pg';
import { pool } from '@/db';
import { encrypt } from '@/lib/crypto';
import { DEFAULT_DEMO_TENANT_ID } from '@/lib/defaultTenant';
import { getAppointments, type AppointmentRecord } from '@/lib/contentStore';

function mapStoreStatusToDb(
  status: AppointmentRecord['status']
): 'pending' | 'confirmed' | 'completed' | 'cancelled' {
  switch (status) {
    case 'confirmed':
      return 'confirmed';
    case 'completed':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'pending';
  }
}

function mapShiftToTimeSlot(apt: AppointmentRecord): string {
  if (apt.preferredTimeSlot && apt.preferredTimeSlot.trim()) {
    return apt.preferredTimeSlot.trim();
  }
  switch (apt.shift) {
    case 'Afternoon':
      return '02:00 PM';
    case 'Evening':
      return '06:00 PM';
    default:
      return '10:00 AM';
  }
}

function resolveCreatedAt(raw?: string): Date {
  if (!raw) return new Date();
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

async function upsertAppointmentRow(
  client: PoolClient,
  tenantId: string,
  apt: AppointmentRecord
): Promise<void> {
  const idemKey = `store-${apt.id}`;
  const dbStatus = mapStoreStatusToDb(apt.status);
  const timeSlot = mapShiftToTimeSlot(apt);
  const preferredDate = /^\d{4}-\d{2}-\d{2}$/.test(apt.preferredDate)
    ? apt.preferredDate
    : new Date().toISOString().slice(0, 10);
  const createdAt = resolveCreatedAt(apt.createdAt);

  let doctorId: string | null = null;
  if (apt.doctor) {
    const docRes = await client.query<{ id: string }>(
      `SELECT id FROM doctors WHERE tenant_id = $1 AND LOWER(name) = LOWER($2) LIMIT 1`,
      [tenantId, apt.doctor.trim()]
    );
    doctorId = docRes.rows[0]?.id ?? null;
  }

  await client.query(
    `INSERT INTO appointments (
      tenant_id,
      patient_name_enc,
      patient_phone_enc,
      patient_email_enc,
      doctor_id,
      doctor_name,
      service_name,
      preferred_date,
      preferred_time_slot,
      status,
      notes,
      consent_at,
      idempotency_key,
      created_at
    ) VALUES ($1, $2, $3, NULL, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    ON CONFLICT (idempotency_key) DO UPDATE SET
      status = EXCLUDED.status,
      notes = COALESCE(EXCLUDED.notes, appointments.notes)`,
    [
      tenantId,
      encrypt(apt.patientName.trim()),
      encrypt(apt.phone.trim()),
      doctorId,
      apt.doctor || null,
      apt.service || 'General Consultation',
      preferredDate,
      timeSlot,
      dbStatus,
      apt.notes || null,
      createdAt,
      idemKey,
      createdAt,
    ]
  );
}

/**
 * Syncs a single contentStore appointment to PostgreSQL for the demo clinic tenant.
 * Errors are logged and suppressed so file-backed booking never fails if DB is busy.
 */
export async function syncAppointmentToPostgres(
  apt: AppointmentRecord,
  tenantId: string = DEFAULT_DEMO_TENANT_ID
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
    await upsertAppointmentRow(client, tenantId, apt);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.warn('syncAppointmentToPostgres skipped:', err);
  } finally {
    client.release();
  }
}

/**
 * Idempotently ensures existing contentStore appointments exist in PostgreSQL
 * for the active demo clinic tenant so `/cms/submissions` reflects all public bookings.
 */
export async function backfillContentStoreAppointments(tenantId: string): Promise<void> {
  if (tenantId !== DEFAULT_DEMO_TENANT_ID) return;
  const list = getAppointments();
  if (list.length === 0) return;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
    for (const apt of list) {
      await upsertAppointmentRow(client, tenantId, apt);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.warn('backfillContentStoreAppointments skipped:', err);
  } finally {
    client.release();
  }
}

