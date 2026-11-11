import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { NextRequest } from 'next/server';
import { pool } from '../src/db/index';
import { computeGstBreakdown } from '../src/lib/billing';
import { resetIdempotencyStore } from '../src/lib/idempotency';
import { GET as getBilling, POST as postCreateOrder } from '../src/app/api/v1/payments/order/route';
import { POST as postRazorpayWebhook } from '../src/app/api/v1/webhooks/razorpay/route';

const TEST_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'ecofone-dev-razorpay-webhook-secret';

function signBody(rawBody: string): string {
  return crypto.createHmac('sha256', TEST_WEBHOOK_SECRET).update(rawBody, 'utf8').digest('hex');
}

describe('MT-139: Razorpay 18,999 Billing, Webhook HMAC & 18% GST Invoice Generator', () => {
  const tenantId = crypto.randomUUID();
  let capturedPaymentId = '';

  before(async () => {
    resetIdempotencyStore();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
      await client.query(
        'INSERT INTO tenants (id, slug, name, status) VALUES ($1, $2, $3, $4)',
        [tenantId, `billing-test-${Date.now()}`, 'Noida Heart & Wellness Clinic', 'active']
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
    resetIdempotencyStore();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
      await client.query("SELECT set_config('app.bypass_audit_immutability', 'on', true)");
      await client.query(
        `DELETE FROM payments WHERE subscription_id IN (SELECT id FROM subscriptions WHERE tenant_id = $1)`,
        [tenantId]
      );
      await client.query('DELETE FROM subscriptions WHERE tenant_id = $1', [tenantId]);
      await client.query('DELETE FROM outbox_events WHERE tenant_id = $1', [tenantId]);
      await client.query('DELETE FROM audit_log WHERE tenant_id = $1', [tenantId]);
      await client.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
      await client.query('COMMIT');
    } catch {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  it('calculates exact GST-inclusive paise splits for 18,999 initial and 9,999 renewal under SAC 998314', () => {
    const initial = computeGstBreakdown(1899900);
    assert.strictEqual(initial.taxablePaise, 1610085);
    assert.strictEqual(initial.gstPaise, 289815);
    assert.strictEqual(initial.cgstPaise + initial.sgstPaise, 289815);
    assert.strictEqual(initial.sacCode, '998314');

    const renewal = computeGstBreakdown(999900);
    assert.strictEqual(renewal.taxablePaise, 847373);
    assert.strictEqual(renewal.gstPaise, 152527);
    assert.strictEqual(renewal.taxablePaise + renewal.gstPaise, 999900);
  });

  it('creates Razorpay order with idempotency caching and detects mismatched Idempotency-Key payloads', async () => {
    const idemKey = `order-key-${Date.now()}`;
    const payload = JSON.stringify({ tenantId, plan: 'professional', billingCycle: 'initial' });

    const res1 = await postCreateOrder(
      new NextRequest('http://localhost:3000/api/v1/payments/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idemKey },
        body: payload,
      })
    );
    assert.strictEqual(res1.status, 201);
    const json1 = await res1.json();
    assert.strictEqual(json1.order.amountPaise, 1899900);
    assert.strictEqual(json1.order.gstBreakdown.gstPaise, 289815);

    // Replay returns identical cached orderId
    const resReplay = await postCreateOrder(
      new NextRequest('http://localhost:3000/api/v1/payments/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idemKey },
        body: payload,
      })
    );
    assert.strictEqual(resReplay.status, 201);
    const jsonReplay = await resReplay.json();
    assert.strictEqual(jsonReplay.order.orderId, json1.order.orderId);

    // Different body on same Idempotency-Key returns 422 E-1302
    const resConflict = await postCreateOrder(
      new NextRequest('http://localhost:3000/api/v1/payments/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idemKey },
        body: JSON.stringify({ tenantId, plan: 'professional', billingCycle: 'renewal' }),
      })
    );
    assert.strictEqual(resConflict.status, 422);
    const conflictJson = await resConflict.json();
    assert.strictEqual(conflictJson.code, 'E-1302');
  });

  it('rejects forged Razorpay webhook signature with 401 E-1401', async () => {
    const rawBody = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: `pay_forged_${Date.now()}`,
            amount: 1899900,
            notes: { tenantId, plan: 'professional', billingCycle: 'initial' },
          },
        },
      },
    });

    const badRes = await postRazorpayWebhook(
      new NextRequest('http://localhost:3000/api/v1/webhooks/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': 'deadbeef0000111122223333',
        },
        body: rawBody,
      })
    );
    assert.strictEqual(badRes.status, 401);
    const badJson = await badRes.json();
    assert.strictEqual(badJson.code, 'E-1401');
  });

  it('activates subscription on valid signed webhook, deduplicates retries, and renders GST invoice HTML', async () => {
    const rzpPaymentId = `pay_valid_${Date.now()}`;
    const rawBody = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: rzpPaymentId,
            amount: 1899900,
            notes: { tenantId, plan: 'professional', billingCycle: 'initial' },
          },
        },
      },
    });
    const sig = signBody(rawBody);

    const okRes = await postRazorpayWebhook(
      new NextRequest('http://localhost:3000/api/v1/webhooks/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': sig,
        },
        body: rawBody,
      })
    );
    assert.strictEqual(okRes.status, 200);
    const okJson = await okRes.json();
    assert.strictEqual(okJson.idempotent, false);
    assert.strictEqual(okJson.amountPaise, 1899900);
    assert.strictEqual(okJson.gstPaise, 289815);
    assert.strictEqual(okJson.sacCode, '998314');
    capturedPaymentId = okJson.paymentId;

    // Duplicate webhook retry returns idempotent=true and creates no duplicate rows
    const retryRes = await postRazorpayWebhook(
      new NextRequest('http://localhost:3000/api/v1/webhooks/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': sig,
        },
        body: rawBody,
      })
    );
    assert.strictEqual(retryRes.status, 200);
    const retryJson = await retryRes.json();
    assert.strictEqual(retryJson.idempotent, true);
    assert.strictEqual(retryJson.paymentId, capturedPaymentId);

    const client = await pool.connect();
    try {
      await client.query("SELECT set_config('app.bypass_rls', 'on', true)");
      const payCountRes = await client.query(
        'SELECT COUNT(*)::int AS cnt FROM payments WHERE razorpay_payment_id = $1',
        [rzpPaymentId]
      );
      assert.strictEqual(payCountRes.rows[0]?.cnt, 1);

      const outboxRes = await client.query(
        `SELECT type FROM outbox_events WHERE tenant_id = $1 AND type = 'billing.invoice_issued'`,
        [tenantId]
      );
      assert.strictEqual(outboxRes.rowCount, 1);
    } finally {
      client.release();
    }

    // Fetch formatted 18% GST Tax Invoice HTML
    const invoiceRes = await getBilling(
      new NextRequest(
        `http://localhost:3000/api/v1/payments/order?tenantId=${tenantId}&invoiceId=${capturedPaymentId}&gstin=09AABCU9603R1ZM`
      )
    );
    assert.strictEqual(invoiceRes.status, 200);
    const html = await invoiceRes.text();
    assert.ok(html.includes('TAX INVOICE'));
    assert.ok(html.includes('998314'));
    assert.ok(html.includes('16,100.85'));
    assert.ok(html.includes('2,898.15'));
    assert.ok(html.includes('18,999.00'));
    assert.ok(html.includes('09AABCU9603R1ZM'));
  });
});
