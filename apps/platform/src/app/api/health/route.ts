import { NextResponse } from 'next/server';

/**
 * Liveness Healthcheck Endpoint (SD-074)
 * Returns 200 {"status": "ok"} if process responds. No external dependency checks.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ecodigitech-platform',
  });
}
