-- ==============================================================================
-- Migration: 0001_professional_clinic.sql
-- Description: Adds tables for Professional Clinic plan (appointments, appointment_events,
--              enquiries, posts, faqs, testimonials, clinic_settings, usage_counters)
--              plus platform core tables and TOTP 2FA fields.
-- Refer to brain/04_DATA_MODEL.md § 2, 3 and brain/18_CMS_SPEC.md § 2.
-- ==============================================================================

-- 1. Ensure Extensions Exist
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- 2. Enhance Users Table with TOTP 2FA Support
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "totp_secret_enc" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "totp_enabled" boolean DEFAULT false NOT NULL;

-- 3. Core Platform Tables
CREATE TABLE IF NOT EXISTS "sites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "plan" text DEFAULT 'basic' NOT NULL,
  "live_version" integer DEFAULT 0 NOT NULL,
  "head_version" integer DEFAULT 0 NOT NULL,
  "schema_version" text DEFAULT '1.0.0' NOT NULL,
  "theme" text DEFAULT 'green' NOT NULL,
  "status" text DEFAULT 'draft' NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "sites_tenant_id_unique" UNIQUE("tenant_id"),
  CONSTRAINT "sites_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS "domains" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "site_id" uuid NOT NULL,
  "host" text NOT NULL,
  "kind" text DEFAULT 'registered' NOT NULL,
  "cf_hostname_id" text,
  "ssl_status" text DEFAULT 'pending' NOT NULL,
  "expires_on" date NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "domains_host_unique" UNIQUE("host"),
  CONSTRAINT "domains_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE cascade
);
CREATE INDEX IF NOT EXISTS "domains_expiry_idx" ON "domains" ("expires_on");

CREATE TABLE IF NOT EXISTS "content_sheets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "site_id" uuid NOT NULL,
  "version" integer NOT NULL,
  "data" jsonb NOT NULL,
  "schema_version" text DEFAULT '1.0.0' NOT NULL,
  "created_by" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "content_sheets_version_idx" UNIQUE("site_id", "version"),
  CONSTRAINT "content_sheets_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS "leads" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "channel" text DEFAULT 'form' NOT NULL,
  "name_enc" bytea,
  "phone_enc" bytea NOT NULL,
  "email_enc" bytea,
  "message_enc" bytea,
  "consent_at" timestamp with time zone NOT NULL,
  "idempotency_key" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "leads_idempotency_key_unique" UNIQUE("idempotency_key"),
  CONSTRAINT "leads_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade
);
CREATE INDEX IF NOT EXISTS "leads_tenant_created_idx" ON "leads" ("tenant_id", "created_at" DESC, "id" DESC);

CREATE TABLE IF NOT EXISTS "lead_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "lead_id" uuid NOT NULL,
  "kind" text NOT NULL,
  "error_details" text,
  "at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "lead_events_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "plan" text DEFAULT 'basic' NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "current_period_end" date NOT NULL,
  "renewal_price_paise" integer DEFAULT 299900 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "subscriptions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS "payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "subscription_id" uuid NOT NULL,
  "razorpay_payment_id" text NOT NULL,
  "amount_paise" integer NOT NULL,
  "gst_paise" integer NOT NULL,
  "status" text DEFAULT 'captured' NOT NULL,
  "idempotency_key" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "payments_razorpay_payment_id_unique" UNIQUE("razorpay_payment_id"),
  CONSTRAINT "payments_idempotency_key_unique" UNIQUE("idempotency_key"),
  CONSTRAINT "payments_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id")
);

CREATE TABLE IF NOT EXISTS "outbox_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "type" text NOT NULL,
  "payload" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "dispatched_at" timestamp with time zone,
  CONSTRAINT "outbox_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS "audit_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid,
  "actor_id" text NOT NULL,
  "action" text NOT NULL,
  "target" text NOT NULL,
  "details" jsonb,
  "at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "audit_log_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
);

CREATE TABLE IF NOT EXISTS "feature_flags" (
  "key" text PRIMARY KEY NOT NULL,
  "enabled" boolean DEFAULT false NOT NULL,
  "rollout_pct" integer DEFAULT 0 NOT NULL
);

-- ==============================================================================
-- 4. Professional Clinic Plan Tables
-- ==============================================================================

-- 4.1 Appointments Table
CREATE TABLE IF NOT EXISTS "appointments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "patient_name_enc" bytea NOT NULL,
  "patient_phone_enc" bytea NOT NULL,
  "patient_email_enc" bytea,
  "service_name" text NOT NULL,
  "preferred_date" date NOT NULL,
  "preferred_time_slot" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "notes" text,
  "consent_at" timestamp with time zone NOT NULL,
  "idempotency_key" text NOT NULL,
  "ip_hash" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "appointments_idempotency_key_unique" UNIQUE("idempotency_key"),
  CONSTRAINT "appointments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade
);
CREATE INDEX IF NOT EXISTS "appointments_tenant_created_idx" ON "appointments" ("tenant_id", "created_at" DESC, "id" DESC);
CREATE INDEX IF NOT EXISTS "appointments_tenant_date_idx" ON "appointments" ("tenant_id", "preferred_date", "status");

-- 4.2 Appointment Events Table
CREATE TABLE IF NOT EXISTS "appointment_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "appointment_id" uuid NOT NULL,
  "tenant_id" uuid NOT NULL,
  "actor_id" text NOT NULL,
  "from_status" text NOT NULL,
  "to_status" text NOT NULL,
  "note" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "appointment_events_appointment_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE cascade,
  CONSTRAINT "appointment_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade
);
CREATE INDEX IF NOT EXISTS "appointment_events_appt_idx" ON "appointment_events" ("appointment_id", "created_at");

-- 4.3 Enquiries Table
CREATE TABLE IF NOT EXISTS "enquiries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "name_enc" bytea NOT NULL,
  "phone_enc" bytea NOT NULL,
  "email_enc" bytea,
  "message_enc" bytea NOT NULL,
  "service" text,
  "status" text DEFAULT 'pending' NOT NULL,
  "consent_at" timestamp with time zone NOT NULL,
  "idempotency_key" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "enquiries_idempotency_key_unique" UNIQUE("idempotency_key"),
  CONSTRAINT "enquiries_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade
);
CREATE INDEX IF NOT EXISTS "enquiries_tenant_created_idx" ON "enquiries" ("tenant_id", "created_at" DESC, "id" DESC);

-- 4.4 Posts (Blog) Table
CREATE TABLE IF NOT EXISTS "posts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "title" text NOT NULL,
  "slug" text NOT NULL,
  "excerpt" text,
  "content_json" jsonb,
  "cover_image_url" text,
  "published_at" timestamp with time zone,
  "is_published" boolean DEFAULT false NOT NULL,
  "seo_title" text,
  "seo_description" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "posts_tenant_slug_idx" UNIQUE("tenant_id", "slug"),
  CONSTRAINT "posts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade
);

-- 4.5 FAQs Table
CREATE TABLE IF NOT EXISTS "faqs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "question" text NOT NULL,
  "answer" text NOT NULL,
  "category" text DEFAULT 'General' NOT NULL,
  "display_order" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "faqs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade
);
CREATE INDEX IF NOT EXISTS "faqs_tenant_order_idx" ON "faqs" ("tenant_id", "display_order");

-- 4.6 Testimonials Table
CREATE TABLE IF NOT EXISTS "testimonials" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "patient_initials" text NOT NULL,
  "review_text" text NOT NULL,
  "rating" integer DEFAULT 5 NOT NULL,
  "treatment" text,
  "consent_recorded" boolean DEFAULT false NOT NULL,
  "moderation_status" text DEFAULT 'draft' NOT NULL,
  "display_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "testimonials_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade
);
CREATE INDEX IF NOT EXISTS "testimonials_tenant_idx" ON "testimonials" ("tenant_id", "display_order");

-- 4.7 Clinic Settings Table
CREATE TABLE IF NOT EXISTS "clinic_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "operating_hours" jsonb NOT NULL,
  "slot_interval_minutes" integer DEFAULT 30 NOT NULL,
  "max_daily_slots" integer DEFAULT 40 NOT NULL,
  "notification_emails" text[],
  "spam_threshold" integer DEFAULT 5 NOT NULL,
  "enabled_pages" text[],
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "clinic_settings_tenant_id_unique" UNIQUE("tenant_id"),
  CONSTRAINT "clinic_settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade
);

-- 4.8 Usage Counters Table
CREATE TABLE IF NOT EXISTS "usage_counters" (
  "tenant_id" uuid PRIMARY KEY NOT NULL,
  "period_start" date NOT NULL,
  "appointment_count" integer DEFAULT 0 NOT NULL,
  "enquiry_count" integer DEFAULT 0 NOT NULL,
  "storage_bytes" integer DEFAULT 0 NOT NULL,
  "content_updates_used" integer DEFAULT 0 NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "usage_counters_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade
);

