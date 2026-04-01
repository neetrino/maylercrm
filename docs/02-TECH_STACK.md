# Տեխնոլոգիական stack (փաստացի)

> Թարմացրու՛ `package.json`-ի փոփոխություններից հետո։

| Շերտ | Տեխնոլոգիա | Տարբերակ (ըստ package.json) |
|------|------------|------------------------------|
| Runtime | Node.js | 18+ (պահանջ) |
| Framework | Next.js (App Router) | ^16.1.6 |
| UI | React | ^18.3.1 |
| Styling | Tailwind CSS | ^3.4.4 |
| Բազա | PostgreSQL (Neon) | — |
| ORM | Prisma | ^5.20.0 |
| Auth | NextAuth.js | ^5.0.0-beta.25 |
| Validation | Zod | ^3.23.8 |
| Storage | Cloudflare R2 (@aws-sdk/client-s3) | ^3.985.0 |
| Charts | Recharts | ^3.6.0 |
| Unit tests | Vitest | ^4.x (`npm run test`) |

**Package manager (կանոնական այս repo-ում).** **npm** — `package-lock.json`։ Տեղադրում. `npm install`։ Այլ գործիքներ (pnpm) չեն օգտագործվում — տե՛ս `DECISIONS.md`։
