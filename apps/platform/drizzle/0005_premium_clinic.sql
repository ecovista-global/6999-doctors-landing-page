-- Migration 0005: Premium Clinic (₹24,999 / ₹14,999) multi-doctor directory, doctor booking selection, and monthly operations tracking
-- Includes strict tenant RLS isolation on new tables matching 0002_rls_policies.sql & 0004_media_assets.sql

CREATE TABLE IF NOT EXISTS doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  role text NOT NULL,
  degrees text NOT NULL,
  college text,
  registration text NOT NULL,
  department text NOT NULL DEFAULT 'General Medicine',
  specialties text[] NOT NULL DEFAULT '{}'::text[],
  experience text,
  schedule text,
  operating_hours jsonb,
  fee integer NOT NULL DEFAULT 600,
  bio text,
  photo_url text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS doctors_tenant_slug_idx ON doctors (tenant_id, slug);
CREATE INDEX IF NOT EXISTS doctors_tenant_order_idx ON doctors (tenant_id, display_order);

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_doctors ON doctors;
CREATE POLICY tenant_isolation_doctors ON doctors
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

-- Add optional doctor assignment columns on appointments
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS doctor_id uuid REFERENCES doctors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS doctor_name text;

CREATE INDEX IF NOT EXISTS appointments_tenant_doctor_date_idx
  ON appointments (tenant_id, doctor_id, preferred_date, preferred_time_slot, status);

-- Monthly content updates & minor changes usage column (5 updates + 60 mins / month)
ALTER TABLE usage_counters
  ADD COLUMN IF NOT EXISTS minor_change_minutes_used integer NOT NULL DEFAULT 0;

-- Monthly change requests / health checks / SLA log table
CREATE TABLE IF NOT EXISTS ops_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'content_update',
  title text NOT NULL,
  description text,
  minutes_spent integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'queued',
  created_by text NOT NULL DEFAULT 'clinic_owner',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS ops_requests_tenant_created_idx ON ops_requests (tenant_id, created_at DESC);

ALTER TABLE ops_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_requests FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_ops_requests ON ops_requests;
CREATE POLICY tenant_isolation_ops_requests ON ops_requests
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

