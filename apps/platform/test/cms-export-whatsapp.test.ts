import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { pool } from '../src/db/index';
import { encrypt } from '../src/lib/crypto';
import { getAuditTrail } from '../src/lib/audit';
import { escapeCsvField, generateAppointmentsCsv } from '../src/lib/csv-export';
import {
  normalizePhoneForWhatsApp,
  generateWhatsAppConfirmationUrl,
} from '../src/components/cms/WhatsAppLink';
import { GET } from '../src/app/api/v1/cms/submissions/export/route';

describe('MT-118: CSV Export & WhatsApp Direct Confirmation Acceptance Suite', () => {
  const tenantAId = randomUUID();
  const tenantBId = randomUUID();

  before(async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");

      // 1. Seed Clinics
      await client.query(
        'INSERT INTO tenants (id, slug, name, status) VALUES ($1, $2, $3, $4)',
        [tenantAId, `export-clinic-a-${Date.now()}`, 'Apex Heart Institute', 'active']
      );
      await client.query(
        'INSERT INTO tenants (id, slug, name, status) VALUES ($1, $2, $3, $4)',
        [tenantBId, `export-clinic-b-${Date.now()}`, 'Nova Dental Clinic', 'active']
      );

      // 2. Seed Records for Clinic A (including quotes and commas to test RFC-4180)
      const p1Name = encrypt('Sharma, Dr. Rajesh');
      const p1Phone = encrypt('+919876543210');
      const p1Email = encrypt('rajesh.sharma@example.com');
      await client.query(
        `INSERT INTO appointments (
          tenant_id, patient_name_enc, patient_phone_enc, patient_email_enc,
          service_name, preferred_date, preferred_time_slot, status, notes,
          consent_at, idempotency_key
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6, $7, $8, NOW(), $9)`,
        [
          tenantAId,
          p1Name,
          p1Phone,
          p1Email,
          'Cardiology Screening',
          '10:30 AM',
          'confirmed',
          'Patient said: "First time visit, please have wheelchair"',
          randomUUID(),
        ]
      );

      // Seed Record for Clinic B
      const p2Name = encrypt('Dentistry Patient');
      const p2Phone = encrypt('+919800000000');
      await client.query(
        `INSERT INTO appointments (
          tenant_id, patient_name_enc, patient_phone_enc,
          service_name, preferred_date, preferred_time_slot, status,
          consent_at, idempotency_key
        ) VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6, NOW(), $7)`,
        [tenantBId, p2Name, p2Phone, 'Teeth Whitening', '02:00 PM', 'pending', randomUUID()]
      );

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  });

  after(async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
      await client.query("SELECT set_config('app.bypass_audit_immutability', 'on', true)");
      await client.query('DELETE FROM appointments WHERE tenant_id IN ($1, $2)', [tenantAId, tenantBId]);
      await client.query('DELETE FROM audit_log WHERE tenant_id IN ($1, $2)', [tenantAId, tenantBId]);
      await client.query('DELETE FROM tenants WHERE id IN ($1, $2)', [tenantAId, tenantBId]);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  describe('Unit: RFC-4180 CSV Escaping', () => {
    it('escapes fields containing commas, double quotes, and newlines', () => {
      // Normal field
      assert.strictEqual(escapeCsvField('Cardiology'), 'Cardiology');

      // Field with comma
      assert.strictEqual(escapeCsvField('Sharma, Dr. Rajesh'), '"Sharma, Dr. Rajesh"');

      // Field with double quotes (must double quotes per RFC-4180)
      assert.strictEqual(
        escapeCsvField('Said "Hello"'),
        '"Said ""Hello"""'
      );

      // Field with newline
      assert.strictEqual(
        escapeCsvField("First line\nSecond line"),
        '"First line\nSecond line"'
      );

      // Null or undefined
      assert.strictEqual(escapeCsvField(null), '');
      assert.strictEqual(escapeCsvField(undefined), '');
    });
  });

  describe('Unit: WhatsApp URL Generator', () => {
    it('normalizes 10-digit Indian phone numbers to international 91 format', () => {
      assert.strictEqual(normalizePhoneForWhatsApp('9876543210'), '919876543210');
      assert.strictEqual(normalizePhoneForWhatsApp('+91 98765-43210'), '919876543210');
      assert.strictEqual(normalizePhoneForWhatsApp('09876543210'), '919876543210');
    });

    it('generates prefilled wa.me URL matching 18 § 3 template', () => {
      const url = generateWhatsAppConfirmationUrl({
        phone: '9876543210',
        patientName: 'Pooja Hegde',
        clinicName: 'Apollo Heart Clinic',
        date: '2026-11-10',
        timeSlot: '11:00 AM',
      });

      assert.ok(url.startsWith('https://wa.me/919876543210?text='));
      const textParam = new URL(url).searchParams.get('text');
      assert.strictEqual(
        textParam,
        'Dear Pooja Hegde, your appointment at Apollo Heart Clinic is Confirmed for 2026-11-10 at 11:00 AM.'
      );
    });
  });

  describe('Integration: CSV Export API Route', () => {
    it('Acceptance: CSV export downloads decrypted submissions with RFC-4180 headers in < 3 s', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/v1/cms/submissions/export?tenantId=${tenantAId}`,
        {
          method: 'GET',
          headers: {
            'x-tenant-id': tenantAId,
            'x-actor-id': 'reception_admin',
            'user-agent': 'Antigravity Test Agent',
          },
        }
      );

      const startTime = performance.now();
      const res = await GET(req);
      const durationMs = performance.now() - startTime;

      // Acceptance criterion: CSV downloads < 3 s (3000 ms)
      assert.ok(durationMs < 3000, `CSV download took ${durationMs}ms, expected < 3000ms`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('Content-Type'), 'text/csv; charset=utf-8');
      assert.ok(
        res.headers.get('Content-Disposition')?.includes('attachment; filename="clinic-appointments-')
      );

      const csvText = await res.text();
      assert.ok(csvText.includes('Appointment ID,Patient Name,Phone,Email,Service'));
      // Verify patient name with comma was escaped per RFC-4180
      assert.ok(csvText.includes('"Sharma, Dr. Rajesh"'));
      assert.ok(csvText.includes('+919876543210'));
      assert.ok(csvText.includes('rajesh.sharma@example.com'));
      assert.ok(csvText.includes('Cardiology Screening'));
      // Verify quotes in notes were doubled
      assert.ok(csvText.includes('""First time visit, please have wheelchair""'));

      // Acceptance criterion: Export is logged in immutable audit trail
      const auditTrail = await getAuditTrail({
        tenantId: tenantAId,
        target: 'appointments',
      });
      const exportLog = auditTrail.find((l) => l.action === 'submission.export_csv');
      assert.ok(exportLog, 'Export event must be recorded in audit_log');
      assert.strictEqual(exportLog.actorId, 'reception_admin');
    });

    it('Acceptance: CSV export respects tenant boundary under RLS (zero leakage across tenants)', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/v1/cms/submissions/export?tenantId=${tenantBId}`,
        {
          method: 'GET',
          headers: {
            'x-tenant-id': tenantBId,
          },
        }
      );

      const res = await GET(req);
      assert.strictEqual(res.status, 200);

      const csvText = await res.text();
      // Should contain Clinic B data
      assert.ok(csvText.includes('Dentistry Patient'));
      // Must NOT contain Clinic A data
      assert.strictEqual(csvText.includes('Rajesh'), false, 'Clinic A patient must not appear in Clinic B export');
    });
  });
});
