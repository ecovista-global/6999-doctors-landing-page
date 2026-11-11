import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  date,
  jsonb,
  customType,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

// Custom bytea type for AES-256-GCM encrypted PII fields per DPDP Act
export const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return 'bytea';
  },
});

// Custom citext type for case-insensitive email per 04 § 2
export const citext = customType<{ data: string }>({
  dataType() {
    return 'citext';
  },
});

// 1. Tenants Table: Represents one paying clinic/doctor
export const tenants = pgTable(
  'tenants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    status: text('status', { enum: ['draft', 'active', 'suspended', 'offboarded'] }).notNull().default('draft'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('tenants_active_idx').on(table.slug),
  ]
);

// 2. Users Table: Platform operators, clinic owners & staff (with 2FA support)
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  email: citext('email').notNull().unique(),
  role: text('role', { enum: ['superadmin', 'operator', 'tenant_owner', 'tenant_staff'] }).notNull().default('tenant_owner'),
  totpSecretEnc: text('totp_secret_enc'),
  totpEnabled: boolean('totp_enabled').notNull().default(false),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 3. Sites Table: One static site per tenant with professional plan support
export const sites = pgTable('sites', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().unique().references(() => tenants.id, { onDelete: 'cascade' }),
  plan: text('plan', { enum: ['basic', 'growth', 'professional'] }).notNull().default('basic'),
  liveVersion: integer('live_version').default(0).notNull(),
  headVersion: integer('head_version').default(0).notNull(),
  schemaVersion: text('schema_version').notNull().default('1.0.0'),
  theme: text('theme', { enum: ['green', 'teal'] }).notNull().default('green'),
  status: text('status', { enum: ['draft', 'published', 'error'] }).notNull().default('draft'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 4. Domains Table: Custom domain mappings & SSL status via Cloudflare
export const domains = pgTable(
  'domains',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
    host: text('host').notNull().unique(),
    kind: text('kind', { enum: ['registered', 'byo'] }).notNull().default('registered'),
    cfHostnameId: text('cf_hostname_id'),
    sslStatus: text('ssl_status').notNull().default('pending'),
    expiresOn: date('expires_on').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('domains_expiry_idx').on(table.expiresOn),
  ]
);

// 5. Content Sheets Table: Versioned JSON doctor content
export const contentSheets = pgTable(
  'content_sheets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    data: jsonb('data').notNull(),
    schemaVersion: text('schema_version').notNull().default('1.0.0'),
    createdBy: text('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('content_sheets_version_idx').on(table.siteId, table.version),
  ]
);

// 6. Leads Table: Patient enquiries with encrypted PII
export const leads = pgTable(
  'leads',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    channel: text('channel', { enum: ['form', 'call', 'whatsapp'] }).notNull().default('form'),
    nameEnc: bytea('name_enc'),
    phoneEnc: bytea('phone_enc').notNull(),
    emailEnc: bytea('email_enc'),
    messageEnc: bytea('message_enc'),
    consentAt: timestamp('consent_at', { withTimezone: true }).notNull(),
    idempotencyKey: text('idempotency_key').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('leads_tenant_created_idx').on(table.tenantId, table.createdAt),
  ]
);

// 7. Lead Events Table: Delivery trail (Resend email, WhatsApp notifications)
export const leadEvents = pgTable('lead_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  leadId: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  kind: text('kind', { enum: ['received', 'email_sent', 'wa_sent', 'failed'] }).notNull(),
  errorDetails: text('error_details'),
  at: timestamp('at', { withTimezone: true }).defaultNow().notNull(),
});

// 8. Subscriptions Table: Pricing plans (basic ₹6,999, growth ₹12,999, professional ₹18,999)
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  plan: text('plan', { enum: ['basic', 'growth', 'professional'] }).notNull().default('basic'),
  status: text('status', { enum: ['active', 'past_due', 'canceled'] }).notNull().default('active'),
  currentPeriodEnd: date('current_period_end').notNull(),
  renewalPricePaise: integer('renewal_price_paise').notNull().default(299900),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 9. Payments Table: Razorpay settlements
export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  subscriptionId: uuid('subscription_id').notNull().references(() => subscriptions.id),
  razorpayPaymentId: text('razorpay_payment_id').notNull().unique(),
  amountPaise: integer('amount_paise').notNull(),
  gstPaise: integer('gst_paise').notNull(),
  status: text('status').notNull().default('captured'),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 10. Outbox Events Table: Transactional Outbox pattern for reliable async jobs
export const outboxEvents = pgTable('outbox_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  payload: jsonb('payload').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  dispatchedAt: timestamp('dispatched_at', { withTimezone: true }),
});

// 11. Audit Log Table: Append-only immutable trail per SD-048
export const auditLog = pgTable('audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  actorId: text('actor_id').notNull(),
  action: text('action').notNull(),
  target: text('target').notNull(),
  details: jsonb('details'),
  at: timestamp('at', { withTimezone: true }).defaultNow().notNull(),
});

// 12. Feature Flags Table: Canary releases & rollouts per SD-071
export const featureFlags = pgTable('feature_flags', {
  key: text('key').primaryKey(),
  enabled: boolean('enabled').notNull().default(false),
  rolloutPct: integer('rollout_pct').notNull().default(0),
});

// ============================================================================
// Professional Clinic Plan Tables (MT-106 per 04 § 2 and 18 § 2)
// ============================================================================

// 13. Appointments Table: Patient clinic booking requests with encrypted PII
export const appointments = pgTable(
  'appointments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    patientNameEnc: bytea('patient_name_enc').notNull(),
    patientPhoneEnc: bytea('patient_phone_enc').notNull(),
    patientEmailEnc: bytea('patient_email_enc'),
    serviceName: text('service_name').notNull(),
    preferredDate: date('preferred_date').notNull(),
    preferredTimeSlot: text('preferred_time_slot').notNull(),
    status: text('status', { enum: ['pending', 'confirmed', 'completed', 'cancelled'] }).notNull().default('pending'),
    notes: text('notes'),
    consentAt: timestamp('consent_at', { withTimezone: true }).notNull(),
    idempotencyKey: text('idempotency_key').notNull().unique(),
    ipHash: text('ip_hash'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('appointments_tenant_created_idx').on(table.tenantId, table.createdAt, table.id),
    index('appointments_tenant_date_idx').on(table.tenantId, table.preferredDate, table.status),
  ]
);

// 14. Appointment Events Table: Full lifecycle audit trail for appointments
export const appointmentEvents = pgTable(
  'appointment_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    appointmentId: uuid('appointment_id').notNull().references(() => appointments.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    actorId: text('actor_id').notNull(),
    fromStatus: text('from_status').notNull(),
    toStatus: text('to_status').notNull(),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('appointment_events_appt_idx').on(table.appointmentId, table.createdAt),
  ]
);

// 15. Enquiries Table: Patient clinic messages & queries with encrypted PII
export const enquiries = pgTable(
  'enquiries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    nameEnc: bytea('name_enc').notNull(),
    phoneEnc: bytea('phone_enc').notNull(),
    emailEnc: bytea('email_enc'),
    messageEnc: bytea('message_enc').notNull(),
    service: text('service'),
    status: text('status', { enum: ['pending', 'confirmed', 'completed', 'cancelled'] }).notNull().default('pending'),
    consentAt: timestamp('consent_at', { withTimezone: true }).notNull(),
    idempotencyKey: text('idempotency_key').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('enquiries_tenant_created_idx').on(table.tenantId, table.createdAt, table.id),
  ]
);

// 16. Posts Table: Clinic blog articles and healthcare guides
export const posts = pgTable(
  'posts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    excerpt: text('excerpt'),
    contentJson: jsonb('content_json'),
    coverImageUrl: text('cover_image_url'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    isPublished: boolean('is_published').notNull().default(false),
    seoTitle: text('seo_title'),
    seoDescription: text('seo_description'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('posts_tenant_slug_idx').on(table.tenantId, table.slug),
  ]
);

// 17. FAQs Table: Clinic Q&A items managed via CMS
export const faqs = pgTable(
  'faqs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    question: text('question').notNull(),
    answer: text('answer').notNull(),
    category: text('category').notNull().default('General'),
    displayOrder: integer('display_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('faqs_tenant_order_idx').on(table.tenantId, table.displayOrder),
  ]
);

// 18. Testimonials Table: Moderated patient reviews with mandatory recorded consent
export const testimonials = pgTable(
  'testimonials',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    patientInitials: text('patient_initials').notNull(),
    reviewText: text('review_text').notNull(),
    rating: integer('rating').notNull().default(5),
    treatment: text('treatment'),
    consentRecorded: boolean('consent_recorded').notNull().default(false),
    moderationStatus: text('moderation_status', { enum: ['draft', 'approved', 'archived'] }).notNull().default('draft'),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('testimonials_tenant_idx').on(table.tenantId, table.displayOrder),
  ]
);

// 19. Clinic Settings Table: Operating hours, booking slots, and notification rules
export const clinicSettings = pgTable('clinic_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().unique().references(() => tenants.id, { onDelete: 'cascade' }),
  operatingHours: jsonb('operating_hours').notNull(),
  slotIntervalMinutes: integer('slot_interval_minutes').notNull().default(30),
  maxDailySlots: integer('max_daily_slots').notNull().default(40),
  notificationEmails: text('notification_emails').array(),
  spamThreshold: integer('spam_threshold').notNull().default(5),
  enabledPages: text('enabled_pages').array(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 20. Usage Counters Table: Quotas and allowance trackers per ADR-204
export const usageCounters = pgTable('usage_counters', {
  tenantId: uuid('tenant_id').primaryKey().references(() => tenants.id, { onDelete: 'cascade' }),
  periodStart: date('period_start').notNull(),
  appointmentCount: integer('appointment_count').notNull().default(0),
  enquiryCount: integer('enquiry_count').notNull().default(0),
  storageBytes: integer('storage_bytes').notNull().default(0),
  contentUpdatesUsed: integer('content_updates_used').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 21. Media Assets Table: Tenant media library + quota metadata (MT-123)
export const mediaAssets = pgTable('media_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  url: text('url').notNull(),
  storageKey: text('storage_key'),
  fileSizeBytes: integer('file_size_bytes').notNull().default(0),
  mimeType: text('mime_type').notNull().default('image/jpeg'),
  dimensions: text('dimensions'),
  assignedTo: text('assigned_to').default('unassigned'),
  category: text('category').notNull().default('clinic'),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// Exported TypeScript Schema Types
// ============================================================================
export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Site = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;

export type Domain = typeof domains.$inferSelect;
export type NewDomain = typeof domains.$inferInsert;

export type ContentSheet = typeof contentSheets.$inferSelect;
export type NewContentSheet = typeof contentSheets.$inferInsert;

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;

export type LeadEvent = typeof leadEvents.$inferSelect;
export type NewLeadEvent = typeof leadEvents.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export type OutboxEvent = typeof outboxEvents.$inferSelect;
export type NewOutboxEvent = typeof outboxEvents.$inferInsert;

export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;

export type FeatureFlag = typeof featureFlags.$inferSelect;
export type NewFeatureFlag = typeof featureFlags.$inferInsert;

export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;

export type AppointmentEvent = typeof appointmentEvents.$inferSelect;
export type NewAppointmentEvent = typeof appointmentEvents.$inferInsert;

export type Enquiry = typeof enquiries.$inferSelect;
export type NewEnquiry = typeof enquiries.$inferInsert;

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;

export type Faq = typeof faqs.$inferSelect;
export type NewFaq = typeof faqs.$inferInsert;

export type Testimonial = typeof testimonials.$inferSelect;
export type NewTestimonial = typeof testimonials.$inferInsert;

export type ClinicSettings = typeof clinicSettings.$inferSelect;
export type NewClinicSettings = typeof clinicSettings.$inferInsert;

export type UsageCounters = typeof usageCounters.$inferSelect;
export type NewUsageCounters = typeof usageCounters.$inferInsert;
export type MediaAssetRecord = typeof mediaAssets.$inferSelect;
export type NewMediaAssetRecord = typeof mediaAssets.$inferInsert;
