/**
 * Audit Trail Engine (MT-114 per 04 § 2, 18 § 7, SD-048)
 * Immutable, append-only audit logger capturing actor, action, resource, diff, IP hash, user agent.
 * Automatically scrubs any PII before recording into audit_log.
 */

import crypto from 'node:crypto';
import { pool } from '@/db';
import { scrubPII } from './crypto';

export interface AuditEventParams {
  tenantId?: string | null;
  actorId: string;
  action: string;
  target: string;
  details?: Record<string, any> | null;
  ip?: string | null;
  userAgent?: string | null;
}

export interface AuditRecord {
  id: string;
  tenantId: string | null;
  actorId: string;
  action: string;
  target: string;
  details: Record<string, any> | null;
  at: string;
}

/**
 * Records an immutable audit log entry.
 * Enforces zero-PII in details bodies (Rule R9 & SD-050).
 */
export async function recordAuditEvent(params: AuditEventParams): Promise<string> {
  const { tenantId, actorId, action, target, details, ip, userAgent } = params;

  // 1. Scrub PII from details payload before storage
  let cleanDetails: Record<string, any> | null = null;
  if (details) {
    cleanDetails = scrubPII(details) as Record<string, any>;
  } else {
    cleanDetails = {};
  }

  // 2. Hash IP address for DPDP Act 2023 compliance
  if (ip) {
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex');
    cleanDetails.ipHash = ipHash;
  }

  if (userAgent) {
    cleanDetails.userAgent = userAgent.substring(0, 255);
  }

  // 3. Insert into PostgreSQL audit_log table
  const client = await pool.connect();
  try {
    // If tenantId provided, set RLS context
    if (tenantId) {
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
    } else {
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
    }

    const res = await client.query(
      `INSERT INTO audit_log (
        tenant_id,
        actor_id,
        action,
        target,
        details,
        at
      ) VALUES ($1, $2, $3, $4, $5, now())
      RETURNING id`,
      [tenantId || null, actorId, action, target, cleanDetails ? JSON.stringify(cleanDetails) : null]
    );

    return res.rows[0].id;
  } finally {
    client.release();
  }
}

/**
 * Queries audit trail with tenant scoping
 */
export async function getAuditTrail(params: {
  tenantId?: string;
  target?: string;
  limit?: number;
}): Promise<AuditRecord[]> {
  const { tenantId, target, limit = 50 } = params;
  const client = await pool.connect();

  try {
    if (tenantId) {
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
    } else {
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
    }

    let query = 'SELECT id, tenant_id, actor_id, action, target, details, at FROM audit_log';
    const conditions: string[] = [];
    const values: any[] = [];

    if (tenantId) {
      values.push(tenantId);
      conditions.push(`tenant_id = $${values.length}`);
    }

    if (target) {
      values.push(target);
      conditions.push(`target = $${values.length}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    values.push(limit);
    query += ` ORDER BY at DESC LIMIT $${values.length}`;

    const res = await client.query(query, values);
    return res.rows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      actorId: row.actor_id,
      action: row.action,
      target: row.target,
      details: row.details,
      at: row.at.toISOString(),
    }));
  } finally {
    client.release();
  }
}
