import { NextRequest, NextResponse } from 'next/server';
import { withGateway } from '@/lib/gateway';
import { AppError } from '@/lib/errors';
import { fetchCmsAppointments } from '@/lib/cms-submissions';
import { backfillContentStoreAppointments } from '@/lib/appointmentSync';

export const GET = withGateway({ auth: 'none' }, async (req: NextRequest, ctx) => {
  const { searchParams } = new URL(req.url);

  const tenantId =
    searchParams.get('tenantId') ||
    req.headers.get('x-tenant-id');

  if (!tenantId) {
    throw new AppError('E-1101', 'Tenant ID is required for CMS submissions access');
  }

  const tab = (searchParams.get('tab') as 'today' | 'all') || 'all';
  const status = searchParams.get('status') || undefined;
  const service = searchParams.get('service') || undefined;
  const doctor = searchParams.get('doctor') || undefined;
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;
  const search = searchParams.get('search') || undefined;
  const cursor = searchParams.get('cursor') || null;
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 20;

  await backfillContentStoreAppointments(tenantId);

  const result = await fetchCmsAppointments({
    tenantId,
    tab,
    status,
    service,
    doctor,
    startDate,
    endDate,
    search,
    cursor,
    limit,
  });

  return NextResponse.json(result, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'X-Trace-ID': ctx.traceId,
    },
  });
});
