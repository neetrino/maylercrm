# Նախագծի տեխնոլոգիական քարտ

**Նախագիծ.** Meluvis CRM (Mayler workspace) — անշարժ գույքի CRM  
**Չափ.** B (միջին)  
**Ամսաթիվ.** 2026-04-01  
**Ստատուս.** հաստատված (ընթացիկ կոդի հիման վրա)

---

## 1. Հիմք

| Պարամետր | Որոշում |
|----------|---------|
| Չափ | **B** — բազմաթիվ ֆիչեր (CRM, dashboard, արտաքին API) |
| Ճարտարապետություն | Փաստացի. պարզ (app/, components/, lib/) · Նպատակային. feature-based |
| Package manager | npm (pnpm-ին անցումը՝ քննարկելի) |
| Node.js | 18+ |
| TypeScript | 5.x, strict |
| Git | feature branches, Conventional Commits (commitlint) |

---

## 2–3. Frontend / Backend

| Պարամետր | Որոշում |
|----------|---------|
| Next.js | 16.x App Router |
| Styling | Tailwind CSS 3.x |
| Validation | Zod |
| Backend | Next.js API Routes |
| Auth | NextAuth.js v5 beta |

---

## 4. Բազա

| Պարամետր | Որոշում |
|----------|---------|
| ՍՈՒԲԴ | PostgreSQL (Neon) |
| ORM | Prisma 5.x |

---

## 5. Auth

| Պարամետր | Որոշում |
|----------|---------|
| Լուծում | NextAuth.js |
| Դերեր | Admin, Sales (ըստ սխեմայի) |

---

## 6. Պահոց

| Պարամետր | Որոշում |
|----------|---------|
| Ֆայլեր | Cloudflare R2 (S3 API) |

---

## 7. DevOps

| Պարամետր | Որոշում |
|----------|---------|
| Hosting | Vercel (նախատեսված) |
| CI | GitHub Actions — տե՛ս `docs/QUALITY_AUTOMATION_PLAN.md` |

---

## 8. Արտաքին API

Bearer `API_TOKEN` — `middleware` և արտաքին route-ներ (տե՛ս `docs/04-API.md`)։

---

## 9. Թեստեր

Փաստացի՝ vitest/playwright չկան package.json-ում; նպատակ՝ ավելացնել ըստ `QUALITY_AUTOMATION_PLAN.md`։

---

*Լրացուցիչ աղյուսակների համար.* `reference/templates/TECH_CARD_TEMPLATE.md`
