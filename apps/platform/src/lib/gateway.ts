import { NextResponse } from 'next/server';

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

export function createErrorResponse(
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
    ...(invalidParams ? { invalidParams } : {}),
  };

  return NextResponse.json(body, {
    status,
    headers: {
      'Content-Type': 'application/problem+json',
      'X-Trace-ID': traceId,
    },
  });
}

export function generateTraceId(): string {
  return `trace-${Math.random().toString(36).substring(2, 10)}-${Date.now().toString(36)}`;
}
