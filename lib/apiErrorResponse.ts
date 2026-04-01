import { NextRequest, NextResponse } from 'next/server';
import type { z } from 'zod';
import { getOrCreateRequestId } from '@/lib/requestId';
import { logApiError } from '@/lib/logger';

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Generic JSON error for API routes; omits internal details in production unless `exposeDetails` is true.
 */
export function jsonError(
  request: NextRequest,
  status: number,
  body: { error: string; details?: unknown },
  options?: { exposeDetails?: boolean }
): NextResponse {
  const requestId = getOrCreateRequestId(request);
  const payload: Record<string, unknown> = { error: body.error, requestId };
  if (body.details !== undefined && (!isProduction() || options?.exposeDetails)) {
    payload.details = body.details;
  }
  return NextResponse.json(payload, {
    status,
    headers: { 'x-request-id': requestId },
  });
}

export function zodErrorResponse(request: NextRequest, error: z.ZodError): NextResponse {
  if (isProduction()) {
    return jsonError(request, 400, { error: 'Validation error' });
  }
  return jsonError(request, 400, { error: 'Validation error', details: error.errors });
}

/**
 * Logs server-side and returns a sanitized 500 response (details only outside production).
 */
export function handleRouteError(
  request: NextRequest,
  logMessage: string,
  error: unknown,
  routeLabel?: string
): NextResponse {
  logApiError(request, logMessage, error, routeLabel);
  if (!isProduction()) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return jsonError(request, 500, { error: 'Internal server error', details: message });
  }
  return jsonError(request, 500, { error: 'Internal server error' });
}
