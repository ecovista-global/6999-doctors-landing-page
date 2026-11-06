import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { pool } from '../src/db/index';
import { getAuditTrail } from '../src/lib/audit';
import {
  ALLOWED_PAGE_SLOTS,
  validatePageSlots,
  ProfessionalPageSlotsSchema,
} from '@ecodigitech/content-schema';
import { GET, PUT } from '../src/app/api/v1/cms/pages/route';

describe('MT-120: Page Slots Manager & 7-Page Limit Enforcer Acceptance Suite', () => {
  const tenantId = randomUUID();
  let siteId: string;

  before(async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");

      // 1. Seed Tenant & Site
      await client.query(
        'INSERT INTO tenants (id, slug, name, status) VALUES ($1, $2, $3, $4)',
        [tenantId, `pages-clinic-${Date.now()}`, 'Elite Multispecialty Hospital', 'active']
      );

      const siteRes = await client.query(
        'INSERT INTO sites (tenant_id, plan, theme, status) VALUES ($1, $2, $3, $4) RETURNING id',
        [tenantId, 'professional', 'teal', 'draft']
      );
      siteId = siteRes.rows[0].id;

      // 2. Seed Draft Content Sheet
      await client.query(
        `INSERT INTO content_sheets (site_id, version, data, created_by)
         VALUES ($1, 1, '{"doctor":{"name":"Dr. Mehta"},"clinic":{"name":"Elite Clinic"}}'::jsonb, 'test_user')`,
        [siteId]
      );

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
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
      await client.query('DELETE FROM content_sheets WHERE site_id = $1', [siteId]);
      await client.query('DELETE FROM sites WHERE tenant_id = $1', [tenantId]);
      await client.query('DELETE FROM clinic_settings WHERE tenant_id = $1', [tenantId]);
      await client.query('DELETE FROM audit_log WHERE tenant_id = $1', [tenantId]);
      await client.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  describe('Unit: 7-Page Architecture Schema Validation', () => {
    it('validates 7 standard page slots successfully', () => {
      const slots = ['home', 'about', 'services', 'doctors', 'testimonials-faq', 'blog', 'contact'];
      const res = validatePageSlots(slots);
      assert.strictEqual(res.valid, true);

      const parsed = ProfessionalPageSlotsSchema.safeParse(slots);
      assert.strictEqual(parsed.success, true);
    });

    it('rejects 8 or more page slots (limit enforcer)', () => {
      const eightSlots = [
        'home',
        'about',
        'services',
        'doctors',
        'testimonials-faq',
        'blog',
        'contact',
        'extra-page',
      ];
      const res = validatePageSlots(eightSlots);
      assert.strictEqual(res.valid, false);
      assert.ok(res.error?.includes('Maximum of 7'));

      const parsed = ProfessionalPageSlotsSchema.safeParse(eightSlots);
      assert.strictEqual(parsed.success, false);
    });

    it('rejects invalid or unauthorized slot names', () => {
      const invalid = ['home', 'about', 'pricing-plans'];
      const res = validatePageSlots(invalid);
      assert.strictEqual(res.valid, false);
      assert.ok(res.error?.includes('Invalid page slot'));
    });
  });

  describe('Integration: API Route 7-Page Limit Enforcer', () => {
    it('Acceptance: 7 pages toggled successfully and updates draft content sheet & audit log', async () => {
      const validSlots = ['home', 'about', 'services', 'doctors', 'testimonials-faq', 'blog', 'contact'];

      const req = new NextRequest(`http://localhost:3000/api/v1/cms/pages?tenantId=${tenantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
          'x-actor-id': 'admin_doctor',
        },
        body: JSON.stringify({ enabledPages: validSlots }),
      });

      const res = await PUT(req);
      assert.strictEqual(res.status, 200);

      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.pageCount, 7);
      assert.deepStrictEqual(json.enabledPages, validSlots);

      // Verify PostgreSQL clinic_settings update
      const client = await pool.connect();
      try {
        await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
        const dbRes = await client.query('SELECT enabled_pages FROM clinic_settings WHERE tenant_id = $1', [tenantId]);
        assert.deepStrictEqual(dbRes.rows[0].enabled_pages, validSlots);

        // Verify draft content sheet updated with enabledPages (Acceptance criterion)
        const sheetRes = await client.query('SELECT data FROM content_sheets WHERE site_id = $1', [siteId]);
        const content = sheetRes.rows[0].data;
        assert.deepStrictEqual(content.enabledPages, validSlots);
      } finally {
        client.release();
      }

      // Verify audit_log entry
      const auditTrail = await getAuditTrail({ tenantId, target: 'clinic_settings:enabled_pages' });
      const pagesLog = auditTrail.find((l) => l.action === 'pages.update');
      assert.ok(pagesLog, 'Must record pages.update in audit_log');
      assert.strictEqual(pagesLog.actorId, 'admin_doctor');
    });

    it('Acceptance: 8th page attempt is BLOCKED with 422 E-1601 (Page limit exceeded)', async () => {
      const eightSlots = [
        'home',
        'about',
        'services',
        'doctors',
        'testimonials-faq',
        'blog',
        'contact',
        'careers',
      ];

      const req = new NextRequest(`http://localhost:3000/api/v1/cms/pages?tenantId=${tenantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
        body: JSON.stringify({ enabledPages: eightSlots }),
      });

      const res = await PUT(req);
      assert.strictEqual(res.status, 422);

      const json = await res.json();
      assert.strictEqual(json.code, 'E-1601');
      assert.strictEqual(json.status, 422);
      assert.ok(json.detail.includes('Page limit exceeded'));
    });

    it('Acceptance: Invalid page slot string returns 422 E-1101', async () => {
      const invalidSlots = ['home', 'gallery_showcase'];

      const req = new NextRequest(`http://localhost:3000/api/v1/cms/pages?tenantId=${tenantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
        body: JSON.stringify({ enabledPages: invalidSlots }),
      });

      const res = await PUT(req);
      assert.strictEqual(res.status, 422);

      const json = await res.json();
      assert.strictEqual(json.code, 'E-1101');
    });
  });
});
