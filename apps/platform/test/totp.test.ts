import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { pool } from '../src/db/index';
import {
  encodeBase32,
  decodeBase32,
  generateTotpSecret,
  generateTotpCode,
  verifyTotpCode,
  getCurrentTimeStep,
  generateRecoveryCodes,
  hashRecoveryCode,
  clearLockoutStore,
} from '../src/lib/totp';
import { POST as setupPOST } from '../src/app/api/v1/auth/totp/setup/route';
import { POST as verifyPOST } from '../src/app/api/v1/auth/totp/verify/route';

describe('MT-113: TOTP 2FA Auth & Session Management Acceptance Suite', () => {
  let testUserId: string;
  let testTenantId: string;
  const testClinicSlug = `clinic-mt113-${Date.now()}`;
  const testEmail = `doctor-${Date.now()}@metroclinic.in`;

  before(async () => {
    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");

      const tenantRes = await client.query(
        `INSERT INTO tenants (slug, name, status)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [testClinicSlug, 'Metro Care Clinic', 'active']
      );
      testTenantId = tenantRes.rows[0].id;

      const userRes = await client.query(
        `INSERT INTO users (tenant_id, email, role)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [testTenantId, testEmail, 'tenant_owner']
      );
      testUserId = userRes.rows[0].id;
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

  beforeEach(() => {
    clearLockoutStore();
  });

  describe('Unit: RFC-6238 TOTP Engine', () => {
    it('encodes and decodes Base32 buffers reversibly', () => {
      const original = Buffer.from('DoctorSiteSecure2FA');
      const base32 = encodeBase32(original);
      const decoded = decodeBase32(base32);
      assert.strictEqual(decoded.toString('utf-8'), 'DoctorSiteSecure2FA');
    });

    it('generates a valid 20-byte Base32 secret', () => {
      const secret = generateTotpSecret();
      assert.strictEqual(typeof secret, 'string');
      assert.strictEqual(secret.length, 32); // 20 bytes -> 32 base32 chars
      const decoded = decodeBase32(secret);
      assert.strictEqual(decoded.length, 20);
    });

    it('generates and verifies 6-digit TOTP code for current step', () => {
      const secret = generateTotpSecret();
      const currentStep = getCurrentTimeStep();
      const code = generateTotpCode(secret, currentStep);

      assert.strictEqual(code.length, 6);
      assert.match(code, /^\d{6}$/);

      const isValid = verifyTotpCode(code, secret, 1);
      assert.strictEqual(isValid, true);
    });

    it('accepts drift tolerance of 1 step (+/- 30 seconds)', () => {
      const secret = generateTotpSecret();
      const currentStep = getCurrentTimeStep();

      // Code generated for 1 step ago (-30s)
      const pastCode = generateTotpCode(secret, currentStep - 1);
      assert.strictEqual(verifyTotpCode(pastCode, secret, 1), true);

      // Code generated for 1 step ahead (+30s)
      const futureCode = generateTotpCode(secret, currentStep + 1);
      assert.strictEqual(verifyTotpCode(futureCode, secret, 1), true);

      // Code generated 3 steps ago (-90s) must fail
      const staleCode = generateTotpCode(secret, currentStep - 3);
      assert.strictEqual(verifyTotpCode(staleCode, secret, 1), false);
    });

    it('generates 8 distinct backup recovery codes and hashes them correctly', () => {
      const codes = generateRecoveryCodes(8);
      assert.strictEqual(codes.length, 8);
      assert.strictEqual(new Set(codes).size, 8);

      const firstHash = hashRecoveryCode(codes[0]!);
      assert.strictEqual(typeof firstHash, 'string');
      assert.strictEqual(firstHash.length, 64); // SHA-256 hex
    });
  });

  describe('Integration: API Endpoints (Setup & Verify)', () => {
    let generatedSecret: string;
    let recoveryCodes: string[];

    it('Acceptance: POST /v1/auth/totp/setup creates secret and encrypted bundle in DB', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/auth/totp/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: testUserId }),
      });

      const res = await setupPOST(req);
      assert.strictEqual(res.status, 200, 'Setup must return 200 OK');

      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.secret);
      assert.ok(body.uri.includes('otpauth://totp/'));
      assert.strictEqual(body.recoveryCodes.length, 8);

      generatedSecret = body.secret;
      recoveryCodes = body.recoveryCodes;

      // Verify that totp_secret_enc is populated and totp_enabled is false initially
      const client = await pool.connect();
      try {
        await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
        const check = await client.query('SELECT totp_secret_enc, totp_enabled FROM users WHERE id = $1', [
          testUserId,
        ]);
        assert.ok(check.rows[0].totp_secret_enc);
        assert.strictEqual(check.rows[0].totp_enabled, false);
      } finally {
        client.release();
      }
    });

    it('Acceptance: POST /v1/auth/totp/verify with INVALID code returns 401 E-1605', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/auth/totp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: testUserId, code: '000000' }), // Invalid code
      });

      const res = await verifyPOST(req);
      assert.strictEqual(res.status, 401, 'Invalid code must return 401 Unauthorized');
      const body = await res.json();
      assert.strictEqual(body.code, 'E-1605');
    });

    it('Acceptance: POST /v1/auth/totp/verify with VALID code activates 2FA on account', async () => {
      const validCode = generateTotpCode(generatedSecret, getCurrentTimeStep());

      const req = new NextRequest('http://localhost:3000/api/v1/auth/totp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: testUserId, code: validCode }),
      });

      const res = await verifyPOST(req);
      assert.strictEqual(res.status, 200, 'Valid code must return 200 OK');
      const body = await res.json();
      assert.strictEqual(body.success, true);

      // Verify in DB that totp_enabled = true
      const client = await pool.connect();
      try {
        await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
        const check = await client.query('SELECT totp_enabled FROM users WHERE id = $1', [testUserId]);
        assert.strictEqual(check.rows[0].totp_enabled, true);
      } finally {
        client.release();
      }
    });

    it('Acceptance: POST /v1/auth/totp/verify with RECOVERY CODE succeeds and burns the code', async () => {
      const codeToUse = recoveryCodes[0]!;

      const req1 = new NextRequest('http://localhost:3000/api/v1/auth/totp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: testUserId, code: codeToUse }),
      });

      const res1 = await verifyPOST(req1);
      assert.strictEqual(res1.status, 200, 'Backup code must succeed');
      const body1 = await res1.json();
      assert.strictEqual(body1.usedRecoveryCode, true);
      assert.strictEqual(body1.remainingRecoveryCodes, 7);

      // Reusing the same recovery code must fail with 401 E-1605
      const req2 = new NextRequest('http://localhost:3000/api/v1/auth/totp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: testUserId, code: codeToUse }),
      });

      const res2 = await verifyPOST(req2);
      assert.strictEqual(res2.status, 401, 'Spent recovery code must be rejected');
      const body2 = await res2.json();
      assert.strictEqual(body2.code, 'E-1605');
    });

    it('Acceptance: 5 failed 2FA attempts triggers account lockout (429 E-1501)', async () => {
      for (let i = 1; i <= 4; i++) {
        const req = new NextRequest('http://localhost:3000/api/v1/auth/totp/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: testUserId, code: '111111' }),
        });
        const res = await verifyPOST(req);
        assert.strictEqual(res.status, 401);
      }

      // 5th attempt fails and engages lockout
      const req5 = new NextRequest('http://localhost:3000/api/v1/auth/totp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: testUserId, code: '111111' }),
      });
      const res5 = await verifyPOST(req5);
      assert.strictEqual(res5.status, 401);

      // 6th attempt is locked out (429 E-1501)
      const req6 = new NextRequest('http://localhost:3000/api/v1/auth/totp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: testUserId, code: '111111' }),
      });
      const res6 = await verifyPOST(req6);
      assert.strictEqual(res6.status, 429, 'Locked out account must return 429');
      const body6 = await res6.json();
      assert.strictEqual(body6.code, 'E-1501');
    });
  });
});
