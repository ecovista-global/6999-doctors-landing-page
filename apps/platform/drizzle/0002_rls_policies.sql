-- ==============================================================================
-- Migration: 0002_rls_policies.sql
-- Description: Row-Level Security (RLS) policies for tenant isolation.
--              Enforces tenant boundary on all 8 Professional Clinic tables
--              and platform tenant-owned tables per SD-002, ADR-201, and MT-107.
-- Refer to brain/03_ARCHITECTURE.md § 3, brain/04_DATA_MODEL.md § 2, 3 and 13 § 1.
-- ==============================================================================

-- 1. Enable and Force Row-Level Security on All 8 Professional Clinic Tables
ALTER TABLE "appointments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "appointments" FORCE ROW LEVEL SECURITY;

ALTER TABLE "appointment_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "appointment_events" FORCE ROW LEVEL SECURITY;

ALTER TABLE "enquiries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "enquiries" FORCE ROW LEVEL SECURITY;

ALTER TABLE "posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "posts" FORCE ROW LEVEL SECURITY;

ALTER TABLE "faqs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "faqs" FORCE ROW LEVEL SECURITY;

ALTER TABLE "testimonials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "testimonials" FORCE ROW LEVEL SECURITY;

ALTER TABLE "clinic_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clinic_settings" FORCE ROW LEVEL SECURITY;

ALTER TABLE "usage_counters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "usage_counters" FORCE ROW LEVEL SECURITY;

-- 2. Enable and Force RLS on Foundational Tenant-Owned Tables
ALTER TABLE "sites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sites" FORCE ROW LEVEL SECURITY;

ALTER TABLE "domains" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "domains" FORCE ROW LEVEL SECURITY;

ALTER TABLE "content_sheets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "content_sheets" FORCE ROW LEVEL SECURITY;

ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "leads" FORCE ROW LEVEL SECURITY;

ALTER TABLE "lead_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lead_events" FORCE ROW LEVEL SECURITY;

ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions" FORCE ROW LEVEL SECURITY;

ALTER TABLE "outbox_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "outbox_events" FORCE ROW LEVEL SECURITY;

ALTER TABLE "audit_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_log" FORCE ROW LEVEL SECURITY;

-- 3. Tenant Isolation Policies for Tables with Direct tenant_id

-- Appointments Policy
DROP POLICY IF EXISTS "tenant_isolation_appointments" ON "appointments";
CREATE POLICY "tenant_isolation_appointments" ON "appointments"
  FOR ALL
  USING (
    NULLIF(current_setting('app.bypass_rls', true), '') = 'on'
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    OR (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      AND COALESCE(NULLIF(current_setting('app.enforce_rls', true), ''), 'off') <> 'on'
    )
  )
  WITH CHECK (
    NULLIF(current_setting('app.bypass_rls', true), '') = 'on'
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    OR (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      AND COALESCE(NULLIF(current_setting('app.enforce_rls', true), ''), 'off') <> 'on'
    )
  );

-- Appointment Events Policy
DROP POLICY IF EXISTS "tenant_isolation_appointment_events" ON "appointment_events";
CREATE POLICY "tenant_isolation_appointment_events" ON "appointment_events"
  FOR ALL
  USING (
    NULLIF(current_setting('app.bypass_rls', true), '') = 'on'
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    OR (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      AND COALESCE(NULLIF(current_setting('app.enforce_rls', true), ''), 'off') <> 'on'
    )
  )
  WITH CHECK (
    NULLIF(current_setting('app.bypass_rls', true), '') = 'on'
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    OR (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      AND COALESCE(NULLIF(current_setting('app.enforce_rls', true), ''), 'off') <> 'on'
    )
  );

-- Enquiries Policy
DROP POLICY IF EXISTS "tenant_isolation_enquiries" ON "enquiries";
CREATE POLICY "tenant_isolation_enquiries" ON "enquiries"
  FOR ALL
  USING (
    NULLIF(current_setting('app.bypass_rls', true), '') = 'on'
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    OR (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      AND COALESCE(NULLIF(current_setting('app.enforce_rls', true), ''), 'off') <> 'on'
    )
  )
  WITH CHECK (
    NULLIF(current_setting('app.bypass_rls', true), '') = 'on'
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    OR (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      AND COALESCE(NULLIF(current_setting('app.enforce_rls', true), ''), 'off') <> 'on'
    )
  );

-- Posts Policy
DROP POLICY IF EXISTS "tenant_isolation_posts" ON "posts";
CREATE POLICY "tenant_isolation_posts" ON "posts"
  FOR ALL
  USING (
    NULLIF(current_setting('app.bypass_rls', true), '') = 'on'
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    OR (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      AND COALESCE(NULLIF(current_setting('app.enforce_rls', true), ''), 'off') <> 'on'
    )
  )
  WITH CHECK (
    NULLIF(current_setting('app.bypass_rls', true), '') = 'on'
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    OR (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      AND COALESCE(NULLIF(current_setting('app.enforce_rls', true), ''), 'off') <> 'on'
    )
  );

-- FAQs Policy
DROP POLICY IF EXISTS "tenant_isolation_faqs" ON "faqs";
CREATE POLICY "tenant_isolation_faqs" ON "faqs"
  FOR ALL
  USING (
    NULLIF(current_setting('app.bypass_rls', true), '') = 'on'
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    OR (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      AND COALESCE(NULLIF(current_setting('app.enforce_rls', true), ''), 'off') <> 'on'
    )
  )
  WITH CHECK (
    NULLIF(current_setting('app.bypass_rls', true), '') = 'on'
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    OR (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      AND COALESCE(NULLIF(current_setting('app.enforce_rls', true), ''), 'off') <> 'on'
    )
  );

-- Testimonials Policy
DROP POLICY IF EXISTS "tenant_isolation_testimonials" ON "testimonials";
CREATE POLICY "tenant_isolation_testimonials" ON "testimonials"
  FOR ALL
  USING (
    NULLIF(current_setting('app.bypass_rls', true), '') = 'on'
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    OR (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      AND COALESCE(NULLIF(current_setting('app.enforce_rls', true), ''), 'off') <> 'on'
    )
  )
  WITH CHECK (
    NULLIF(current_setting('app.bypass_rls', true), '') = 'on'
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    OR (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      AND COALESCE(NULLIF(current_setting('app.enforce_rls', true), ''), 'off') <> 'on'
    )
  );

-- Clinic Settings Policy
DROP POLICY IF EXISTS "tenant_isolation_clinic_settings" ON "clinic_settings";
CREATE POLICY "tenant_isolation_clinic_settings" ON "clinic_settings"
  FOR ALL
  USING (
    NULLIF(current_setting('app.bypass_rls', true), '') = 'on'
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    OR (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      AND COALESCE(NULLIF(current_setting('app.enforce_rls', true), ''), 'off') <> 'on'
    )
  )
  WITH CHECK (
    NULLIF(current_setting('app.bypass_rls', true), '') = 'on'
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    OR (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      AND COALESCE(NULLIF(current_setting('app.enforce_rls', true), ''), 'off') <> 'on'
    )
  );

-- Usage Counters Policy
DROP POLICY IF EXISTS "tenant_isolation_usage_counters" ON "usage_counters";
CREATE POLICY "tenant_isolation_usage_counters" ON "usage_counters"
  FOR ALL
  USING (
    NULLIF(current_setting('app.bypass_rls', true), '') = 'on'
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    OR (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      AND COALESCE(NULLIF(current_setting('app.enforce_rls', true), ''), 'off') <> 'on'
    )
  )
  WITH CHECK (
    NULLIF(current_setting('app.bypass_rls', true), '') = 'on'
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    OR (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      AND COALESCE(NULLIF(current_setting('app.enforce_rls', true), ''), 'off') <> 'on'
    )
  );

-- Sites Policy
DROP POLICY IF EXISTS "tenant_isolation_sites" ON "sites";
CREATE POLICY "tenant_isolation_sites" ON "sites"
  FOR ALL
  USING (
    NULLIF(current_setting('app.bypass_rls', true), '') = 'on'
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    OR (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      AND COALESCE(NULLIF(current_setting('app.enforce_rls', true), ''), 'off') <> 'on'
    )
  )
  WITH CHECK (
    NULLIF(current_setting('app.bypass_rls', true), '') = 'on'
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    OR (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      AND COALESCE(NULLIF(current_setting('app.enforce_rls', true), ''), 'off') <> 'on'
    )
  );

-- Leads Policy
DROP POLICY IF EXISTS "tenant_isolation_leads" ON "leads";
CREATE POLICY "tenant_isolation_leads" ON "leads"
  FOR ALL
  USING (
    NULLIF(current_setting('app.bypass_rls', true), '') = 'on'
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    OR (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      AND COALESCE(NULLIF(current_setting('app.enforce_rls', true), ''), 'off') <> 'on'
    )
  )
  WITH CHECK (
    NULLIF(current_setting('app.bypass_rls', true), '') = 'on'
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    OR (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      AND COALESCE(NULLIF(current_setting('app.enforce_rls', true), ''), 'off') <> 'on'
    )
  );

-- Subscriptions Policy
DROP POLICY IF EXISTS "tenant_isolation_subscriptions" ON "subscriptions";
CREATE POLICY "tenant_isolation_subscriptions" ON "subscriptions"
  FOR ALL
  USING (
    NULLIF(current_setting('app.bypass_rls', true), '') = 'on'
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    OR (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      AND COALESCE(NULLIF(current_setting('app.enforce_rls', true), ''), 'off') <> 'on'
    )
  )
  WITH CHECK (
    NULLIF(current_setting('app.bypass_rls', true), '') = 'on'
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    OR (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      AND COALESCE(NULLIF(current_setting('app.enforce_rls', true), ''), 'off') <> 'on'
    )
  );

-- Outbox Events Policy
DROP POLICY IF EXISTS "tenant_isolation_outbox_events" ON "outbox_events";
CREATE POLICY "tenant_isolation_outbox_events" ON "outbox_events"
  FOR ALL
  USING (
    NULLIF(current_setting('app.bypass_rls', true), '') = 'on'
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    OR (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      AND COALESCE(NULLIF(current_setting('app.enforce_rls', true), ''), 'off') <> 'on'
    )
  )
  WITH CHECK (
    NULLIF(current_setting('app.bypass_rls', true), '') = 'on'
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    OR (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      AND COALESCE(NULLIF(current_setting('app.enforce_rls', true), ''), 'off') <> 'on'
    )
  );

-- Audit Log Policy
DROP POLICY IF EXISTS "tenant_isolation_audit_log" ON "audit_log";
CREATE POLICY "tenant_isolation_audit_log" ON "audit_log"
  FOR ALL
  USING (
    NULLIF(current_setting('app.bypass_rls', true), '') = 'on'
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    OR (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      AND COALESCE(NULLIF(current_setting('app.enforce_rls', true), ''), 'off') <> 'on'
    )
  )
  WITH CHECK (
    NULLIF(current_setting('app.bypass_rls', true), '') = 'on'
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    OR (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      AND COALESCE(NULLIF(current_setting('app.enforce_rls', true), ''), 'off') <> 'on'
    )
  );

-- 4. Indirect Tenant-Isolation Policies (Domains, Content Sheets, Lead Events)

-- Domains Policy (via sites.tenant_id)
DROP POLICY IF EXISTS "tenant_isolation_domains" ON "domains";
CREATE POLICY "tenant_isolation_domains" ON "domains"
  FOR ALL
  USING (
    NULLIF(current_setting('app.bypass_rls', true), '') = 'on'
    OR site_id IN (
      SELECT id FROM "sites"
      WHERE tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    )
    OR (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      AND COALESCE(NULLIF(current_setting('app.enforce_rls', true), ''), 'off') <> 'on'
    )
  )
  WITH CHECK (
    NULLIF(current_setting('app.bypass_rls', true), '') = 'on'
    OR site_id IN (
      SELECT id FROM "sites"
      WHERE tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    )
    OR (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      AND COALESCE(NULLIF(current_setting('app.enforce_rls', true), ''), 'off') <> 'on'
    )
  );

-- Content Sheets Policy (via sites.tenant_id)
DROP POLICY IF EXISTS "tenant_isolation_content_sheets" ON "content_sheets";
CREATE POLICY "tenant_isolation_content_sheets" ON "content_sheets"
  FOR ALL
  USING (
    NULLIF(current_setting('app.bypass_rls', true), '') = 'on'
    OR site_id IN (
      SELECT id FROM "sites"
      WHERE tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    )
    OR (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      AND COALESCE(NULLIF(current_setting('app.enforce_rls', true), ''), 'off') <> 'on'
    )
  )
  WITH CHECK (
    NULLIF(current_setting('app.bypass_rls', true), '') = 'on'
    OR site_id IN (
      SELECT id FROM "sites"
      WHERE tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    )
    OR (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      AND COALESCE(NULLIF(current_setting('app.enforce_rls', true), ''), 'off') <> 'on'
    )
  );

-- Lead Events Policy (via leads.tenant_id)
DROP POLICY IF EXISTS "tenant_isolation_lead_events" ON "lead_events";
CREATE POLICY "tenant_isolation_lead_events" ON "lead_events"
  FOR ALL
  USING (
    NULLIF(current_setting('app.bypass_rls', true), '') = 'on'
    OR lead_id IN (
      SELECT id FROM "leads"
      WHERE tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    )
    OR (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      AND COALESCE(NULLIF(current_setting('app.enforce_rls', true), ''), 'off') <> 'on'
    )
  )
  WITH CHECK (
    NULLIF(current_setting('app.bypass_rls', true), '') = 'on'
    OR lead_id IN (
      SELECT id FROM "leads"
      WHERE tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    )
    OR (
      NULLIF(current_setting('app.tenant_id', true), '') IS NULL
      AND COALESCE(NULLIF(current_setting('app.enforce_rls', true), ''), 'off') <> 'on'
    )
  );
