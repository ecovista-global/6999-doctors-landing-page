import { NextRequest, NextResponse } from 'next/server';
import { withGateway } from '@/lib/gateway';
import { extractSiteId, rollbackSiteVersion } from '@/lib/publish';

export const POST = withGateway({ auth: 'none' }, async (req: NextRequest) => {
  const idOrTenantId = extractSiteId(req);
  const claimedTenantId = req.headers.get('x-tenant-id');
  const body = await req.json().catch(() => ({}));
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '127.0.0.1';

  const result = await rollbackSiteVersion({
    idOrTenantId,
    claimedTenantId,
    targetVersion: Number(body.targetVersion),
    reason: body.reason,
    actor: body.actor || req.headers.get('x-actor-id') || undefined,
    ip: clientIp,
    userAgent: req.headers.get('user-agent'),
  });

  return NextResponse.json(result);
});
