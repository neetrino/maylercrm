# Public Health Check Plan

## Goal

Expose **`GET /api/health`** as a **public** HTTP endpoint so Uptime Kuma (and similar monitors) can verify availability with **HTTP 200** and a small JSON body **without** login, cookies, `Authorization`, CSRF, or session. All other authentication and API protection must stay unchanged.

## Current Behavior

A request to **`/api/health`** (e.g. from Uptime Kuma) hits the **Next.js middleware** first. The middleware responds with **JSON** shaped like `{ "error": "Unauthorized", "requestId": "..." }` and **HTTP 401** before any App Route handler runs.

There is **no** `app/api/health/route.ts` (or equivalent) in the repository, so the application does not define a dedicated health route today; the observable behavior is entirely from **global API protection in middleware**.

> **Note on 403 vs 401:** The response body matches the app’s **401 Unauthorized** branch in `middleware.ts`. If a monitor or edge reports **403**, that may be a proxy/WAF mapping or monitor labeling; the **root cause in code** is the middleware’s unauthenticated `/api/*` handling.

## Current Auth Flow

1. **Framework:** Next.js **App Router** (`app/` layout, `app/api/**/route.ts` API handlers).
2. **Root middleware:** `middleware.ts` at the project root exports the default handler wrapped with **`auth`** from **`@/auth`** (NextAuth v5-style `auth()` integration). The **`config.matcher`** runs the middleware on almost all paths except `_next/static`, `_next/image`, and `favicon.ico`.
3. **Order of relevance for APIs:**
   - Rate limiting for specific prefixes (`/api/external/`, `/api/landing/`, `/api/auth/`).
   - **`/api/auth/*`:** after rate limit, **`NextResponse.next()`** (NextAuth routes).
   - **Page:** `/login` allows unauthenticated access; authenticated users are redirected away.
   - **Public pages:** `/l/*` (landing links) pass through.
   - **Public API:** `/api/landing/*` passes through (after earlier rate-limit checks).
   - **All other `/api/*`:** if there is a valid **`Authorization: Bearer …`** matching **`API_TOKEN`**, pass through; **otherwise** if there is **no session**, return **`401`** JSON **`Unauthorized`** with **`requestId`**; if session exists, pass through.
   - **Non-API routes:** without session, redirect to **`/login`**; admin paths additionally check role.

**Files involved:** `middleware.ts` (primary gate for `/api/health`), `auth.ts` (exports `auth`), `lib/auth.ts` (NextAuth config — credentials, callbacks; not altered by this plan).

## Root Cause

**`/api/health` is not on the allowlist** in `middleware.ts`. It is treated like any other **`/api/*`** route: it requires either a **logged-in session** or **`Bearer` + `API_TOKEN`**. Monitoring requests have neither, so the middleware returns **`Unauthorized`** and never reaches a route handler.

Because **no** `app/api/health/route.ts` exists, even a hypothetical bypass would still need a **route** to return **200** and JSON; today the blocker for monitors is **middleware**; after bypass, Next would respond **404** until a handler is added.

## Minimal Safe Solution

Two small, scoped changes (conceptually):

1. **Middleware:** Before the generic **`/api/*`** session/Bearer check, add a branch for **`pathname === '/api/health'`** (exact match only) that returns **`NextResponse.next()`**, leaving **all other paths and rules unchanged**.
2. **New route handler:** Add **`app/api/health/route.ts`** exporting **`GET`** that returns **HTTP 200** and minimal JSON, e.g. `{ "status": "ok", "service": "mylercrm", "timestamp": "<ISO8601>" }`, **without** importing session/auth checks (keep the handler trivial — no DB, no secrets).

This does **not** change NextAuth config, login, roles, global middleware strategy, or “open all APIs”; it only **whitelists one path** and **implements** that path.

## Files That May Need Changes

| File | Why |
|------|-----|
| **`middleware.ts`** | Today this is the **only** layer returning **`Unauthorized`** for unauthenticated **`/api/health`**. One **early, exact-path** allow for **`/api/health`** is the minimal exclusion. |
| **`app/api/health/route.ts`** (new) | Required so **`GET /api/health`** returns **200** and the agreed JSON body after middleware allows the request through. |

No changes to `lib/auth.ts`, `auth.ts`, individual API routes, Prisma, or UI are required for this goal.

## Files That Must Not Be Changed

- **`lib/auth.ts`**, **`auth.ts`** — global auth behavior, providers, callbacks.
- **`app/api/auth/[...nextauth]/route.ts`** — login/session endpoints.
- **Existing `app/api/**/route.ts`** — business and permission logic; do not weaken checks “for convenience.”
- **Database schema, Prisma, env secrets** — not needed for a liveness-style health response.
- **Deployment / hosting config** — only touch if a platform explicitly blocks the path outside the app; current evidence points to **in-app middleware**, not hosting.

## Implementation Plan

1. In **`middleware.ts`**, after the existing **`/api/auth/`** handling (or alongside other explicit public API exceptions), insert: if **`path === '/api/health'`**, **`return NextResponse.next()`** — **exact path**, not `startsWith`, so **`/api/health/foo`** stays protected.
2. Create **`app/api/health/route.ts`** with a **`GET`** handler using **`NextResponse.json(..., { status: 200 })`** and a stable **`service`** string (e.g. from a local constant matching the product name).
3. Run **`GET /api/health`** locally **without** cookies and **without** `Authorization` — expect **200** and JSON.
4. Deploy and point Uptime Kuma at **`GET https://mylercrm.neetrino.app/api/health`**; confirm **200** and that a protected **`/api/*`** route still returns **401** without session.

**Do not implement** until explicitly approved (per project workflow).

## Acceptance Criteria

- **`GET /api/health`** returns **HTTP 200** without login.
- Response is **simple JSON** (e.g. `status`, `service`, `timestamp`).
- **Protected pages** remain protected (unauthenticated users still redirected to login where applicable).
- **Protected API routes** remain protected (no broad `/api` bypass).
- **Login/logout** behavior unchanged.
- Uptime Kuma can treat **200–299** as UP for this URL.

## Test Plan

**Local**

- `curl -i http://localhost:<port>/api/health` — no `-b`, no `-H Authorization`; expect **200** and JSON.
- `curl -i http://localhost:<port>/api/districts` (or another known protected GET) — expect **401** without auth (same as today).

**Production**

- Same **`curl`** against **`https://mylercrm.neetrino.app/api/health`**.
- Optionally verify **`/login`** and one dashboard URL still behave as before.

## Risks

| Risk | Mitigation |
|------|------------|
| Accidentally exposing more than one endpoint | Use **`path === '/api/health'`** only; avoid `startsWith('/api/health')` unless subpaths are explicitly required (they are not). |
| Health endpoint used to probe stack versions | Return **minimal** JSON; no dependency versions or internal paths. |
| DDoS via public GET | Same as any public URL; optional future **rate limit** key for `/api/health` only if abuse appears — not required for initial scope. |
| Information leak via `timestamp` | ISO time is standard for health checks; acceptable for monitoring. |

---

**Analysis summary:** Next.js App Router; **`/api/health`** has **no** route file today; **blocker** is **`middleware.ts`** (401 for unauthenticated `/api/*`). **Minimal fix:** exact-path bypass in **`middleware.ts`** + new **`app/api/health/route.ts`**.
