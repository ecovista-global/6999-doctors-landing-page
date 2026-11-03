import { NextResponse } from 'next/server';
import { withGateway } from '@/lib/gateway';

/**
 * Liveness Healthcheck Endpoint (SD-074)
 * Returns 200 {"status": "ok"} if process responds. Wrapped with withGateway.
 */
export const GET = withGateway({ auth: 'none' }, async () => {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ecodigitech-platform',
  });
});
