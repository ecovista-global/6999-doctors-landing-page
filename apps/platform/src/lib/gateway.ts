import { NextRequest, NextResponse } from 'next/server';
import { AppError, ERROR_REGISTRY } from './errors';

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  code: string;
  traceId: string;
  invalidParams?: Array<{ name: string; reason: string }>;
}

export interface GatewayContext {
  traceId: string;
  requestId: string;
  startTime: number;
}

export interface GatewayOptions {
  auth?: 'none' | 'operator' | 'tenant_owner' | 'tenant_staff' | 'superadmin';
  limit?: 'leads' | 'auth' | 'general' | 'none';
  idem?: boolean;
}

export type GatewayHandler = (
  req: NextRequest,
  ctx: GatewayContext
) => Promise<Response | NextResponse>;

// Structured JSON logger hook (SD-100 / MT-007)
export function logGatewayEvent(event: {
  level: 'info' | 'warn' | 'error';
  traceId: string;
  method: string;
  path: string;
  status?: number;
  durationMs?: number;
  code?: string;
  message?: string;
}) {
  const payload = {
    timestamp: new Date().toISOString(),
    ...event,
  };
  // Emits single-line JSON log without leaking sensitive body/stack
  console.log(JSON.stringify(payload));
}

export function formatProblemDetails(
  status: number,
  code: string,
  title: string,
  detail: string,
  traceId: string,
  invalidParams?: Array<{ name: string; reason: string }>
): NextResponse<ProblemDetails> {
  const body: ProblemDetails = {
    type: `https://api.doctorsite.in/errors/${code.toLowerCase()}`,
    title,
    status,
    detail,
    code,
    traceId,
    ...(invalidParams && invalidParams.length > 0 ? { invalidParams } : {}),
  };

  return NextResponse.json(body, {
    status,
    headers: {
      'Content-Type': 'application/problem+json',
      'X-Trace-ID': traceId,
      'X-Request-ID': traceId,
    },
  });
}

export function withGateway(
  options: GatewayOptions = {},
  handler: GatewayHandler
) {
  return async (req: NextRequest): Promise<Response> => {
    const startTime = Date.now();
    const incomingTraceId =
      req.headers.get('x-request-id') ||
      req.headers.get('x-trace-id') ||
      `trace-${Math.random().toString(36).substring(2, 10)}-${Date.now().toString(36)}`;

    const ctx: GatewayContext = {
      traceId: incomingTraceId,
      requestId: incomingTraceId,
      startTime,
    };

    try {
      // 1. Log inbound request
      logGatewayEvent({
        level: 'info',
        traceId: ctx.traceId,
        method: req.method,
        path: req.nextUrl?.pathname || req.url,
      });

      // 2. Validate Idempotency requirement if option enabled
      if (options.idem && req.method === 'POST') {
        const idemKey = req.headers.get('Idempotency-Key');
        if (!idemKey) {
          throw new AppError('E-1304', 'Missing Idempotency-Key header on mutating request');
        }
      }

      // 3. Execute Route Handler
      const response = await handler(req, ctx);

      // 4. Log completion
      const durationMs = Date.now() - startTime;
      logGatewayEvent({
        level: 'info',
        traceId: ctx.traceId,
        method: req.method,
        path: req.nextUrl?.pathname || req.url,
        status: response.status,
        durationMs,
      });

      // Attach tracing headers to successful responses
      response.headers.set('X-Trace-ID', ctx.traceId);
      response.headers.set('X-Request-ID', ctx.traceId);

      return response;
    } catch (err: unknown) {
      const durationMs = Date.now() - startTime;

      if (err instanceof AppError) {
        logGatewayEvent({
          level: err.status >= 500 ? 'error' : 'warn',
          traceId: ctx.traceId,
          method: req.method,
          path: req.nextUrl?.pathname || req.url,
          status: err.status,
          code: err.code,
          durationMs,
          message: err.message,
        });

        return formatProblemDetails(
          err.status,
          err.code,
          err.title,
          err.detail,
          ctx.traceId,
          err.invalidParams
        );
      }

      // Generic unhandled exception: NEVER leak stack trace or internal error messages
      const fallbackDef = ERROR_REGISTRY['E-2201'];
      logGatewayEvent({
        level: 'error',
        traceId: ctx.traceId,
        method: req.method,
        path: req.nextUrl?.pathname || req.url,
        status: 500,
        code: fallbackDef.code,
        durationMs,
        message: err instanceof Error ? err.message : 'Unknown exception',
      });

      return formatProblemDetails(
        500,
        fallbackDef.code,
        fallbackDef.title,
        fallbackDef.userMessage.en,
        ctx.traceId
      );
    }
  };
}
