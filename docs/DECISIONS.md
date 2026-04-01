# Կայացված որոշումներ (ADR)

| Ամսաթիվ | Թեմա | Որոշում | Հղում |
|---------|------|---------|-------|
| 2026-04-01 | Նախագծի չափ | **B** (միջին) — CRM, բազմաթիվ մոդուլներ, Next API | `00-core.mdc` |
| 2026-04-01 | Package manager | **npm** — `package-lock.json`; այս repo-ում pnpm չի օգտագործվում | `02-TECH_STACK.md` |
| 2026-04-01 | Export style | Նոր կոդ. **named export** (`components/`, `lib/`, `services/`). **Default export** միայն Next.js-ի պահանջով. `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `middleware.ts`, `not-found.tsx` | — |
| 2026-04-01 | Inline styles | Ստատիկ UI — Tailwind դասեր. **Բացառություն.** դինամիկ `%` լայնություն (օր. progress bar) — `style={{ width: \`\${n}%\` }}` | `FinancialSummary` |
| 2026-04-01 | Inline styles | **Բացառություն.** `Snowfall` — յուրաքանչյուր փաթիլի պատահական պարամետրեր (CSS փոփոխականներ, animation) | `components/login/Snowfall.tsx` |
| 2026-04-01 | Գաղտնաբառերի հեշ | **bcrypt** (`lib/authorize.ts`, bcryptjs)։ **argon2** — միայն առանձին միգրացիան/ADR-ով, առկա հեշերը չջարդել | `docs/SECURITY.md` |
| 2026-04-01 | Սեկրետների պտույտ | `API_TOKEN` / `NEXTAUTH_SECRET` — ձեռքով env թարմացում, deploy; `NEXTAUTH_SECRET` փոխելիս բոլոր սեսիաները անվավեր են | `docs/SECURITY.md` |
| | | | |

Նոր որոշումների համար կաղապար. `reference/templates/ADR_TEMPLATE.md`։
