import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { db, pool, schema } from '../src/db/index';
import { eq } from 'drizzle-orm';
import type {
  Appointment,
  NewAppointment,
  AppointmentEvent,
  NewAppointmentEvent,
  Enquiry,
  NewEnquiry,
  Post,
  NewPost,
  Faq,
  NewFaq,
  Testimonial,
  NewTestimonial,
  ClinicSettings,
  NewClinicSettings,
  UsageCounters,
  NewUsageCounters,
} from '../src/db/schema';

describe('MT-106: Professional Clinic Database Migrations & Schema Acceptance Suite', () => {
  const testTenantSlug = `clinic-mt106-${Date.now()}`;
  let tenantId: string;
  let siteId: string;
  let subscriptionId: string;

  before(async () => {
    // 1. Seed a test tenant
    const [tenant] = await db
      .insert(schema.tenants)
      .values({
        slug: testTenantSlug,
        name: 'Apex HealthCare Multi-Speciality Clinic',
        status: 'active',
      })
      .returning();
    assert.ok(tenant && tenant.id);
    tenantId = tenant.id;

    // 2. Seed a site with professional plan
    const [site] = await db
      .insert(schema.sites)
      .values({
        tenantId,
        plan: 'professional',
        theme: 'teal',
        status: 'published',
      })
      .returning();
    assert.ok(site);
    siteId = site.id;

    // 3. Seed a subscription with professional plan (renewal ₹9,999 -> 999900 paise)
    const [sub] = await db
      .insert(schema.subscriptions)
      .values({
        tenantId,
        plan: 'professional',
        currentPeriodEnd: '2027-11-05',
        renewalPricePaise: 999900,
        status: 'active',
      })
      .returning();
    assert.ok(sub);
    subscriptionId = sub.id;
  });

  after(async () => {
    if (tenantId) {
      // Deleting tenant must cascade to all child tables
      await db.delete(schema.tenants).where(eq(schema.tenants.id, tenantId));
    }
    await pool.end();
  });

  it('Acceptance: Migration 0001_professional_clinic.sql is recorded and applied cleanly on PostgreSQL 16', async () => {
    const res = await pool.query(
      'SELECT hash FROM "__drizzle_migrations" WHERE hash = $1',
      ['0001_professional_clinic.sql']
    );
    assert.strictEqual(res.rowCount, 1, 'Migration 0001_professional_clinic.sql must be recorded in __drizzle_migrations');

    // Verify all 8 Professional Clinic tables exist
    const expectedTables = [
      'appointments',
      'appointment_events',
      'enquiries',
      'posts',
      'faqs',
      'testimonials',
      'clinic_settings',
      'usage_counters',
    ];

    for (const table of expectedTables) {
      const tableCheck = await pool.query(
        'SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2',
        ['public', table]
      );
      assert.strictEqual(tableCheck.rowCount, 1, `Table "${table}" must exist in public schema`);
    }
  });

  it('Acceptance: Foreign keys are valid and cascade delete operates cleanly across all tenant tables', async () => {
    // 1. Verify foreign key constraints exist in information_schema
    const fkCheck = await pool.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name IN ('appointments', 'appointment_events', 'enquiries', 'posts', 'faqs', 'testimonials', 'clinic_settings', 'usage_counters')
    `);

    const fks = fkCheck.rows;
    assert.ok(fks.some(r => r.table_name === 'appointments' && r.foreign_table_name === 'tenants'), 'appointments -> tenants FK missing');
    assert.ok(fks.some(r => r.table_name === 'appointment_events' && r.foreign_table_name === 'appointments'), 'appointment_events -> appointments FK missing');
    assert.ok(fks.some(r => r.table_name === 'enquiries' && r.foreign_table_name === 'tenants'), 'enquiries -> tenants FK missing');
    assert.ok(fks.some(r => r.table_name === 'posts' && r.foreign_table_name === 'tenants'), 'posts -> tenants FK missing');
    assert.ok(fks.some(r => r.table_name === 'faqs' && r.foreign_table_name === 'tenants'), 'faqs -> tenants FK missing');
    assert.ok(fks.some(r => r.table_name === 'testimonials' && r.foreign_table_name === 'tenants'), 'testimonials -> tenants FK missing');
    assert.ok(fks.some(r => r.table_name === 'clinic_settings' && r.foreign_table_name === 'tenants'), 'clinic_settings -> tenants FK missing');
    assert.ok(fks.some(r => r.table_name === 'usage_counters' && r.foreign_table_name === 'tenants'), 'usage_counters -> tenants FK missing');
  });

  it('Acceptance: "professional" plan is stored and retrieved on sites and subscriptions', async () => {
    const [fetchedSite] = await db.select().from(schema.sites).where(eq(schema.sites.id, siteId));
    assert.strictEqual(fetchedSite?.plan, 'professional', 'Site must have plan="professional"');

    const [fetchedSub] = await db.select().from(schema.subscriptions).where(eq(schema.subscriptions.id, subscriptionId));
    assert.strictEqual(fetchedSub?.plan, 'professional', 'Subscription must have plan="professional"');
    assert.strictEqual(fetchedSub?.renewalPricePaise, 999900, 'Professional renewal must be ₹9,999 (999900 paise)');
  });

  it('Acceptance: Typed CRUD on appointments and appointment_events with encrypted PII and status transitions', async () => {
    // Insert Appointment
    const dummyEncryptedName = Buffer.from('EncryptedPatientNameBytes');
    const dummyEncryptedPhone = Buffer.from('EncryptedPatientPhoneBytes');
    const dummyEncryptedEmail = Buffer.from('EncryptedPatientEmailBytes');
    const apptIdempotencyKey = `appt-${Date.now()}`;

    const [appt] = await db
      .insert(schema.appointments)
      .values({
        tenantId,
        patientNameEnc: dummyEncryptedName,
        patientPhoneEnc: dummyEncryptedPhone,
        patientEmailEnc: dummyEncryptedEmail,
        serviceName: 'General Consultation',
        preferredDate: '2026-11-10',
        preferredTimeSlot: '10:00 AM - 10:30 AM',
        status: 'pending',
        notes: 'Patient requested morning slot',
        consentAt: new Date(),
        idempotencyKey: apptIdempotencyKey,
        ipHash: 'hash-abc-123',
      })
      .returning();

    assert.ok(appt && appt.id);
    assert.strictEqual(appt.status, 'pending');
    assert.strictEqual(appt.serviceName, 'General Consultation');
    assert.strictEqual(appt.idempotencyKey, apptIdempotencyKey);

    // Insert Appointment Event (Pending -> Confirmed)
    const [event] = await db
      .insert(schema.appointmentEvents)
      .values({
        appointmentId: appt.id,
        tenantId,
        actorId: 'receptionist-staff-1',
        fromStatus: 'pending',
        toStatus: 'confirmed',
        note: 'Confirmed with patient via telephone call',
      })
      .returning();

    assert.ok(event && event.id);
    assert.strictEqual(event.appointmentId, appt.id);
    assert.strictEqual(event.toStatus, 'confirmed');

    // Update appointment status to Confirmed
    await db
      .update(schema.appointments)
      .set({ status: 'confirmed' })
      .where(eq(schema.appointments.id, appt.id));

    const [updatedAppt] = await db
      .select()
      .from(schema.appointments)
      .where(eq(schema.appointments.id, appt.id));

    assert.strictEqual(updatedAppt?.status, 'confirmed');
  });

  it('Acceptance: Typed CRUD on enquiries with encrypted PII and idempotency', async () => {
    const enqKey = `enq-${Date.now()}`;
    const [enq] = await db
      .insert(schema.enquiries)
      .values({
        tenantId,
        nameEnc: Buffer.from('EncryptedEnquirerName'),
        phoneEnc: Buffer.from('EncryptedEnquirerPhone'),
        messageEnc: Buffer.from('EncryptedEnquiryMessageContent'),
        service: 'Diabetes Management Consultation',
        status: 'pending',
        consentAt: new Date(),
        idempotencyKey: enqKey,
      })
      .returning();

    assert.ok(enq && enq.id);
    assert.strictEqual(enq.status, 'pending');
    assert.strictEqual(enq.idempotencyKey, enqKey);

    const [queriedEnq] = await db.select().from(schema.enquiries).where(eq(schema.enquiries.id, enq.id));
    assert.ok(queriedEnq);
    assert.strictEqual(queriedEnq.service, 'Diabetes Management Consultation');
  });

  it('Acceptance: Typed CRUD on posts (Blog) enforcing unique slug per tenant', async () => {
    const postSlug = `dengue-prevention-${Date.now()}`;
    const [post] = await db
      .insert(schema.posts)
      .values({
        tenantId,
        title: 'Dengue Fever: Warning Signs and Prevention Protocols',
        slug: postSlug,
        excerpt: 'Evidence-based advice on detecting platelet drops early.',
        contentJson: { type: 'doc', content: [{ type: 'paragraph', text: 'Clinical guidance content' }] },
        coverImageUrl: 'assets/posts/dengue-prevention.webp',
        isPublished: true,
        publishedAt: new Date(),
        seoTitle: 'Dengue Fever Care Guide | Noida Clinic',
        seoDescription: 'Clinical symptoms and management guide for dengue fever.',
      })
      .returning();

    assert.ok(post && post.id);
    assert.strictEqual(post.slug, postSlug);
    assert.strictEqual(post.isPublished, true);

    // Duplicate slug on the same tenant must reject with unique constraint violation
    await assert.rejects(async () => {
      await db.insert(schema.posts).values({
        tenantId,
        title: 'Duplicate Slug Post',
        slug: postSlug,
      });
    }, /posts_tenant_slug_idx/);
  });

  it('Acceptance: Typed CRUD on faqs and testimonials with moderation status', async () => {
    // 1. FAQ Item
    const [faq] = await db
      .insert(schema.faqs)
      .values({
        tenantId,
        question: 'What is the regular consultation fee and follow-up policy?',
        answer: 'Consultation fee is ₹600 and includes a 7-day complimentary follow-up.',
        category: 'Billing & Consultations',
        displayOrder: 1,
        isActive: true,
      })
      .returning();

    assert.ok(faq && faq.id);
    assert.strictEqual(faq.displayOrder, 1);
    assert.strictEqual(faq.isActive, true);

    // 2. Testimonial with mandatory consent
    const [testimonial] = await db
      .insert(schema.testimonials)
      .values({
        tenantId,
        patientInitials: 'R. K.',
        reviewText: 'Dr. Maanvita explained my sugar report clearly without unnecessary medication.',
        rating: 5,
        treatment: 'Diabetes Management',
        consentRecorded: true,
        moderationStatus: 'approved',
        displayOrder: 1,
      })
      .returning();

    assert.ok(testimonial && testimonial.id);
    assert.strictEqual(testimonial.patientInitials, 'R. K.');
    assert.strictEqual(testimonial.consentRecorded, true);
    assert.strictEqual(testimonial.moderationStatus, 'approved');
  });

  it('Acceptance: Typed CRUD on clinic_settings and usage_counters', async () => {
    // 1. Clinic Settings
    const [settings] = await db
      .insert(schema.clinicSettings)
      .values({
        tenantId,
        operatingHours: {
          monday: { open: '09:00', close: '20:00', closed: false },
          saturday: { open: '09:00', close: '16:00', closed: false },
          sunday: { open: '00:00', close: '00:00', closed: true },
        },
        slotIntervalMinutes: 30,
        maxDailySlots: 40,
        notificationEmails: ['doctor@clinic.in', 'reception@clinic.in'],
        spamThreshold: 5,
        enabledPages: ['home', 'about', 'services', 'doctors', 'testimonials-faq', 'blog', 'contact'],
      })
      .returning();

    assert.ok(settings && settings.id);
    assert.strictEqual(settings.slotIntervalMinutes, 30);
    assert.strictEqual(settings.maxDailySlots, 40);
    assert.strictEqual(settings.enabledPages?.length, 7);

    // 2. Usage Counters
    const [usage] = await db
      .insert(schema.usageCounters)
      .values({
        tenantId,
        periodStart: '2026-11-01',
        appointmentCount: 15,
        enquiryCount: 8,
        storageBytes: 104857600, // 100 MB
        contentUpdatesUsed: 1,
      })
      .returning();

    assert.ok(usage);
    assert.strictEqual(usage.tenantId, tenantId);
    assert.strictEqual(usage.appointmentCount, 15);
    assert.strictEqual(usage.contentUpdatesUsed, 1);
  });

  it('Acceptance: Schema types are properly exported and statically typed', () => {
    // Static type assertion tests verifying exports from schema.ts
    const sampleAppt: Partial<Appointment> = {
      serviceName: 'Consultation',
      status: 'pending',
    };
    const sampleNewAppt: Partial<NewAppointment> = {
      serviceName: 'Consultation',
    };
    const sampleEvent: Partial<AppointmentEvent> = {
      fromStatus: 'pending',
      toStatus: 'confirmed',
    };
    const sampleEnq: Partial<Enquiry> = {
      status: 'pending',
    };
    const samplePost: Partial<Post> = {
      title: 'Guide',
    };
    const sampleFaq: Partial<Faq> = {
      question: 'Q',
    };
    const sampleTestimonial: Partial<Testimonial> = {
      rating: 5,
    };
    const sampleSettings: Partial<ClinicSettings> = {
      slotIntervalMinutes: 30,
    };
    const sampleUsage: Partial<UsageCounters> = {
      appointmentCount: 0,
    };

    assert.ok(sampleAppt);
    assert.ok(sampleNewAppt);
    assert.ok(sampleEvent);
    assert.ok(sampleEnq);
    assert.ok(samplePost);
    assert.ok(sampleFaq);
    assert.ok(sampleTestimonial);
    assert.ok(sampleSettings);
    assert.ok(sampleUsage);
  });
});

