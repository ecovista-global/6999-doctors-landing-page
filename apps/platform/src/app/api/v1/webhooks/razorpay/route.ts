import { NextRequest, NextResponse } from 'next/server';
import { withGateway } from '@/lib/gateway';
import { processRazorpayWebhook } from '@/lib/billing';

export const POST = withGateway({ auth: 'none' }, async (req: NextRequest) => {
  const rawBody = await req.text();
  const signature = req.headers.get('x-razorpay-signature') || '';
  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';

  const result = await processRazorpayWebhook({
    rawBody,
    signature,
    ip: clientIp,
    userAgent: req.headers.get('user-agent'),
  });

  return NextResponse.json(result);
});
