import crypto from 'node:crypto';
import { pool } from '@/db';
import { recordAuditEvent } from '@/lib/audit';
import { AppError } from '@/lib/errors';

export type PlanTier = 'basic' | 'growth' | 'professional' | 'premium';
export type BillingCycle = 'initial' | 'renewal';

export const SAC_CODE = '998314';
export const GST_PERCENT = 18;
export const SELLER_PROFILE = {
  legalName: 'Ecodigitech Health Platforms Pvt. Ltd.',
  gstin: '07AAECE9999K1Z5',
  state: 'Delhi NCR (07)',
  address: 'Sector 62 Institutional Area, Noida - Delhi NCR 201309',
};

export const PLAN_PRICING: Record<PlanTier, { label: string; initialPaise: number; renewalPaise: number }> = {
  basic: { label: 'Basic Presence Plan', initialPaise: 699900, renewalPaise: 299900 },
  growth: { label: 'Growth Clinic Plan', initialPaise: 1299900, renewalPaise: 599900 },
  professional: { label: 'Professional Clinic Plan', initialPaise: 1899900, renewalPaise: 999900 },
  premium: { label: 'Premium Clinic Plan (Multi-Doctor)', initialPaise: 2499900, renewalPaise: 1499900 },
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface GstBreakdown {
  grossPaise: number;
  taxablePaise: number;
  gstPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  gstRatePercent: number;
  sacCode: string;
}

/** Format integer paise as Indian Rupees (e.g. Rs 18,999.00). */
export function formatInrFromPaise(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Split a GST-inclusive INR amount (in paise) into exact taxable base + 18% GST.
 * Example: 1899900 paise -> taxable 1610085 paise + GST 289815 paise.
 */
export function computeGstBreakdown(grossPaise: number, isInterState = false): GstBreakdown {
  if (!Number.isInteger(grossPaise) || grossPaise <= 0) {
    throw new AppError('E-1101', 'grossPaise must be a positive integer');
  }

  const taxablePaise = Math.round((grossPaise * 100) / 118);
  const gstPaise = grossPaise - taxablePaise;
  const cgstPaise = isInterState ? 0 : Math.floor(gstPaise / 2);
  const sgstPaise = isInterState ? 0 : gstPaise - cgstPaise;
  const igstPaise = isInterState ? gstPaise : 0;

  return {
    grossPaise,
    taxablePaise,
    gstPaise,
    cgstPaise,
    sgstPaise,
    igstPaise,
    gstRatePercent: GST_PERCENT,
    sacCode: SAC_CODE,
  };
}

/** Derive deterministic human-readable GST invoice serial from payment timestamp & id. */
export function buildInvoiceNumber(paymentId: string, createdAt: Date | string): string {
  const dateObj = createdAt instanceof Date ? createdAt : new Date(createdAt);
  const year = Number.isNaN(dateObj.getTime()) ? new Date().getUTCFullYear() : dateObj.getUTCFullYear();
  const suffix = paymentId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
  return `ECO-${year}-${suffix}`;
}

/** Constant-time Razorpay HMAC-SHA256 webhook signature check. */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signatureHex: string,
  secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'ecofone-dev-razorpay-webhook-secret'
): boolean {
  if (!signatureHex || !rawBody) return false;
  const expectedHex = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  const providedBuf = Buffer.from(signatureHex.trim().toLowerCase(), 'utf8');
  const expectedBuf = Buffer.from(expectedHex, 'utf8');
  if (providedBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}

/** Create a Razorpay order payload with canonical plan paise and 18% GST split. */
export async function createBillingOrder(params: {
  tenantId: string;
  plan?: PlanTier;
  billingCycle?: BillingCycle;
  isInterState?: boolean;
}) {
  if (!UUID_RE.test(params.tenantId)) {
    throw new AppError('E-1101', 'Invalid tenantId');
  }

  const plan: PlanTier = params.plan && params.plan in PLAN_PRICING ? params.plan : 'professional';
  const billingCycle: BillingCycle = params.billingCycle === 'renewal' ? 'renewal' : 'initial';
  const catalog = PLAN_PRICING[plan];
  const amountPaise = billingCycle === 'renewal' ? catalog.renewalPaise : catalog.initialPaise;
  const gstBreakdown = computeGstBreakdown(amountPaise, Boolean(params.isInterState));

  const client = await pool.connect();
  try {
    const tenantRes = await client.query<{ id: string; name: string }>(
      'SELECT id, name FROM tenants WHERE id = $1 LIMIT 1',
      [params.tenantId]
    );
    const tenant = tenantRes.rows[0];
    if (!tenant) {
      throw new AppError('E-1101', 'Tenant not found');
    }

    const orderId = `order_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const receipt = `rcpt_${params.tenantId.slice(0, 8)}_${billingCycle}_${Date.now()}`;

    return {
      orderId,
      currency: 'INR',
      amountPaise,
      amountFormatted: formatInrFromPaise(amountPaise),
      plan,
      planLabel: catalog.label,
      billingCycle,
      receipt,
      clinicName: tenant.name,
      gstBreakdown,
      notes: {
        tenantId: params.tenantId,
        plan,
        billingCycle,
      },
      gatewayMode: process.env.RAZORPAY_KEY_ID ? 'live' : 'sandbox',
    };
  } finally {
    client.release();
  }
}

/** Fetch tenant subscription status and payment invoices with GST breakdowns. */
export async function getTenantBillingSummary(tenantId: string) {
  if (!UUID_RE.test(tenantId)) {
    throw new AppError('E-1101', 'Invalid tenantId');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

    const tenantRes = await client.query<{ id: string; name: string; slug: string }>(
      'SELECT id, name, slug FROM tenants WHERE id = $1 LIMIT 1',
      [tenantId]
    );
    const tenant = tenantRes.rows[0];
    if (!tenant) {
      throw new AppError('E-1101', 'Tenant not found');
    }

    const subRes = await client.query<{
      id: string;
      plan: PlanTier;
      status: string;
      current_period_end: Date | string;
      renewal_price_paise: number;
      created_at: Date;
    }>(
      `SELECT id, plan, status, current_period_end, renewal_price_paise, created_at
       FROM subscriptions
       WHERE tenant_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [tenantId]
    );

    const paymentsRes = await client.query<{
      id: string;
      subscription_id: string;
      razorpay_payment_id: string;
      amount_paise: number;
      gst_paise: number;
      status: string;
      created_at: Date;
      plan: PlanTier;
    }>(
      `SELECT p.id, p.subscription_id, p.razorpay_payment_id, p.amount_paise, p.gst_paise, p.status, p.created_at, s.plan
       FROM payments p
       JOIN subscriptions s ON s.id = p.subscription_id
       WHERE s.tenant_id = $1
       ORDER BY p.created_at DESC`,
      [tenantId]
    );

    await client.query('COMMIT');

    const sub = subRes.rows[0];
    const subscription = sub
      ? {
          id: sub.id,
          plan: sub.plan,
          planLabel: PLAN_PRICING[sub.plan]?.label || sub.plan,
          status: sub.status,
          currentPeriodEnd:
            sub.current_period_end instanceof Date
              ? sub.current_period_end.toISOString().slice(0, 10)
              : String(sub.current_period_end).slice(0, 10),
          renewalPricePaise: sub.renewal_price_paise,
          renewalPriceFormatted: formatInrFromPaise(sub.renewal_price_paise),
        }
      : null;

    const invoices = paymentsRes.rows.map((p) => {
      const breakdown = computeGstBreakdown(p.amount_paise);
      return {
        id: p.id,
        invoiceNumber: buildInvoiceNumber(p.id, p.created_at),
        razorpayPaymentId: p.razorpay_payment_id,
        plan: p.plan,
        planLabel: PLAN_PRICING[p.plan]?.label || p.plan,
        amountPaise: p.amount_paise,
        gstPaise: p.gst_paise,
        taxablePaise: breakdown.taxablePaise,
        cgstPaise: breakdown.cgstPaise,
        sgstPaise: breakdown.sgstPaise,
        sacCode: SAC_CODE,
        status: p.status,
        issuedAt: p.created_at.toISOString(),
        amountFormatted: formatInrFromPaise(p.amount_paise),
      };
    });

    return {
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
      subscription,
      invoices,
      pricing: PLAN_PRICING,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Verify Razorpay HMAC webhook signature and atomically activate subscription + record GST payment. */
export async function processRazorpayWebhook(params: {
  rawBody: string;
  signature: string;
  secret?: string;
  ip?: string | null;
  userAgent?: string | null;
}) {
  if (!verifyRazorpayWebhookSignature(params.rawBody, params.signature, params.secret)) {
    throw new AppError('E-1401', 'Invalid Razorpay webhook signature');
  }

  let payload: any;
  try {
    payload = JSON.parse(params.rawBody);
  } catch {
    throw new AppError('E-1101', 'Invalid JSON webhook body');
  }

  const eventType: string = payload.event || 'payment.captured';
  const paymentEntity = payload.payload?.payment?.entity || payload.payment || payload;
  const razorpayPaymentId: string = String(paymentEntity?.id || '').trim();
  const amountPaise = Number(paymentEntity?.amount);
  const notes = paymentEntity?.notes || {};
  const tenantId: string = String(notes.tenantId || '').trim();
  const plan: PlanTier = notes.plan && notes.plan in PLAN_PRICING ? notes.plan : 'professional';
  const billingCycle: BillingCycle = notes.billingCycle === 'renewal' ? 'renewal' : 'initial';

  if (!razorpayPaymentId || !Number.isInteger(amountPaise) || amountPaise <= 0 || !UUID_RE.test(tenantId)) {
    throw new AppError('E-1101', 'Webhook payload requires valid payment id, positive amount in paise, and notes.tenantId');
  }

  const expectedAmount =
    billingCycle === 'renewal' ? PLAN_PRICING[plan].renewalPaise : PLAN_PRICING[plan].initialPaise;
  if (amountPaise !== expectedAmount) {
    throw new AppError('E-1101', `Amount mismatch for ${plan} ${billingCycle}: expected ${expectedAmount} paise`);
  }

  const idempotencyKey = `rzp_wh_${razorpayPaymentId}`;
  const breakdown = computeGstBreakdown(amountPaise);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

    // Check DB idempotency first before touching subscription or outbox
    const existingRes = await client.query<{
      id: string;
      subscription_id: string;
      amount_paise: number;
      gst_paise: number;
      created_at: Date;
    }>(
      `SELECT id, subscription_id, amount_paise, gst_paise, created_at
       FROM payments
       WHERE razorpay_payment_id = $1 OR idempotency_key = $2
       LIMIT 1`,
      [razorpayPaymentId, idempotencyKey]
    );

    const existing = existingRes.rows[0];
    if (existing) {
      await client.query('COMMIT');
      return {
        success: true,
        idempotent: true,
        event: eventType,
        paymentId: existing.id,
        subscriptionId: existing.subscription_id,
        razorpayPaymentId,
        invoiceNumber: buildInvoiceNumber(existing.id, existing.created_at),
        amountPaise: existing.amount_paise,
        gstPaise: existing.gst_paise,
      };
    }

    const subLookup = await client.query<{ id: string }>(
      `SELECT id FROM subscriptions WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
      [tenantId]
    );

    let subscriptionId = subLookup.rows[0]?.id;
    const renewalPricePaise = PLAN_PRICING[plan].renewalPaise;

    if (!subscriptionId) {
      const insertSub = await client.query<{ id: string }>(
        `INSERT INTO subscriptions (tenant_id, plan, status, current_period_end, renewal_price_paise)
         VALUES ($1, $2, 'active', CURRENT_DATE + INTERVAL '365 days', $3)
         RETURNING id`,
        [tenantId, plan, renewalPricePaise]
      );
      subscriptionId = insertSub.rows[0]?.id;
    } else {
      await client.query(
        `UPDATE subscriptions
         SET plan = $1,
             status = 'active',
             renewal_price_paise = $2,
             current_period_end = GREATEST(current_period_end, CURRENT_DATE) + INTERVAL '365 days'
         WHERE id = $3`,
        [plan, renewalPricePaise, subscriptionId]
      );
    }

    if (!subscriptionId) {
      throw new AppError('E-2201', 'Unable to activate tenant subscription');
    }

    await client.query(
      `UPDATE sites SET plan = $1, updated_at = NOW() WHERE tenant_id = $2`,
      [plan, tenantId]
    );

    const payRes = await client.query<{ id: string; created_at: Date }>(
      `INSERT INTO payments (subscription_id, razorpay_payment_id, amount_paise, gst_paise, status, idempotency_key)
       VALUES ($1, $2, $3, $4, 'captured', $5)
       RETURNING id, created_at`,
      [subscriptionId, razorpayPaymentId, amountPaise, breakdown.gstPaise, idempotencyKey]
    );

    const payRow = payRes.rows[0];
    if (!payRow) {
      throw new AppError('E-2201', 'Failed to persist captured payment');
    }

    const invoiceNumber = buildInvoiceNumber(payRow.id, payRow.created_at);

    await client.query(
      `INSERT INTO outbox_events (tenant_id, type, payload)
       VALUES ($1, 'billing.invoice_issued', $2::jsonb)`,
      [
        tenantId,
        JSON.stringify({
          invoiceNumber,
          paymentId: payRow.id,
          subscriptionId,
          razorpayPaymentId,
          plan,
          billingCycle,
          sacCode: SAC_CODE,
          taxablePaise: breakdown.taxablePaise,
          gstPaise: breakdown.gstPaise,
          grossPaise: breakdown.grossPaise,
        }),
      ]
    );

    await recordAuditEvent({
      tenantId,
      actorId: 'razorpay_webhook',
      action: 'billing.payment_captured',
      target: `subscription:${subscriptionId}`,
      details: {
        invoiceNumber,
        plan,
        billingCycle,
        amountPaise,
        gstPaise: breakdown.gstPaise,
        sacCode: SAC_CODE,
      },
      ip: params.ip || '127.0.0.1',
      userAgent: params.userAgent ?? null,
    });

    await client.query('COMMIT');

    return {
      success: true,
      idempotent: false,
      event: eventType,
      paymentId: payRow.id,
      subscriptionId,
      razorpayPaymentId,
      invoiceNumber,
      amountPaise,
      taxablePaise: breakdown.taxablePaise,
      gstPaise: breakdown.gstPaise,
      sacCode: SAC_CODE,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
