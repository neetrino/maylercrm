# Project quality checklist (Cursor end-of-project review)

Human-readable reference (not loaded as AI rules — keeps token budget in `.cursor/rules`). For coding limits see `00-core.mdc`, `03-typescript.mdc`. Ops: `14-ops.mdc`. DB roles/limits: `06-database.mdc`.

**How to use:** At project wrap-up, walk sections **1–20** top to bottom; then **Definition of done** and **PR / release** if shipping.

---

## Main checklist

### 1. General (00-core)

- [ ] Project size tier set (A/B/C)
- [ ] No work started without tier; no banned patterns (secrets in code, `any`, force-push to protected branches)
- [ ] Major decisions documented with options when relevant

### 2. Architecture (01-architecture)

- [ ] Folder layout matches tier; `src/` is code only
- [ ] Clear layers (features, shared, core); no circular deps
- [ ] Barrel `index.ts` where it helps

### 3. Code standards (00-core + 03-typescript)

- [ ] Naming: PascalCase (components/types), camelCase (vars/fns), UPPER_SNAKE_CASE (constants), kebab-case (files/folders)
- [ ] Functions ≤ 50 lines; files ≤ 300 lines
- [ ] No magic numbers; no commented-out code; DRY

### 4. TypeScript (03-typescript)

- [ ] `strict: true`; no `any` (or documented exception)
- [ ] No unexplained `@ts-ignore`; exports for types; `unknown` over `any`; exhaustive unions; `as const`; generics where useful

### 5. React / Next.js (04-react-nextjs)

- [ ] Server Components default; `'use client'` only where needed
- [ ] Named exports; typed props; stable keys; Error boundaries; loading/error/not-found
- [ ] `next/image`, `next/link`; metadata set; `useCallback`/`useMemo` where needed

### 6. Backend / NestJS (05-backend-nestjs) — if applicable

- [ ] Thin controllers; logic in services; DI; DTOs + `class-validator`; guards; filters; Swagger

### 7. Database (06-database)

- [ ] Schema/migrations current; indexes for hot paths; no N+1; transactions; pagination; soft delete if needed
- [ ] **Roles (all projects):** `app_user` DML-only; `DATABASE_URL` → `app_user`; `DIRECT_URL` → owner (migrations); `statement_timeout`, `idle_in_transaction_session_timeout`, `lock_timeout` set
- [ ] **Size B/C:** `readonly_user` if needed; `CONNECTION LIMIT` for long-lived backends
- [ ] **Neon:** pooling; `directUrl` for migrations; Vercel integration if on Vercel

### 8. API design (07-api-design)

- [ ] RESTful routes; correct verbs/status; consistent body shape; DTO validation; Swagger; pagination; `/v1/` versioning
- [ ] **Webhooks:** HMAC-SHA256; retries with backoff; idempotency

### 9. Security (08-security)

- [ ] No secrets in repo; secrets in env/manager; `.env.example` without real values
- [ ] Passwords hashed (e.g. argon2); JWT configured; short access token; refresh in DB
- [ ] RBAC; guards; least privilege
- [ ] Input validation; no injection; XSS/CSRF/CORS handled
- [ ] Cookies: `httpOnly`, `secure`, `sameSite` appropriate
- [ ] `npm audit` — no critical unfixed; deps reasonably current

### 10. Design / Figma (09-figma-design) — if applicable

- [ ] Tokens; Tailwind aligned; components match design; responsive; a11y basics (alt, aria, keyboard, contrast); animations restrained

### 11. Testing (10-testing)

- [ ] Unit (logic); integration (API); E2E (critical paths); pyramid respected; mocks/factories; ≥70% on new logic where policy requires; tests stable

### 12. Documentation (11-documentation)

- [ ] README; `docs/` with architecture + `PROGRESS.md`; API docs; `.env.example` complete; runbooks for prod; ADRs for big decisions

### 13. Error handling (12-error-handling)

- [ ] Custom errors; global filter / boundaries; API errors consistent (e.g. RFC 7807-style); retry/backoff; graceful degradation; logs without secrets

### 14. Git (13-git-workflow)

- [ ] Branch strategy; `feature/` / `bugfix/` / `hotfix/`; Conventional Commits; PR ≤ ~400 lines; description + self-review; no secrets in commits; CHANGELOG maintained

### 15. Observability (14-ops)

- [ ] Structured logs; levels; correlation IDs; no PII in logs; metrics/alerts in prod where required

### 16. Performance (15-performance)

- [ ] Core Web Vitals targets (LCP, INP, CLS); images (`next/image`, modern formats, lazy); bundle (splitting, tree-shaking); caching (React Query, HTTP, Redis if needed); backend queries pooled and efficient

### 17. State (16-state-management)

- [ ] Server → React Query; client → Zustand (or project choice); forms → RHF; URL state; no duplicated server data in global store

### 18. CI/CD (17-cicd)

- [ ] CI: lint, format, typecheck, test, build, audit
- [ ] CD: previews, staging, prod, migrations
- [ ] Feature flags documented/killable if used; platform env + health checks

### 19. Reliability (14-ops)

- [ ] Timeouts on external calls; retry/backoff; circuit breaker for externals; graceful shutdown; health checks; fallbacks; rate limits where needed

### 20. i18n (20-i18n) — skip if single-locale

- [ ] Strings in locale files; no hardcoded UI copy; Intl for dates/numbers; pluralization; switcher; `hreflang` if SEO matters

---

## Definition of done

Verify **Main checklist** sections touched by the change. Additionally:

- [ ] `tsc` clean; ESLint 0 errors (0 warnings if policy says so); Prettier applied
- [ ] No `console.log` / debug leftovers in shipped code
- [ ] Tests green; edge cases for the change covered
- [ ] `PROGRESS.md` / API docs updated if applicable
- [ ] Code review completed (self + peer if team)

---

## PR — self-review (before open)

- [ ] Read own diff; no temp/debug code; TODOs tied to issues or removed
- [ ] Types: no stray `any`; exports; no unexplained `@ts-ignore`
- [ ] New logic tested; not flaky
- [ ] No secret hardcoding; validation and authz for new surfaces
- [ ] No new N+1 or obvious perf regressions
- [ ] Migrations/indexes if DB changed; API backward-compatible or versioned; Swagger updated

### PR description template

```markdown
## Type
- [ ] Feature / Bugfix / Refactor / Docs / Performance / Test

## Summary
What changed and why.

## Links
- Closes #…

## How to test
1. …
2. Expected: …

## Screenshots (UI)
| Before | After |
|--------|-------|

## Checklist
- [ ] Self-review done
- [ ] Tests/docs updated
- [ ] CI green
```

### Reviewer focus

Functionality (solves ticket, edge cases); readability; fit with architecture (SRP, DRY); tests; security (validation, authz); performance (N+1, obvious issues).

---

## Release

**Pre-release**

- [ ] Target PRs merged; version + CHANGELOG updated
- [ ] Unit / integration / E2E pass; staging verified
- [ ] DB migrations tested; backup if needed
- [ ] Env vars and monitoring ready

**Deploy**

- [ ] Deploy executed; health checks OK; smoke tests; metrics normal; no error spikes in logs

**Post-deploy / rollback**

- [ ] Stakeholders notified; tickets closed
- [ ] If rollback: confirm issue; approve rollback; DB rollback if needed; revert deploy; verify health; incident note

---

## New project bootstrap (optional)

- [ ] Repo, `.gitignore`, README; TypeScript strict; ESLint + Prettier; path aliases
- [ ] Tier A/B/C; folder layout; `docs/` + `PROGRESS.md`
- [ ] Quality automation per `17-cicd.mdc` (husky, lint-staged, commitlint, CI workflow from `docs/reference/workflows/ci-quality.yml.example`)
- [ ] CI/CD or platform auto-deploy; `.env.example`
- [ ] Prisma/DB + `app_user` per `06-database`; Neon/R2/etc. if used
- [ ] Branch protection + secret scanning where applicable
- [ ] No secrets in code; CORS; Helmet on backend if applicable

---

**Version:** 3.0 · **Date:** 2026-04-02
