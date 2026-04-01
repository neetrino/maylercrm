import pino from 'pino';
import type { NextRequest } from 'next/server';
import type { Logger } from 'pino';
import { getOrCreateRequestId as resolveRequestId } from '@/lib/requestId';

const LOG_LEVEL = process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

export const rootLogger: Logger = pino({
  level: LOG_LEVEL,
});

export { resolveRequestId as getOrCreateRequestId };

/**
 * Child logger bound to a single API request (requestId, safe route label).
 */
export function createApiLogger(request: NextRequest, routeLabel?: string): Logger {
  const requestId = resolveRequestId(request);
  return rootLogger.child({
    requestId,
    ...(routeLabel ? { route: routeLabel } : {}),
  });
}

/**
 * Logs an error from an API route; never logs Authorization or Cookie headers.
 */
export function logApiError(
  request: NextRequest,
  message: string,
  error: unknown,
  routeLabel?: string
): void {
  const log = createApiLogger(request, routeLabel);
  log.error(
    {
      err: error instanceof Error ? { message: error.message, name: error.name, stack: error.stack } : error,
    },
    message
  );
}
