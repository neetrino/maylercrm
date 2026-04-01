# Կայացված որոշումներ (ADR)

| Ամսաթիվ | Թեմա | Որոշում | Հղում |
|---------|------|---------|-------|
| 2026-04-01 | Նախագծի չափ | **B** (միջին) — CRM, բազմաթիվ մոդուլներ, Next API | `00-core.mdc` |
| 2026-04-01 | Package manager | **npm** — `package-lock.json`; այս repo-ում pnpm չի օգտագործվում | `02-TECH_STACK.md` |
| 2026-04-01 | Export style | Նոր կոդ. **named export** (`components/`, `lib/`, `services/`). **Default export** միայն Next.js-ի պահանջով. `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `middleware.ts`, `not-found.tsx` | — |
| 2026-04-01 | Inline styles | Ստատիկ UI — Tailwind դասեր. **Բացառություն.** դինամիկ `%` լայնություն (օր. progress bar) — `style={{ width: \`\${n}%\` }}` | `FinancialSummary` |
| 2026-04-01 | Inline styles | **Բացառություն.** `Snowfall` — յուրաքանչյուր փաթիլի պատահական պարամետրեր (CSS փոփոխականներ, animation) | `components/login/Snowfall.tsx` |
| | | | |

Նոր որոշումների համար կաղապար. `reference/templates/ADR_TEMPLATE.md`։
