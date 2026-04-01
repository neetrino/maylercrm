/**
 * Edge-safe request id (middleware + API routes). Avoids Node-only `crypto` import for Edge Runtime.
 */
export function getOrCreateRequestId(request: Request): string {
  const existing = request.headers.get('x-request-id');
  if (existing && existing.trim().length > 0) {
    return existing.trim();
  }
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
