# Նախագծի տեխզադրանք

## Նկարագրություն

**Meluvis CRM** — անշարժ գույքի համալիրի կառավարման CRM. Հիերարխիա. District → Building → Apartment; վաճառքի վիճակներ, գործարքների քարտեր, dashboard, արտաքին REST API ինտեգրատորների համար։

## Թիրախային լսարան

Ներքին օգտատերեր (Admin, Sales); արտաքին համակարգեր (API token)։

## Հիմնական ֆունկցիաներ

1. Կառուցվածքի և բնակարանների CRUD / դիտում — առաջնայնություն. բարձր  
2. Dashboard և վաճառքների վիճակագրություն — բարձր  
3. Արտաքին API (districts, buildings, apartments, status) — բարձր  
4. Ֆայլերի կցումներ (R2) — միջին  

## Stack (փաստացի)

Next.js 16, React 18, TypeScript, Tailwind, Prisma, PostgreSQL (Neon), NextAuth v5, Zod, Cloudflare R2, Vercel։

## Ինտեգրացիաներ

- [x] Auth — NextAuth  
- [x] Ֆայլեր — Cloudflare R2  
- [ ] Վճարային համակարգ — ըստ անհրաժեշտության  
- [ ] Email — Resend և այլն — ըստ անհրաժեշտության  

## Կոնտենտի լեզու

Ռուսերեն (ինտերֆեյս); i18n — ըստ ապագա պահանջի։

## Սահմանափակումներ

Տեխնիկական. արտաքին API պաշտպանված է `API_TOKEN`-ով; գաղտնիքները միայն env։

## Լրացուցիչ

Մանրամասն ինդեքս. `Documents/INDEX.md` · Cursor կանոններ. `.cursor/rules/`։
