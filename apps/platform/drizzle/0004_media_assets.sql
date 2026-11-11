-- Migration 0004: Tenant media library assets table + RLS isolation
-- Supports MT-123 (Cloudflare R2 / local asset storage + 1 GB quota tracking)

CREATE TABLE IF NOT EXISTS media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  storage_key text,
  file_size_bytes integer NOT NULL DEFAULT 0,
  mime_type text NOT NULL DEFAULT 'image/jpeg',
  dimensions text,
  assigned_to text DEFAULT 'unassigned',
  category text NOT NULL DEFAULT 'clinic',
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS media_assets_tenant_idx ON media_assets (tenant_id);

ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_media_assets ON media_assets;
CREATE POLICY tenant_isolation_media_assets ON media_assets
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
