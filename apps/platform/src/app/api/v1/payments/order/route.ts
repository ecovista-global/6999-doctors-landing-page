import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/lib/errors';
import { withGateway } from '@/lib/gateway';
import { clearIdempotency, processIdempotency, saveIdempotencyResponse } from '@/lib/idempotency';
import { createBillingOrder, getTenantBillingSummary } from '@/lib/billing';
import { renderGstInvoiceHtml } from '@/templates/invoice';

const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';

export const GET = withGateway({ auth: 'none' }, async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const tenantId =
    searchParams.get('tenantId') || req.headers.get('x-tenant-id') || DEMO_TENANT_ID;
  const invoiceId = searchParams.get('invoiceId');
  const clinicGstin = searchParams.get('gstin') || undefined;

  const summary = await getTenantBillingSummary(tenantId);

  if (invoiceId) {
    const inv = summary.invoices.find(
      (row) => row.id === invoiceId || row.invoiceNumber === invoiceId
    );
    if (!inv) {
      throw new AppError('E-1101', 'GST invoice not found');
    }

    const html = renderGstInvoiceHtml({
      invoiceNumber: inv.invoiceNumber,
      issuedAt: inv.issuedAt,
      razorpayPaymentId: inv.razorpayPaymentId,
      clinicName: summary.tenant.name,
      ...(clinicGstin ? { clinicGstin } : {}),
      plan: inv.plan,
      amountPaise: inv.amountPaise,
    });

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${inv.invoiceNumber}.html"`,
      },
    });
  }

  return NextResponse.json(summary);
});

export const POST = withGateway({ auth: 'none' }, async (req: NextRequest) => {
  const rawBody = await req.text();
  const idemKey = req.headers.get('idempotency-key')?.trim();

  if (idemKey) {
    const check = processIdempotency(`payment_order:${idemKey}`, rawBody || '{}');
    if (check.isReplay && check.record) {
      return NextResponse.json(check.record.body, { status: check.record.status });
    }
  }

  try {
    let body: any = {};
    if (rawBody) {
      try {
        body = JSON.parse(rawBody);
      } catch {
        throw new AppError('E-1101', 'Invalid JSON request body');
      }
    }
    const tenantId =
      body.tenantId || req.headers.get('x-tenant-id') || DEMO_TENANT_ID;

    const order = await createBillingOrder({
      tenantId,
      plan: body.plan,
      billingCycle: body.billingCycle,
      isInterState: Boolean(body.isInterState),
    });

    const responsePayload = { success: true, order };
    if (idemKey) {
      saveIdempotencyResponse(`payment_order:${idemKey}`, rawBody || '{}', 201, responsePayload);
    }

    return NextResponse.json(responsePayload, { status: 201 });
  } catch (err) {
    if (idemKey) clearIdempotency(`payment_order:${idemKey}`);
    throw err;
  }
});
