import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import {
  RATE_LIMIT_AUTH_MAX,
  RATE_LIMIT_EXTERNAL_MAX,
  RATE_LIMIT_LANDING_MAX,
  RATE_LIMIT_MEMORY_MAP_MAX_KEYS,
  RATE_LIMIT_WINDOW_MS,
} from '@/lib/security.constants';

export type RateLimitKind = 'external' | 'landing' | 'auth';

type MemoryBucket = {
  count: number;
  windowStart: number;
};

const memoryStore = new Map<string, MemoryBucket>();

function memoryFixedWindow(
  key: string,
  max: number,
  windowMs: number
): { success: boolean; retryAfterSec: number } {
  const now = Date.now();
  const bucket = memoryStore.get(key);
  if (!bucket || now - bucket.windowStart >= windowMs) {
    memoryStore.set(key, { count: 1, windowStart: now });
    if (memoryStore.size > RATE_LIMIT_MEMORY_MAP_MAX_KEYS) {
      const cutoff = now - windowMs;
      for (const [k, b] of memoryStore) {
        if (b.windowStart < cutoff) {
          memoryStore.delete(k);
        }
      }
    }
    return { success: true, retryAfterSec: Math.ceil(windowMs / 1000) };
  }
  if (bucket.count >= max) {
    const retryAfterMs = bucket.windowStart + windowMs - now;
    return { success: false, retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
  }
  bucket.count += 1;
  return { success: true, retryAfterSec: Math.ceil(windowMs / 1000) };
}

function limitForKind(kind: RateLimitKind): number {
  if (kind === 'external') {
    return RATE_LIMIT_EXTERNAL_MAX;
  }
  if (kind === 'landing') {
    return RATE_LIMIT_LANDING_MAX;
  }
  return RATE_LIMIT_AUTH_MAX;
}

/** Upstash `Duration` literal (fixed 60s window). */
const UPSTASH_WINDOW = '60 s';

type Limiters = {
  external: Ratelimit;
  landing: Ratelimit;
  auth: Ratelimit;
};

let cachedUpstash: Limiters | null | undefined;

function buildUpstashLimiters(): Limiters | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return null;
  }
  const redis = new Redis({ url, token });
  return {
    external: new Ratelimit({
      redis,
      prefix: 'rl:ext',
      limiter: Ratelimit.fixedWindow(RATE_LIMIT_EXTERNAL_MAX, UPSTASH_WINDOW),
    }),
    landing: new Ratelimit({
      redis,
      prefix: 'rl:land',
      limiter: Ratelimit.fixedWindow(RATE_LIMIT_LANDING_MAX, UPSTASH_WINDOW),
    }),
    auth: new Ratelimit({
      redis,
      prefix: 'rl:auth',
      limiter: Ratelimit.fixedWindow(RATE_LIMIT_AUTH_MAX, UPSTASH_WINDOW),
    }),
  };
}

function getUpstashLimiters(): Limiters | null {
  if (cachedUpstash === undefined) {
    cachedUpstash = buildUpstashLimiters();
  }
  return cachedUpstash;
}

/**
 * Returns whether the request is allowed; uses Upstash when `UPSTASH_*` env is set, else in-memory (per-instance).
 */
export async function checkRateLimit(
  identifier: string,
  kind: RateLimitKind
): Promise<{ success: boolean; retryAfterSec: number }> {
  const limiters = getUpstashLimiters();
  if (limiters) {
    const limiter =
      kind === 'external' ? limiters.external : kind === 'landing' ? limiters.landing : limiters.auth;
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      retryAfterSec: result.reset
        ? Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))
        : Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
    };
  }
  const max = limitForKind(kind);
  const key = `${kind}:${identifier}`;
  return memoryFixedWindow(key, max, RATE_LIMIT_WINDOW_MS);
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) {
      return first;
    }
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp?.trim()) {
    return realIp.trim();
  }
  return '127.0.0.1';
}
