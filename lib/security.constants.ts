/** Named limits for rate limiting and security helpers (no magic numbers in call sites). */

export const RATE_LIMIT_WINDOW_MS = 60_000;

/** Requests per window per IP for Bearer `/api/external/*`. */
export const RATE_LIMIT_EXTERNAL_MAX = 120;

/** Requests per window per IP for public `/api/landing/*`. */
export const RATE_LIMIT_LANDING_MAX = 120;

/** Requests per window per IP for `/api/auth/*` (credential brute-force mitigation). */
export const RATE_LIMIT_AUTH_MAX = 30;

/** In-memory fallback: max entries before eviction sweep. */
export const RATE_LIMIT_MEMORY_MAP_MAX_KEYS = 10_000;
