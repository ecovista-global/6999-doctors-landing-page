import type { PoolClient } from 'pg';

export const DEFAULT_DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';
export const DEFAULT_DEMO_TENANT_SLUG = 'healthconsult-demo';

/**
 * Resolve tenantId for public routes:
 * 1) explicit tenantId param,
 * 2) explicit clinicSlug lookup,
 * 3) active demo tenant (`healthconsult-demo` / DEFAULT_DEMO_TENANT_ID) so public pages match the CMS panel,
 * 4) fallback to oldest active tenant.
 */
export async function resolvePublicTenantId(
  client: PoolClient,
  tenantIdParam?: string | null,
  clinicSlug?: string | null
): Promise<string | null> {
  const explicitId = tenantIdParam?.trim();
  if (explicitId) {
    return explicitId;
  }

  const slug = clinicSlug?.trim();
  if (slug) {
    const slugLookup = await client.query<{ id: string }>(
      'SELECT id FROM tenants WHERE slug = $1 LIMIT 1',
      [slug]
    );
    if (slugLookup.rowCount && slugLookup.rowCount > 0) {
      return slugLookup.rows[0]!.id;
    }
  }

  const demoLookup = await client.query<{ id: string }>(
    'SELECT id FROM tenants WHERE status = $1 AND (id = $2 OR slug = $3) LIMIT 1',
    ['active', DEFAULT_DEMO_TENANT_ID, DEFAULT_DEMO_TENANT_SLUG]
  );
  if (demoLookup.rowCount && demoLookup.rowCount > 0) {
    return demoLookup.rows[0]!.id;
  }

  const fallbackLookup = await client.query<{ id: string }>(
    'SELECT id FROM tenants WHERE status = $1 ORDER BY created_at ASC LIMIT 1',
    ['active']
  );
  if (fallbackLookup.rowCount && fallbackLookup.rowCount > 0) {
    return fallbackLookup.rows[0]!.id;
  }

  return null;
}

