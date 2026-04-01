# Meluvis CRM

CRM для управления комплексом недвижимости: районы → здания → квартиры, сделки, dashboard, внешний REST API.

## Быстрый старт

**Требования:** Node.js 18+, PostgreSQL (Neon) или совместимый URL.

```bash
git clone <repository-url>
cd maylercrm
npm install
cp .env.example .env
# Заполните DATABASE_URL, NEXTAUTH_SECRET, API_TOKEN и при необходимости R2
npx prisma migrate dev
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

## Документация

| Назначение | Путь |
|------------|------|
| Индекс рабочих документов (архитектура, API, деплой) | [Documents/INDEX.md](./Documents/INDEX.md) |
| Правила Cursor / AI | [.cursor/rules/](./.cursor/rules/) (начните с `00-core.mdc`) |
| Техкарта и онбординг | [docs/BRIEF.md](./docs/BRIEF.md), [docs/TECH_CARD.md](./docs/TECH_CARD.md) |
| Архитектура (канон для правил) | [docs/01-ARCHITECTURE.md](./docs/01-ARCHITECTURE.md) |
| Указания для агентов | [AGENTS.md](./AGENTS.md) |

## Разработка с Cursor

1. Заполните `docs/BRIEF.md` при смене ТЗ.
2. В чате можно запросить: прочитать `docs/BRIEF.md` и продолжить по `21-project-onboarding.mdc` (фаза 1 — размер, фаза 2 — TECH_CARD).
3. Секреты только в `.env` / `.env.local`; в репозитории — [`.env.example`](./.env.example) без реальных ключей.
4. Автоматизация качества: [docs/QUALITY_AUTOMATION_PLAN.md](./docs/QUALITY_AUTOMATION_PLAN.md).

## Технологии

Next.js (App Router), React, TypeScript, Tailwind CSS, Prisma, PostgreSQL, NextAuth.js, Zod, Cloudflare R2 (опционально). Подробнее: [docs/02-TECH_STACK.md](./docs/02-TECH_STACK.md).

## Скрипты

```bash
npm run dev          # Dev-сервер
npm run build        # Production-сборка
npm run lint         # ESLint
npm run db:studio    # Prisma Studio
```

## Роли

- **Admin** — полный доступ, CRUD.
- **Sales** — просмотр и редактирование квартир.

## Лицензия

См. [LICENSE](./LICENSE).

---

**Обновлено:** 2026-04-01
