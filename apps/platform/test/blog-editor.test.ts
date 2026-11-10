import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeHtml, extractPlainText, generateSlug, calculateReadTime } from '../src/lib/htmlSanitizer';
import { pool } from '../src/db';

const TEST_TENANT = '00000000-0000-0000-0000-000000000001';

describe('MT-121: Rich-Text Blog Sanitizer & Content Processor', () => {
  it('strips malicious <script> tags and enclosed payload entirely', () => {
    const malicious = '<p>Normal text</p><script>alert("XSS stolen cookies")</script><div>End text</div>';
    const clean = sanitizeHtml(malicious);
    assert.ok(!clean.includes('script'));
    assert.ok(!clean.includes('alert'));
    assert.ok(clean.includes('<p>Normal text</p>'));
    assert.ok(clean.includes('<div>End text</div>'));
  });

  it('strips dangerous iframes, embeds, and objects', () => {
    const malicious = '<iframe src="https://evil.example.com"></iframe><p>Safe clinical pearl</p><embed src="flash.swf">';
    const clean = sanitizeHtml(malicious);
    assert.ok(!clean.includes('iframe'));
    assert.ok(!clean.includes('embed'));
    assert.ok(clean.includes('<p>Safe clinical pearl</p>'));
  });

  it('strips inline event listeners like onerror, onload, and onclick', () => {
    const malicious = '<img src="invalid.jpg" onerror="alert(document.cookie)" /><a href="#" onclick="evil()">Click</a>';
    const clean = sanitizeHtml(malicious);
    assert.ok(!clean.includes('onerror'));
    assert.ok(!clean.includes('onclick'));
    assert.ok(!clean.includes('alert'));
  });

  it('blocks javascript: and vbscript: URIs in links and images', () => {
    const malicious = '<a href="javascript:alert(1)">Infected Link</a><img src="vbscript:msgbox">';
    const clean = sanitizeHtml(malicious);
    assert.ok(!clean.includes('javascript:'));
    assert.ok(!clean.includes('vbscript:'));
  });

  it('preserves legitimate clinical rich text and medical callouts', () => {
    const clinicalHtml = `
      <h2>Summer Diabetes Precautions</h2>
      <p>Hydration is critical for glycemic stability.</p>
      <div class="clinical-callout"><strong>Clinical Pearl:</strong> Check glucose 2 hours postprandial.</div>
      <div class="clinical-callout emergency-alert"><strong>Emergency Red Flag:</strong> Mucosal bleeding requires ER.</div>
      <ul>
        <li>Drink 3 liters of water</li>
        <li>Avoid direct sunlight on insulin vials</li>
      </ul>
      <blockquote>Evidence-based outpatient medicine</blockquote>
    `;
    const clean = sanitizeHtml(clinicalHtml);
    assert.ok(clean.includes('<h2>Summer Diabetes Precautions</h2>'));
    assert.ok(clean.includes('clinical-callout'));
    assert.ok(clean.includes('emergency-alert'));
    assert.ok(clean.includes('<strong>Clinical Pearl:</strong>'));
    assert.ok(clean.includes('<ul>'));
    assert.ok(clean.includes('<blockquote>Evidence-based outpatient medicine</blockquote>'));
  });

  it('generates URL-safe and SEO-compliant slugs', () => {
    assert.equal(
      generateSlug("Managing Type-2 Diabetes in Urban Lifestyles: A Clinician's Guide"),
      'managing-type-2-diabetes-in-urban-lifestyles-a-clinicians-guide'
    );
    assert.equal(
      generateSlug('  Seasonal Fevers & Dengue 2026!  '),
      'seasonal-fevers-dengue-2026'
    );
  });

  it('calculates realistic reading times based on 200 words-per-minute pace', () => {
    const shortArticle = '<p>' + 'word '.repeat(100) + '</p>';
    assert.equal(calculateReadTime(shortArticle), '1 min read');

    const longArticle = '<p>' + 'word '.repeat(650) + '</p>';
    assert.equal(calculateReadTime(longArticle), '4 min read');
  });

  it('extracts plain text accurately removing HTML tags and entities', () => {
    const html = '<h2>Title</h2><p>Here is &nbsp; a &amp; b &lt; c &gt; d "quoted".</p>';
    const plain = extractPlainText(html);
    assert.equal(plain, 'Title Here is a & b < c > d "quoted".');
  });
});

describe('MT-121: Blog Database & API Integration', () => {
  const testSlug = `test-article-${Date.now()}`;
  let createdPostId: string;

  it('creates a new clinical article in database with sanitized HTML', async () => {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [TEST_TENANT]);

      // Ensure tenant exists
      await client.query(`
        INSERT INTO tenants (id, slug, name, status)
        VALUES ($1, 'demo-clinic', 'Demo Clinic', 'active')
        ON CONFLICT (id) DO NOTHING
      `, [TEST_TENANT]);

      const contentJson = {
        html: sanitizeHtml('<h2>Test Heading</h2><script>bad()</script><p>Clean body paragraph.</p>'),
        category: 'General Medicine',
        readTime: '3 min read',
        tags: ['General Medicine'],
      };

      const res = await client.query(
        `INSERT INTO posts (tenant_id, title, slug, excerpt, content_json, is_published, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
         RETURNING id, title, slug, content_json, is_published`,
        [TEST_TENANT, 'Test Automated Article', testSlug, 'Test excerpt overview', contentJson]
      );

      assert.equal(res.rowCount, 1);
      createdPostId = res.rows[0].id;
      assert.equal(res.rows[0].slug, testSlug);
      assert.ok(!res.rows[0].content_json.html.includes('script'));
      assert.ok(res.rows[0].content_json.html.includes('Clean body paragraph'));
    } finally {
      client.release();
    }
  });

  it('prevents duplicate slug creation for the same tenant', async () => {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [TEST_TENANT]);

      await assert.rejects(
        async () => {
          await client.query(
            `INSERT INTO posts (tenant_id, title, slug, excerpt, content_json, is_published)
             VALUES ($1, 'Duplicate Slug Article', $2, 'Another excerpt', '{"html": "<p>Dup</p>"}'::jsonb, true)`,
            [TEST_TENANT, testSlug]
          );
        },
        (err: any) => {
          assert.ok(err.code === '23505', 'Expected unique constraint violation error code 23505');
          return true;
        }
      );
    } finally {
      client.release();
    }
  });

  it('updates the existing article and maintains data integrity', async () => {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [TEST_TENANT]);

      const res = await client.query(
        `UPDATE posts
         SET title = 'Updated Title for Article',
             updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2
         RETURNING id, title`,
        [createdPostId, TEST_TENANT]
      );

      assert.equal(res.rowCount, 1);
      assert.equal(res.rows[0].title, 'Updated Title for Article');
    } finally {
      client.release();
    }
  });

  it('deletes the test article cleanly', async () => {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [TEST_TENANT]);

      const res = await client.query(
        `DELETE FROM posts WHERE id = $1 AND tenant_id = $2 RETURNING id`,
        [createdPostId, TEST_TENANT]
      );

      assert.equal(res.rowCount, 1);
    } finally {
      client.release();
    }
  });
});
