import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { pool } from '../src/db/index';
import { GET as getVersions, POST as postPublish } from '../src/app/api/v1/sites/[id]/publish/route';
import { POST as postRollback } from '../src/app/api/v1/sites/[id]/rollback/route';

describe('MT-124: Publishing Saga & 1-Click Rollback Controller', () => {
  const tenantId = randomUUID();
  const siteId = randomUUID();

  before(async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
      await client.query(
        'INSERT INTO tenants (id, slug, name, status) VALUES ($1, $2, $3, $4)',
        [tenantId, `publish-test-${Date.now()}`, 'Publish Test Clinic', 'active']
      );
      await client.query(
        `INSERT INTO sites (id, tenant_id, plan, live_version, head_version, schema_version, theme, status)
         VALUES ($1, $2, 'professional', 1, 1, '1.0.0', 'green', 'published')`,
        [siteId, tenantId]
      );
      await client.query(
        `INSERT INTO content_sheets (site_id, version, data, schema_version, created_by)
         VALUES ($1, 1, $2::jsonb, '1.0.0', 'System Setup')`,
        [
          siteId,
          JSON.stringify({
            clinicName: 'Initial Clinic Name',
            enabledPages: ['home', 'contact'],
            _meta: { notes: 'Baseline v1 release', checksum: 'sha256-base0001' },
          }),
        ]
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  });

  after(async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
      await client.query("SELECT set_config('app.bypass_audit_immutability', 'on', true)");
      await client.query('DELETE FROM outbox_events WHERE tenant_id = $1', [tenantId]);
      await client.query('DELETE FROM usage_counters WHERE tenant_id = $1', [tenantId]);
      await client.query('DELETE FROM content_sheets WHERE site_id = $1', [siteId]);
      await client.query('DELETE FROM sites WHERE id = $1', [siteId]);
      await client.query('DELETE FROM audit_log WHERE tenant_id = $1', [tenantId]);
      await client.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
      await client.query('COMMIT');
    } catch {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  it('lists initial v1 snapshot and executes atomic v2 publish with usage, outbox & audit trail', async () => {
    const initialRes = await getVersions(
      new NextRequest(`http://localhost:3000/api/v1/sites/${siteId}/publish`)
    );
    assert.strictEqual(initialRes.status, 200);
    const initialJson = await initialRes.json();
    assert.strictEqual(initialJson.site.liveVersion, 1);
    assert.strictEqual(initialJson.versions.length, 1);

    const publishRes = await postPublish(
      new NextRequest(`http://localhost:3000/api/v1/sites/${siteId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expectedHeadVersion: 1,
          data: { clinicName: 'Updated Clinic Name', consultationFee: 700 },
          enabledPages: ['home', 'about', 'services', 'contact'],
          notes: 'Fee & services update v2',
          actor: 'Dr. Test',
        }),
      })
    );
    assert.strictEqual(publishRes.status, 200);
    const publishJson = await publishRes.json();
    assert.strictEqual(publishJson.version, 2);
    assert.strictEqual(publishJson.liveVersion, 2);
    assert.strictEqual(publishJson.headVersion, 2);

    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
      const usageRes = await client.query(
        'SELECT content_updates_used FROM usage_counters WHERE tenant_id = $1',
        [tenantId]
      );
      assert.strictEqual(usageRes.rows[0]?.content_updates_used, 1);

      const outboxRes = await client.query(
        `SELECT type, payload FROM outbox_events WHERE tenant_id = $1 AND type = 'site.published'`,
        [tenantId]
      );
      assert.strictEqual(outboxRes.rowCount, 1);
      assert.strictEqual(outboxRes.rows[0].payload.version, 2);

      const auditRes = await client.query(
        `SELECT action FROM audit_log WHERE tenant_id = $1 AND action = 'site.published'`,
        [tenantId]
      );
      assert.strictEqual(auditRes.rowCount, 1);
    } finally {
      client.release();
    }
  });

  it('rejects stale expectedHeadVersion with 409 E-1301 and invalid page slots with 422 E-1601', async () => {
    const staleRes = await postPublish(
      new NextRequest(`http://localhost:3000/api/v1/sites/${siteId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expectedHeadVersion: 1, notes: 'Stale write' }),
      })
    );
    assert.strictEqual(staleRes.status, 409);
    const staleJson = await staleRes.json();
    assert.strictEqual(staleJson.code, 'E-1301');

    const badSlotRes = await postPublish(
      new NextRequest(`http://localhost:3000/api/v1/sites/${siteId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabledPages: ['home', 'invalid-slot'] }),
      })
    );
    assert.strictEqual(badSlotRes.status, 422);
    const badSlotJson = await badSlotRes.json();
    assert.strictEqual(badSlotJson.code, 'E-1601');
  });

  it('executes 1-click rollback swapping live_version while preserving v2 snapshot in history', async () => {
    const rollbackRes = await postRollback(
      new NextRequest(`http://localhost:3000/api/v1/sites/${siteId}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetVersion: 1, reason: 'Revert fee change' }),
      })
    );
    assert.strictEqual(rollbackRes.status, 200);
    const rollbackJson = await rollbackRes.json();
    assert.strictEqual(rollbackJson.liveVersion, 1);
    assert.strictEqual(rollbackJson.headVersion, 2);
    assert.strictEqual(rollbackJson.previousLiveVersion, 2);

    const listRes = await getVersions(
      new NextRequest(`http://localhost:3000/api/v1/sites/${siteId}/publish`)
    );
    const listJson = await listRes.json();
    assert.strictEqual(listJson.versions.length, 2);
    const v1 = listJson.versions.find((v: { version: number }) => v.version === 1);
    const v2 = listJson.versions.find((v: { version: number }) => v.version === 2);
    assert.strictEqual(v1.isLive, true);
    assert.strictEqual(v2.isLive, false);

    // Non-existent target snapshot returns 422 E-1101
    const missingRes = await postRollback(
      new NextRequest(`http://localhost:3000/api/v1/sites/${siteId}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetVersion: 999 }),
      })
    );
    assert.strictEqual(missingRes.status, 422);
    const missingJson = await missingRes.json();
    assert.strictEqual(missingJson.code, 'E-1101');
  });
});
