import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { NextRequest } from 'next/server';
import { pool } from '../src/db/index';
import { PLAN_PRICING, computeGstBreakdown, createBillingOrder } from '../src/lib/billing';
import {
  PREMIUM_ALLOWED_PAGE_SLOTS,
  validatePageSlots,
} from '@ecodigitech/content-schema';
import { resetRateLimitStore } from '../src/lib/rate-limit';
import { resetIdempotencyStore } from '../src/lib/idempotency';
import { clearSentEmails, getSentEmails } from '../src/lib/resend';
import { GET as getCmsPages, PUT as putCmsPages } from '../src/app/api/v1/cms/pages/route';
import { GET as getCmsDoctors, POST as postCmsDoctors } from '../src/app/api/v1/cms/doctors/route';
import { PUT as putCmsDoctor, DELETE as deleteCmsDoctor } from '../src/app/api/v1/cms/doctors/[id]/route';
import { GET as getPublicDoctors } from '../src/app/api/v1/public/doctors/route';
import { GET as getAvailability } from '../src/app/api/v1/public/availability/route';
import { POST as postPublicAppointment } from '../src/app/api/v1/public/appointments/route';
import {
  GET as getAppointmentDetail,
  PATCH as patchAppointmentDetail,
} from '../src/app/api/v1/cms/submissions/appointments/[id]/route';
import { GET as getOperations, POST as postOperations } from '../src/app/api/v1/cms/operations/route';

describe('Premium Clinic (₹24,999 / ₹14,999) End-to-End Suite', () => {
  const tenantId = crypto.randomUUID();
  const tenantSlug = `premium-test-${Date.now()}`;
  const otherTenantId = crypto.randomUUID();

  before(async () => {
    resetIdempotencyStore();
    resetRateLimitStore();
    clearSentEmails();

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
      await client.query(
        'INSERT INTO tenants (id, slug, name, status) VALUES ($1, $2, $3, $4), ($5, $6, $7, $8)',
        [
          tenantId,
          tenantSlug,
          'MedSphere Premium Multispecialty',
          'active',
          otherTenantId,
          `other-${Date.now()}`,
          'Isolated Clinic B',
          'active',
        ]
      );
      await client.query(
        'INSERT INTO sites (tenant_id, plan, status) VALUES ($1, $2, $3)',
        [tenantId, 'premium', 'published']
      );
      await client.query(
        `INSERT INTO clinic_settings (tenant_id, operating_hours, slot_interval_minutes, max_daily_slots, notification_emails)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          tenantId,
          JSON.stringify({
            monday: '09:00-18:00',
            tuesday: '09:00-18:00',
            wednesday: '09:00-18:00',
            thursday: '09:00-18:00',
            friday: '09:00-18:00',
            saturday: '09:00-14:00',
            sunday: 'closed',
          }),
          30,
          40,
          ['desk@medsphere-premium.in'],
        ]
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
      await client.query('DELETE FROM appointment_events WHERE tenant_id IN ($1, $2)', [tenantId, otherTenantId]);
      await client.query('DELETE FROM appointments WHERE tenant_id IN ($1, $2)', [tenantId, otherTenantId]);
      await client.query('DELETE FROM ops_requests WHERE tenant_id IN ($1, $2)', [tenantId, otherTenantId]);
      await client.query('DELETE FROM doctors WHERE tenant_id IN ($1, $2)', [tenantId, otherTenantId]);
      await client.query('DELETE FROM outbox_events WHERE tenant_id IN ($1, $2)', [tenantId, otherTenantId]);
      await client.query('DELETE FROM audit_log WHERE tenant_id IN ($1, $2)', [tenantId, otherTenantId]);
      await client.query('DELETE FROM tenants WHERE id IN ($1, $2)', [tenantId, otherTenantId]);
      await client.query('COMMIT');
    } catch {
      await client.query('ROLLBACK');
    } finally {
      client.release();
      await pool.end();
    }
  });

  beforeEach(() => {
    resetRateLimitStore();
    resetIdempotencyStore();
  });

  it('Pricing: supports Premium Clinic ₹24,999 initial and ₹14,999 renewal with 18% GST split', async () => {
    assert.equal(PLAN_PRICING.premium.initialPaise, 2499900);
    assert.equal(PLAN_PRICING.premium.renewalPaise, 1499900);

    const initialGst = computeGstBreakdown(PLAN_PRICING.premium.initialPaise);
    assert.equal(initialGst.taxablePaise + initialGst.gstPaise, 2499900);

    const order = await createBillingOrder({
      tenantId,
      plan: 'premium',
      billingCycle: 'initial',
    });
    assert.equal(order.amountPaise, 2499900);
    assert.equal(order.planLabel, 'Premium Clinic Plan (Multi-Doctor)');

    const renewal = await createBillingOrder({
      tenantId,
      plan: 'premium',
      billingCycle: 'renewal',
    });
    assert.equal(renewal.amountPaise, 1499900);
  });

  it('Pages: enforces up to 10 responsive pages on Premium plan while preserving Professional 7-page cap', async () => {
    assert.equal(PREMIUM_ALLOWED_PAGE_SLOTS.length, 10);
    const ok10 = validatePageSlots([...PREMIUM_ALLOWED_PAGE_SLOTS], 'premium');
    assert.equal(ok10.valid, true);

    const failPro = validatePageSlots([...PREMIUM_ALLOWED_PAGE_SLOTS].slice(0, 8), 'professional');
    assert.equal(failPro.valid, false);

    const putReq = new NextRequest(`http://localhost:3000/api/v1/cms/pages?tenantId=${tenantId}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', 'x-tenant-id': tenantId },
      body: JSON.stringify({ enabledPages: [...PREMIUM_ALLOWED_PAGE_SLOTS] }),
    });
    const putRes = await putCmsPages(putReq);
    assert.equal(putRes.status, 200);

    const getReq = new NextRequest(`http://localhost:3000/api/v1/cms/pages?tenantId=${tenantId}`);
    const getRes = await getCmsPages(getReq);
    assert.equal(getRes.status, 200);
    const data = await getRes.json();
    assert.equal(data.plan, 'premium');
    assert.equal(data.maxAllowedPages, 10);
    assert.equal(data.enabledPages.length, 10);
  });

  it('Multi-Doctor Directory: creates, filters, updates, deletes doctors with strict tenant isolation', async () => {
    const createReq = new NextRequest(`http://localhost:3000/api/v1/cms/doctors?tenantId=${tenantId}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-tenant-id': tenantId },
      body: JSON.stringify({
        name: 'Dr. Kavita Iyer',
        role: 'Senior Cardiologist',
        degrees: 'MBBS, MD, DM (Cardiology)',
        registration: 'DMC-88421',
        department: 'Cardiology',
        specialties: ['Preventive Cardiology', 'Echocardiography', 'Hypertension'],
        fee: 900,
        operatingHours: {
          monday: '10:00-14:00',
          tuesday: '10:00-14:00',
          wednesday: '10:00-14:00',
          thursday: '10:00-14:00',
          friday: '10:00-14:00',
          saturday: '10:00-12:00',
          sunday: 'closed',
          slotIntervalMinutes: 30,
        },
      }),
    });
    const createRes = await postCmsDoctors(createReq);
    assert.equal(createRes.status, 201);
    const { item: created } = await createRes.json();
    assert.equal(created.name, 'Dr. Kavita Iyer');
    assert.equal(created.department, 'Cardiology');

    // Public specialty filter matches Dr. Kavita Iyer
    const pubReq = new NextRequest(
      `http://localhost:3000/api/v1/public/doctors?tenantId=${tenantId}&specialty=Cardiology`
    );
    const pubRes = await getPublicDoctors(pubReq);
    assert.equal(pubRes.status, 200);
    const pubData = await pubRes.json();
    assert.equal(pubData.items.some((d: any) => d.id === created.id), true);

    // Other tenant cannot see or mutate tenantId's doctor
    const otherPutReq = new NextRequest(
      `http://localhost:3000/api/v1/cms/doctors/${created.id}?tenantId=${otherTenantId}`,
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json', 'x-tenant-id': otherTenantId },
        body: JSON.stringify({ fee: 100 }),
      }
    );
    const otherPutRes = await putCmsDoctor(otherPutReq);
    assert.equal(otherPutRes.status >= 400, true);

    // Update doctor fee on owning tenant
    const ownPutReq = new NextRequest(
      `http://localhost:3000/api/v1/cms/doctors/${created.id}?tenantId=${tenantId}`,
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify({ fee: 950 }),
      }
    );
    const ownPutRes = await putCmsDoctor(ownPutReq);
    assert.equal(ownPutRes.status, 200);

    // Delete temporary doctor cleanly (after booking tests? Keep one fresh for booking first)
    const delReq = new NextRequest(
      `http://localhost:3000/api/v1/cms/doctors/${created.id}?tenantId=${tenantId}`,
      {
        method: 'DELETE',
        headers: { 'x-tenant-id': tenantId },
      }
    );
    const delRes = await deleteCmsDoctor(delReq);
    assert.equal(delRes.status, 200);
  });

  it('Bookings, Conflict Check (409 E-1608), History Timeline & Status Change Email Notification', async () => {
    clearSentEmails();

    // Ensure doctors seeded & fetch first doctor
    const docRes = await getCmsDoctors(
      new NextRequest(`http://localhost:3000/api/v1/cms/doctors?tenantId=${tenantId}`)
    );
    const { items: seededDocs } = await docRes.json();
    assert.ok(seededDocs.length >= 3);
    const targetDoc = seededDocs[0];

    const appointmentDate = '2026-12-14'; // Monday
    const timeSlot = '10:30 AM';

    // Book slot with doctorId
    const bookReq1 = new NextRequest('http://localhost:3000/api/v1/public/appointments', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'Idempotency-Key': `prem-book-1-${crypto.randomUUID()}`,
      },
      body: JSON.stringify({
        clinicSlug: tenantSlug,
        doctorId: targetDoc.id,
        doctorName: targetDoc.name,
        patientName: 'Anil Kapoor',
        patientPhone: '+919876501234',
        patientEmail: 'anil.patient@example.in',
        serviceName: 'Diabetes Consultation',
        preferredDate: appointmentDate,
        preferredTimeSlot: timeSlot,
        consent: true,
      }),
    });
    const bookRes1 = await postPublicAppointment(bookReq1);
    assert.equal(bookRes1.status, 202);
    const { appointmentId } = await bookRes1.json();

    // Availability checks should show 10:30 AM booked for targetDoc
    const availRes = await getAvailability(
      new NextRequest(
        `http://localhost:3000/api/v1/public/availability?tenantId=${tenantId}&date=${appointmentDate}&doctorId=${targetDoc.id}`
      )
    );
    assert.equal(availRes.status, 200);
    const availJson = await availRes.json();
    assert.equal(availJson.bookedSlots.includes('10:30 AM'), true);

    // Attempt double booking same doctor, date & slot -> 409 Conflict E-1608
    const bookReq2 = new NextRequest('http://localhost:3000/api/v1/public/appointments', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'Idempotency-Key': `prem-book-2-${crypto.randomUUID()}`,
      },
      body: JSON.stringify({
        clinicSlug: tenantSlug,
        doctorId: targetDoc.id,
        patientName: 'Second Patient',
        patientPhone: '+919876509999',
        serviceName: 'Diabetes Consultation',
        preferredDate: appointmentDate,
        preferredTimeSlot: timeSlot,
        consent: true,
      }),
    });
    const bookRes2 = await postPublicAppointment(bookReq2);
    assert.equal(bookRes2.status, 409);
    const conflictJson = await bookRes2.json();
    assert.equal(conflictJson.code, 'E-1608');

    // Update status -> confirmed triggers appointment_events, outbox_events & Resend email
    const patchReq = new NextRequest(
      `http://localhost:3000/api/v1/cms/submissions/appointments/${appointmentId}?tenantId=${tenantId}`,
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify({ status: 'confirmed', notes: 'Confirmed for Dr. Maanvita OPD' }),
      }
    );
    const patchRes = await patchAppointmentDetail(patchReq);
    assert.equal(patchRes.status, 200);
    const patchJson = await patchRes.json();
    assert.equal(patchJson.status, 'confirmed');
    assert.equal(patchJson.emailDispatched, true);
    assert.equal(patchJson.outboxQueued, true);

    const emails = getSentEmails();
    assert.equal(emails.length >= 1, true);
    assert.equal(emails[emails.length - 1]?.subject.includes('CONFIRMED'), true);

    // Fetch appointment detail -> contains doctorName and events history timeline
    const detailReq = new NextRequest(
      `http://localhost:3000/api/v1/cms/submissions/appointments/${appointmentId}?tenantId=${tenantId}`
    );
    const detailRes = await getAppointmentDetail(detailReq);
    assert.equal(detailRes.status, 200);
    const detailJson = await detailRes.json();
    assert.equal(detailJson.doctorName, targetDoc.name);
    assert.equal(detailJson.events.length, 2);
    assert.equal(detailJson.events[0].toStatus, 'pending');
    assert.equal(detailJson.events[1].toStatus, 'confirmed');
  });

  it('Operations & SLA: tracks monthly content updates (5), minor change minutes (60), health & 30-day SLA', async () => {
    const postReq = new NextRequest(`http://localhost:3000/api/v1/cms/operations?tenantId=${tenantId}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-tenant-id': tenantId },
      body: JSON.stringify({
        kind: 'content_update',
        title: 'Add Monsoon Vaccination Banner',
      }),
    });
    const postRes = await postOperations(postReq);
    assert.equal(postRes.status, 201);

    const minorReq = new NextRequest(`http://localhost:3000/api/v1/cms/operations?tenantId=${tenantId}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-tenant-id': tenantId },
      body: JSON.stringify({
        kind: 'minor_change',
        title: 'Adjust specialty pill contrast',
        minutesSpent: 20,
      }),
    });
    const minorRes = await postOperations(minorReq);
    assert.equal(minorRes.status, 201);

    const getReq = new NextRequest(`http://localhost:3000/api/v1/cms/operations?tenantId=${tenantId}`);
    const getRes = await getOperations(getReq);
    assert.equal(getRes.status, 200);
    const ops = await getRes.json();
    assert.equal(ops.quota.contentUpdatesLimit, 5);
    assert.equal(ops.quota.contentUpdatesUsed, 1);
    assert.equal(ops.quota.minorChangeMinutesLimit, 60);
    assert.equal(ops.quota.minorChangeMinutesUsed, 20);
    assert.equal(ops.sla.bugFixWindowDays, 30);
    assert.equal(ops.health.dbConnected, true);
  });
});
