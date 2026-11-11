import { createHash } from 'node:crypto';
import type { NextRequest } from 'next/server';
import type { PoolClient } from 'pg';
import { validatePageSlots } from '@ecodigitech/content-schema';
import { pool } from '@/db';
import { recordAuditEvent } from '@/lib/audit';
import { AppError } from '@/lib/errors';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface SiteRow {
  id: string;
  tenant_id: string;
  plan: string;
  live_version: number;
  head_version: number;
  schema_version: string;
  theme: string;
  status: string;
  updated_at: Date;
}

export interface PublishInput {
  idOrTenantId: string;
  claimedTenantId?: string | null;
  data?: Record<string, unknown>;
  enabledPages?: string[];
  notes?: string;
  expectedHeadVersion?: number;
  theme?: string;
  actor?: string;
  ip?: string | null;
  userAgent?: string | null;
}

export interface RollbackInput {
  idOrTenantId: string;
  claimedTenantId?: string | null;
  targetVersion: number;
  reason?: string;
  actor?: string;
  ip?: string | null;
  userAgent?: string | null;
}

/** Extract dynamic [id] segment immediately following `/sites/` in Next 15 gateway routes. */
export function extractSiteId(req: NextRequest): string {
  const pathname = req.nextUrl?.pathname || new URL(req.url).pathname;
  const parts = pathname.split('/').filter(Boolean);
  const idx = parts.indexOf('sites');
  return idx !== -1 ? (parts[idx + 1] || '') : '';
}

function computeChecksum(data: Record<string, unknown>): string {
  const clean: Record<string, unknown> = { ...data };
  delete clean._meta;
  const hash = createHash('sha256').update(JSON.stringify(clean)).digest('hex');
  return `sha256-${hash.slice(0, 12)}`;
}

async function resolveSite(client: PoolClient, idOrTenantId: string, claimedTenantId?: string | null, lockForUpdate = false): Promise<SiteRow> {
  if (!idOrTenantId || !UUID_RE.test(idOrTenantId)) {
    throw new AppError('E-1101', 'Invalid site id');
  }

  await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
  const sql = `
    SELECT id, tenant_id, plan, live_version, head_version, schema_version, theme, status, updated_at
    FROM sites
    WHERE id = $1 OR tenant_id = $1
    LIMIT 1
    ${lockForUpdate ? 'FOR UPDATE' : ''}
  `;
  const res = await client.query<SiteRow>(sql, [idOrTenantId]);
  await client.query("SELECT set_config('app.bypass_rls', 'off', true)");

  const site = res.rows[0];
  if (!site) {
    throw new AppError('E-1101', 'Site not found for tenant');
  }
  if (claimedTenantId && UUID_RE.test(claimedTenantId) && site.tenant_id !== claimedTenantId) {
    throw new AppError('E-1101', 'Site does not belong to specified tenant');
  }

  await client.query("SELECT set_config('app.tenant_id', $1, true)", [site.tenant_id]);
  return site;
}

/** Fetch current site metadata and immutable published version snapshots. */
export async function getSiteVersions(idOrTenantId: string, claimedTenantId?: string | null) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const site = await resolveSite(client, idOrTenantId, claimedTenantId, false);
    const sheetsRes = await client.query(
      `SELECT id, version, data, schema_version, created_by, created_at
       FROM content_sheets
       WHERE site_id = $1
       ORDER BY version DESC`,
      [site.id]
    );
    await client.query('COMMIT');

    const versions = sheetsRes.rows.map((row) => {
      const meta = (row.data && typeof row.data === 'object' ? (row.data as Record<string, any>)._meta : null) || {};
      return {
        id: row.id,
        version: row.version,
        isLive: row.version === site.live_version,
        isHead: row.version === site.head_version,
        schemaVersion: row.schema_version,
        publishedBy: row.created_by,
        publishedAt: row.created_at ? row.created_at.toISOString() : new Date().toISOString(),
        notes: meta.notes || `Content snapshot v${row.version}`,
        checksum: meta.checksum || computeChecksum(row.data || {}),
        data: row.data,
      };
    });

    return {
      site: {
        id: site.id,
        tenantId: site.tenant_id,
        plan: site.plan,
        liveVersion: site.live_version,
        headVersion: site.head_version,
        schemaVersion: site.schema_version,
        theme: site.theme,
        status: site.status,
        updatedAt: site.updated_at.toISOString(),
      },
      versions,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Execute atomic publish saga: conflict guard -> validate -> snapshot -> pointer swap -> usage/outbox/audit. */
export async function publishSiteVersion(input: PublishInput) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const site = await resolveSite(client, input.idOrTenantId, input.claimedTenantId, true);

    if (typeof input.expectedHeadVersion === 'number' && input.expectedHeadVersion !== site.head_version) {
      throw new AppError(
        'E-1301',
        `Version conflict: expected head v${input.expectedHeadVersion}, current head is v${site.head_version}.`
      );
    }

    const latestRes = await client.query<{ data: Record<string, unknown> }>(
      `SELECT data FROM content_sheets WHERE site_id = $1 ORDER BY version DESC LIMIT 1`,
      [site.id]
    );
    const prevData = (latestRes.rows[0]?.data && typeof latestRes.rows[0].data === 'object')
      ? { ...latestRes.rows[0].data }
      : {};

    const mergedData: Record<string, unknown> = {
      ...prevData,
      ...(input.data && typeof input.data === 'object' ? input.data : {}),
    };
    if (Array.isArray(input.enabledPages)) {
      mergedData.enabledPages = input.enabledPages;
    }

    if (Array.isArray(mergedData.enabledPages)) {
      const validation = validatePageSlots(mergedData.enabledPages as string[]);
      if (!validation.valid) {
        throw new AppError('E-1601', validation.error || 'Invalid page slots');
      }
    }

    const notes = (input.notes || '').trim() || `Published site release v${site.head_version + 1}`;
    const checksum = computeChecksum(mergedData);
    mergedData._meta = { notes, checksum };

    const nextVersion = site.head_version + 1;
    const actor = (input.actor || '').trim() || 'Dr. Maanvita Kumari (Clinic Owner)';

    const insertRes = await client.query<{ id: string; created_at: Date }>(
      `INSERT INTO content_sheets (site_id, version, data, schema_version, created_by)
       VALUES ($1, $2, $3::jsonb, $4, $5)
       RETURNING id, created_at`,
      [site.id, nextVersion, JSON.stringify(mergedData), site.schema_version, actor]
    );

    const nextTheme = input.theme && ['green', 'blue', 'warm'].includes(input.theme) ? input.theme : site.theme;

    await client.query(
      `UPDATE sites
       SET head_version = $1, live_version = $1, status = 'published', theme = $2, updated_at = NOW()
       WHERE id = $3`,
      [nextVersion, nextTheme, site.id]
    );

    await client.query(
      `INSERT INTO usage_counters (tenant_id, period_start, content_updates_used)
       VALUES ($1, CURRENT_DATE, 1)
       ON CONFLICT (tenant_id) DO UPDATE SET
         content_updates_used = usage_counters.content_updates_used + 1,
         updated_at = NOW()`,
      [site.tenant_id]
    );

    await client.query(
      `INSERT INTO outbox_events (tenant_id, type, payload)
       VALUES ($1, 'site.published', $2::jsonb)`,
      [
        site.tenant_id,
        JSON.stringify({
          siteId: site.id,
          version: nextVersion,
          previousLiveVersion: site.live_version,
          checksum,
          notes,
        }),
      ]
    );

    await recordAuditEvent({
      tenantId: site.tenant_id,
      actorId: actor,
      action: 'site.published',
      target: `site:${site.id}`,
      details: {
        version: nextVersion,
        previousLiveVersion: site.live_version,
        checksum,
        notes,
      },
      ip: input.ip || '127.0.0.1',
      userAgent: input.userAgent ?? null,
    });

    await client.query('COMMIT');
    const inserted = insertRes.rows[0];
    if (!inserted) {
      throw new AppError('E-2201', 'Failed to persist content snapshot');
    }

    return {
      success: true,
      siteId: site.id,
      snapshotId: inserted.id,
      version: nextVersion,
      liveVersion: nextVersion,
      headVersion: nextVersion,
      checksum,
      notes,
      publishedBy: actor,
      publishedAt: inserted.created_at.toISOString(),
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Atomically swap sites.live_version pointer back to an existing archived snapshot. */
export async function rollbackSiteVersion(input: RollbackInput) {
  if (!Number.isInteger(input.targetVersion) || input.targetVersion < 1) {
    throw new AppError('E-1101', 'targetVersion must be a positive integer');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const site = await resolveSite(client, input.idOrTenantId, input.claimedTenantId, true);

    const targetRes = await client.query(
      `SELECT id, version FROM content_sheets WHERE site_id = $1 AND version = $2`,
      [site.id, input.targetVersion]
    );
    if (targetRes.rowCount === 0) {
      throw new AppError('E-1101', `Snapshot version v${input.targetVersion} does not exist for this site`);
    }

    const previousLiveVersion = site.live_version;
    const actor = (input.actor || '').trim() || 'Dr. Maanvita Kumari (Clinic Owner)';

    await client.query(
      `UPDATE sites SET live_version = $1, status = 'published', updated_at = NOW() WHERE id = $2`,
      [input.targetVersion, site.id]
    );

    await client.query(
      `INSERT INTO outbox_events (tenant_id, type, payload)
       VALUES ($1, 'site.rollback', $2::jsonb)`,
      [
        site.tenant_id,
        JSON.stringify({
          siteId: site.id,
          targetVersion: input.targetVersion,
          previousLiveVersion,
          reason: input.reason || '1-click CMS rollback',
        }),
      ]
    );

    await recordAuditEvent({
      tenantId: site.tenant_id,
      actorId: actor,
      action: 'site.rollback',
      target: `site:${site.id}`,
      details: {
        fromVersion: previousLiveVersion,
        toVersion: input.targetVersion,
        reason: input.reason || '1-click CMS rollback',
      },
      ip: input.ip || '127.0.0.1',
      userAgent: input.userAgent ?? null,
    });

    await client.query('COMMIT');

    return {
      success: true,
      siteId: site.id,
      liveVersion: input.targetVersion,
      headVersion: site.head_version,
      previousLiveVersion,
      rolledBackAt: new Date().toISOString(),
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
