import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import {
  checkHoneypot,
  checkTimeTrap,
  verifyTurnstileToken,
  validateSpamProtection,
} from '../src/lib/spam-protection';
import { POST as appointmentsPOST } from '../src/app/api/v1/public/appointments/route';
import { AppError } from '../src/lib/errors';
import { pool } from '../src/db/index';

describe('MT-111: Turnstile, Honeypot & Bot Protection Acceptance Suite', () => {
  let testTenantId: string;
  const testClinicSlug = `clinic-mt111-${Date.now()}`;

  before(async () => {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
      const res = await client.query(
        `INSERT INTO tenants (slug, name, status)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [testClinicSlug, 'Anti-Spam Verification Clinic', 'active']
      );
      testTenantId = res.rows[0].id;
    } finally {
      client.release();
    }
  });

  after(async () => {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
      await client.query('DELETE FROM tenants WHERE id = $1', [testTenantId]);
    } finally {
      client.release();
      await pool.end();
    }
  });
  describe('Unit: Honeypot Protection', () => {
    it('returns true when honeypot is empty, undefined, or null', () => {
      assert.strictEqual(checkHoneypot(undefined), true);
      assert.strictEqual(checkHoneypot(null), true);
      assert.strictEqual(checkHoneypot(''), true);
      assert.strictEqual(checkHoneypot('   '), true);
    });

    it('returns false when honeypot is populated with any text', () => {
      assert.strictEqual(checkHoneypot('https://spambot.ru'), false);
      assert.strictEqual(checkHoneypot('seo marketing offer'), false);
      assert.strictEqual(checkHoneypot('1'), false);
    });
  });

  describe('Unit: Time-Trap Protection', () => {
    it('returns true when elapsed time is >= 3000 ms', () => {
      const now = Date.now();
      const humanRenderedAt = now - 4500; // 4.5 seconds ago
      assert.strictEqual(checkTimeTrap(humanRenderedAt, now, 3000), true);
    });

    it('returns false when submission is faster than 3000 ms (< 3s bot burst)', () => {
      const now = Date.now();
      const botRenderedAt = now - 800; // 800 ms ago
      assert.strictEqual(checkTimeTrap(botRenderedAt, now, 3000), false);
    });

    it('returns false on negative or malformed render timestamps', () => {
      assert.strictEqual(checkTimeTrap('not-a-timestamp', Date.now(), 3000), false);
      assert.strictEqual(checkTimeTrap(-100, Date.now(), 3000), false);
    });
  });

  describe('Unit: Cloudflare Turnstile Verification', () => {
    it('accepts Cloudflare test passing dummy tokens', async () => {
      const pass1 = await verifyTurnstileToken('XXXX.DUMMY.TOKEN.PASS');
      assert.strictEqual(pass1, true);

      const pass2 = await verifyTurnstileToken('valid-turnstile-token');
      assert.strictEqual(pass2, true);
    });

    it('rejects Cloudflare test failing dummy tokens', async () => {
      const fail1 = await verifyTurnstileToken('XXXX.DUMMY.TOKEN.FAIL');
      assert.strictEqual(fail1, false);

      const fail2 = await verifyTurnstileToken('invalid-turnstile-token');
      assert.strictEqual(fail2, false);
    });

    it('rejects empty or whitespace-only tokens', async () => {
      assert.strictEqual(await verifyTurnstileToken(''), false);
      assert.strictEqual(await verifyTurnstileToken('   '), false);
      assert.strictEqual(await verifyTurnstileToken(null), false);
      assert.strictEqual(await verifyTurnstileToken(undefined), false);
    });
  });

  describe('Unit: validateSpamProtection Coordinator', () => {
    it('rejects filled honeypot with AppError 403 E-1604', async () => {
      await assert.rejects(
        async () => {
          await validateSpamProtection({
            honeypot: 'bot-content',
            formRenderedAt: Date.now() - 5000,
          });
        },
        (err: any) => {
          assert.ok(err instanceof AppError);
          assert.strictEqual(err.code, 'E-1604');
          return true;
        }
      );
    });

    it('rejects time-trap violation (< 3s) with AppError 403 E-1604', async () => {
      await assert.rejects(
        async () => {
          await validateSpamProtection({
            honeypot: '',
            formRenderedAt: Date.now() - 1000, // 1 sec
          });
        },
        (err: any) => {
          assert.ok(err instanceof AppError);
          assert.strictEqual(err.code, 'E-1604');
          return true;
        }
      );
    });

    it('rejects invalid Turnstile token with AppError 403 E-1604', async () => {
      await assert.rejects(
        async () => {
          await validateSpamProtection({
            honeypot: '',
            formRenderedAt: Date.now() - 5000,
            turnstileToken: 'invalid-turnstile-token',
          });
        },
        (err: any) => {
          assert.ok(err instanceof AppError);
          assert.strictEqual(err.code, 'E-1604');
          return true;
        }
      );
    });

    it('passes cleanly when honeypot is empty, time >= 3s, and Turnstile is valid', async () => {
      await assert.doesNotReject(async () => {
        await validateSpamProtection({
          honeypot: '',
          formRenderedAt: Date.now() - 5000,
          turnstileToken: 'valid-turnstile-token',
        });
      });
    });
  });

  describe('Integration: Public API Bot Protection Enforcement', () => {
    it('Acceptance: Fake bot submission with honeypot filled is rejected with 403 E-1604', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/public/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `idem-bot-hp-${randomUUID()}`,
          'X-Forwarded-For': '198.51.100.201',
        },
        body: JSON.stringify({
          tenantId: testTenantId,
          patientName: 'Spam Bot Automated',
          patientPhone: '+919876543210',
          serviceName: 'General Consultation',
          preferredDate: '2026-11-25',
          preferredTimeSlot: '10:00 AM',
          consent: true,
          honeypot: 'http://buy-viagra-discount.ru', // Honeypot trap filled
          formRenderedAt: Date.now() - 5000,
        }),
      });

      const res = await appointmentsPOST(req);
      assert.strictEqual(res.status, 403, 'Bot submission with honeypot must return HTTP 403 Forbidden');
      const body = await res.json();
      assert.strictEqual(body.code, 'E-1604');
    });

    it('Acceptance: Rapid bot submission (< 3s time-trap) is rejected with 403 E-1604', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/public/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `idem-bot-time-${randomUUID()}`,
          'X-Forwarded-For': '198.51.100.202',
        },
        body: JSON.stringify({
          tenantId: testTenantId,
          patientName: 'Automated Fast Bot',
          patientPhone: '+919876543210',
          serviceName: 'General Consultation',
          preferredDate: '2026-11-25',
          preferredTimeSlot: '10:00 AM',
          consent: true,
          honeypot: '',
          formRenderedAt: Date.now() - 500, // Submitted 500ms after render
        }),
      });

      const res = await appointmentsPOST(req);
      assert.strictEqual(res.status, 403, 'Fast submission < 3s must return HTTP 403 Forbidden');
      const body = await res.json();
      assert.strictEqual(body.code, 'E-1604');
    });

    it('Acceptance: Submission with invalid Turnstile token is rejected with 403 E-1604', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/public/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `idem-bot-token-${randomUUID()}`,
          'X-Forwarded-For': '198.51.100.203',
        },
        body: JSON.stringify({
          tenantId: testTenantId,
          patientName: 'Token Failed Bot',
          patientPhone: '+919876543210',
          serviceName: 'General Consultation',
          preferredDate: '2026-11-25',
          preferredTimeSlot: '10:00 AM',
          consent: true,
          honeypot: '',
          formRenderedAt: Date.now() - 6000,
          turnstileToken: 'invalid-turnstile-token', // Invalid CAPTCHA token
        }),
      });

      const res = await appointmentsPOST(req);
      assert.strictEqual(res.status, 403, 'Invalid Turnstile token must return HTTP 403');
      const body = await res.json();
      assert.strictEqual(body.code, 'E-1604');
    });

    it('Acceptance: Valid human submission with passing Turnstile token succeeds with 202 Accepted', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/public/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `idem-human-pass-${randomUUID()}`,
          'X-Forwarded-For': '198.51.100.204',
        },
        body: JSON.stringify({
          tenantId: testTenantId,
          patientName: 'Devika Sengupta',
          patientPhone: '+919876543210',
          serviceName: 'General Consultation',
          preferredDate: '2026-11-25',
          preferredTimeSlot: '10:00 AM',
          consent: true,
          honeypot: '',
          formRenderedAt: Date.now() - 10000, // 10s elapsed
          turnstileToken: 'valid-turnstile-token', // Valid token
        }),
      });

      const res = await appointmentsPOST(req);
      assert.strictEqual(res.status, 202, 'Legitimate human submission must succeed with HTTP 202');
      const body = await res.json();
      assert.strictEqual(body.status, 'accepted');
      assert.ok(body.appointmentId);
    });
  });
});
