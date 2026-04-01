# Ճարտարապետություն

## Ակնարկ

**Meluvis CRM** — fullstack Next.js (App Router) հավելված PostgreSQL + Prisma + NextAuth, API routes արտաքին ինտեգրացիայի համար, Cloudflare R2 ֆայլերի համար։

**Նախագծի չափ.** B — տե՛ս `DECISIONS.md` և `.cursor/rules/00-core.mdc`։

## Փաստացի կառուցվածք

- `app/` — էջեր, layout-ներ, `app/api/*` REST
- `components/` — UI ըստ տիրույթի (apartments, dashboard, …)
- `lib/` — Prisma client, auth, R2, validations
- `prisma/` — սխեմա և միգրացիաներ

**Նպատակային (B).** ժամանակի ընթացքում հնարավոր է `src/features/<feature>/` — առանձին համաձայնեցումից հետո։

## Մանրամասն նկարագրություն (ռուսերեն, աշխատանքային)

[Documents/ARCHITECTURE.md](../Documents/ARCHITECTURE.md) — մանրամասն բաժիններ; որոշ ծառայություններ նկարագրված են `src/` կառուցվածքով, մինչդեռ repo-ն օգտագործում է root `app/` — **հիմնական ճշմարտությունը՝ repo tree-ն** (`docs/03-STRUCTURE.md`)։

## Կապված փաստաթղթեր

- `docs/02-TECH_STACK.md`
- `docs/04-API.md`
- `docs/05-DATABASE.md`
