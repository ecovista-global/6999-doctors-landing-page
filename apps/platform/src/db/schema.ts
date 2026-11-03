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
const bytea = customType<{ data: Buffer; driverData: Buffer }>({
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

// 2. Users Table: Platform operators & clinic owners
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  email: citext('email').notNull().unique(),
  role: text('role', { enum: ['superadmin', 'operator', 'tenant_owner', 'tenant_staff'] }).notNull().default('tenant_owner'),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 3. Sites Table: One static site per tenant
export const sites = pgTable('sites', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().unique().references(() => tenants.id, { onDelete: 'cascade' }),
  plan: text('plan', { enum: ['basic', 'growth'] }).notNull().default('basic'),
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

// 8. Subscriptions Table: Pricing plans (₹6,999 year 1 / ₹2,999 renewal for basic, ₹12,999 / ₹5,999 for growth)
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  plan: text('plan', { enum: ['basic', 'growth'] }).notNull().default('basic'),
  status: text('status', { enum: ['active', 'past_due', 'canceled'] }).notNull().default('active'),
  currentPeriodEnd: date('current_period_end').notNull(),
  renewalPricePaise: integer('renewal_price_paise').notNull().default(299900), // ₹2,999 for basic, ₹5,999 for growth
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 9. Payments Table: Razorpay settlements
export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  subscriptionId: uuid('subscription_id').notNull().references(() => subscriptions.id),
  razorpayPaymentId: text('razorpay_payment_id').notNull().unique(),
  amountPaise: integer('amount_paise').notNull(),
  gstPaise: integer('gst_paise').notNull(), // 18% GST share
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
