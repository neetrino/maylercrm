import { describe, expect, it, beforeEach, vi } from 'vitest';

describe('checkRateLimit (memory fallback)', () => {
  beforeEach(() => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
    vi.resetModules();
  });

  it('allows requests under the limit for auth bucket', async () => {
    const { checkRateLimit } = await import('./rateLimit');
    const id = `test-auth-${Date.now()}`;
    const first = await checkRateLimit(id, 'auth');
    expect(first.success).toBe(true);
  });

  it('eventually rejects when exceeding auth limit (memory)', async () => {
    const { checkRateLimit } = await import('./rateLimit');
    const id = `burst-auth-${Date.now()}`;
    let lastSuccess = true;
    for (let i = 0; i < 35; i++) {
      const r = await checkRateLimit(id, 'auth');
      lastSuccess = r.success;
      if (!r.success) {
        break;
      }
    }
    expect(lastSuccess).toBe(false);
  });
});
