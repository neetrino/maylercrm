# Անվտանգություն (Security)

Ամփոփ նկարագրություն՝ [reference/Check/Security/](../reference/Check/Security/), [.cursor/rules/08-security.mdc](../.cursor/rules/08-security.mdc) և ներքին API-ի մոդելի համար։

---

## Ինչն է հանրային, ինչը՝ ոչ

| Մուտք | Նկարագրություն |
|-------|----------------|
| **NextAuth session** (cookie) | Ներքին CRM UI և մեծամասնությունը `/api/*` մարշուտների (middleware-ը պահանջում է սեսիա, եթե Bearer չկա)։ |
| **Bearer `API_TOKEN`** | Արտաքին ինտեգրացիա՝ `Authorization: Bearer <API_TOKEN>`։ Middleware-ը թողնում է մուտքը, վավերացումը՝ route-ում։ |
| **Landing token** | Հանրային `/l/[token]` և `GET /api/landing/[token]`՝ միայն գաղտնի token-ով հղումով (հաշվի մեջ չի մտնում որպես հանրային REST կոնտրակտ)։ |

**Ներքին ադմին API** (օր. `GET /api/admin/apartments/export`) — միայն **ADMIN** դերի session cookie-ով, Bearer-ով բավարար չէ։

---

## RBAC / API մատրիցա (աուդիտ)

| Խումբ | Մուտք | Նշումներ |
|-------|-------|----------|
| `GET /api/districts`, `GET /api/districts/[id]/buildings` | Session **կամ** Bearer | Bearer path-ը հաճախ JSON `{ data: ... }` ձևաչափով։ |
| `GET /api/buildings`, `GET /api/buildings/[id]`, … | Հիմնականում session | Կարդալը՝ ցանկացած մուտք գործած օգտատեր։ |
| `POST`/`PUT`/`DELETE` շենքեր, թաղամասեր, կվարտիրներ | Session + **ADMIN** որտեղ նշված է route-ում | |
| `GET /api/dashboard/*` | Session | |
| `GET /api/external/full`, `GET /api/external/apartments/[id]` | Միայն Bearer | |
| `GET /api/buildings/[id]/apartments`, slug-մարշուտներ | Միայն Bearer | |
| `PUT /api/apartments/[id]/status` | Session **կամ** Bearer | |
| `GET /api/landing/[token]` | Անանուն (token URL-ում) | Brute-force-ի դեմ՝ rate limit + թокенի կարգավորում։ |
| `GET /api/admin/apartments/export` | Session + **ADMIN** | |

Փոփոխություններից հետո թարմացրու այս աղյուսակը։

---

## Rate limiting

- **Middleware** (`middleware.ts`)՝ սահմանափակում է `IP` + տեսակի հիման վրա.
  - `/api/external/*` — `external`
  - `/api/landing/*` — `landing`
  - `/api/auth/*` — `auth` (credential stuffing-ի դեմ)
- **Upstash Redis** (ընտրովի). Env՝ `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` ([`.env.example`](../.env.example))։ Եթե չկան՝ օգտագործվում է **in-memory** fallback (serverless-ում մեկ instance-ի սահմաններում)։
- Սահմանները՝ `lib/security.constants.ts`։

---

## Սեկրետների պտույտ (runbook)

| Սեկրետ | Գործողություն |
|--------|----------------|
| `API_TOKEN` | Գեներացնել նոր արժեք, թարմացնել env (Vercel/հոսթ), վերագործարկել, հին token-ը անվավերացնել։ |
| `NEXTAUTH_SECRET` | Նոր secret, թարմացնել env, deploy — **բոլոր սեսիաները կվերագրանցվեն**։ |

Մանրամասներ՝ [docs/DECISIONS.md](./DECISIONS.md)։

---

## Ձեռքով ինֆրա (չի կոդում)

Ստուգել production-ում.

- **Cloudflare / CDN** — HTTPS, HSTS, WAF managed rules, DDoS ([reference/Check/Security/0 Security List.md](../reference/Check/Security/0%20Security%20List.md))։
- **Neon** — TLS, connection limits, `app_user` նվազագույն իրավունքներով, backup + վերականգնման թեստ։
- **Vercel** — env փոփոխականները սահմանված, production ≠ preview։

---

## Լոգեր և սխալներ

- API սխալները՝ **pino** (`lib/logger.ts`), `x-request-id` request/response-ում։
- Production-ում հաճախորդին չի վերադարձվում ներքին `error.message` կամ Zod «մաքուր» details ([`lib/apiErrorResponse.ts`](../lib/apiErrorResponse.ts))։

---

## Հղումներ

- API նկարագրություն՝ [docs/04-API.md](./04-API.md)
- Որոշումներ՝ [docs/DECISIONS.md](./DECISIONS.md)
- Չեկլիստ՝ [reference/Check/Security/](../reference/Check/Security/)
