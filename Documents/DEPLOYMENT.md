# 🚀 Инструкции по деплою Meluvis CRM

## Платформа

**Vercel** - основная платформа для деплоя Next.js приложения.

---

## Предварительные требования

1. Аккаунт на [Vercel](https://vercel.com)
2. Аккаунт на [Neon](https://neon.tech) для PostgreSQL
3. Репозиторий на GitHub/GitLab/Bitbucket
4. Локально установленный Node.js 18+

---

## Подготовка к деплою

### 1. Настройка базы данных (Neon)

1. Создать проект на [Neon](https://neon.tech)
2. Скопировать connection string
3. Сохранить в переменные окружения (см. ниже)

### 2. Настройка переменных окружения

Создать файл `.env.local` (не коммитить!):
```env
# База данных
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# API
API_TOKEN="your-api-token-for-external-systems"

# Cloudflare R2 (хранение файлов)
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="meluviscrm"
R2_PUBLIC_URL="https://pub-xxxx.r2.dev"
```

**Важно:** Использовать `.env.example` как шаблон, но не коммитить реальные значения.

### 3. Миграции базы данных

Перед деплоем выполнить миграции локально или через Neon:

```bash
# Локально
npx prisma migrate deploy

# Или через Neon SQL Editor
# Выполнить SQL из prisma/migrations/
```

---

## Деплой на Vercel

### Способ 1: Через Vercel Dashboard (рекомендуется)

1. **Подключить репозиторий**
   - Зайти на [vercel.com](https://vercel.com)
   - Нажать "New Project"
   - Выбрать репозиторий из GitHub/GitLab

2. **Настроить проект**
   - Framework Preset: **Next.js**
   - Root Directory: `./` (если проект в корне)
   - Build Command: `npm run build` (или автоматически)
   - Output Directory: `.next` (автоматически)

3. **Добавить переменные окружения**
   В настройках проекта → Environment Variables:
   ```
   DATABASE_URL = postgresql://...
   NEXTAUTH_URL = https://your-app.vercel.app
   NEXTAUTH_SECRET = your-secret
   API_TOKEN = your-api-token
   ```

4. **Деплой**
   - Нажать "Deploy"
   - Дождаться завершения
   - Проверить URL приложения

### Способ 2: Через Vercel CLI

```bash
# Установить Vercel CLI
npm i -g vercel

# Логин
vercel login

# Деплой
vercel

# Production деплой
vercel --prod
```

---

## Настройка окружений

### Development (локально)

```env
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://... (локальная или Neon dev)
```

### Staging

```env
NEXTAUTH_URL=https://meluvis-crm-staging.vercel.app
DATABASE_URL=postgresql://... (Neon staging)
```

### Production

```env
NEXTAUTH_URL=https://meluvis-crm.vercel.app
DATABASE_URL=postgresql://... (Neon production)
```

**Настройка в Vercel:**
- Project Settings → Environments
- Добавить переменные для каждого окружения

---

## Миграции базы данных на Vercel

### Вариант 1: Post-deploy hook

Добавить в `package.json`:
```json
{
  "scripts": {
    "postbuild": "prisma generate",
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

### Вариант 2: Отдельный скрипт

Создать `scripts/migrate.sh`:
```bash
#!/bin/bash
npx prisma migrate deploy
```

Запускать вручную после деплоя или через GitHub Actions.

### Вариант 3: Через Neon Dashboard

Выполнить миграции напрямую через Neon SQL Editor.

---

## Настройка домена (опционально)

1. В Vercel Project Settings → Domains
2. Добавить кастомный домен
3. Следовать инструкциям по настройке DNS

---

## Мониторинг и логи

### Vercel Dashboard

- **Deployments** - история деплоев
- **Analytics** - метрики производительности
- **Logs** - логи приложения

### Проверка после деплоя

1. Открыть URL приложения
2. Проверить авторизацию
3. Проверить API endpoints
4. Проверить работу с БД

---

## Откат к предыдущей версии

В Vercel Dashboard:
1. Deployments → выбрать предыдущий deployment
2. Нажать "Promote to Production"

---

## Автоматический деплой

### Настройка

Vercel автоматически деплоит при:
- Push в `main` branch → Production
- Push в другие branches → Preview

### GitHub Actions (опционально)

Создать `.github/workflows/deploy.yml`:
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## Troubleshooting

### Ошибка подключения к БД

- Проверить `DATABASE_URL` в Environment Variables
- Проверить, что БД доступна извне (Neon настройки)
- Проверить SSL режим (`?sslmode=require`)

### Ошибка миграций

- Выполнить миграции вручную через Neon
- Проверить, что Prisma Client сгенерирован (`prisma generate`)

### Ошибка авторизации

- Проверить `NEXTAUTH_URL` (должен совпадать с доменом)
- Проверить `NEXTAUTH_SECRET`

### Build ошибки

- Проверить логи в Vercel Dashboard
- Проверить, что все зависимости в `package.json`
- Проверить TypeScript ошибки локально

---

## Чеклист перед production деплоем

- [ ] Все переменные окружения настроены
- [ ] Миграции БД выполнены
- [ ] Тесты проходят
- [ ] Линтер не показывает ошибок
- [ ] Проверено на staging
- [ ] API endpoints работают
- [ ] Авторизация работает
- [ ] Документация обновлена

---

## Бэкапы

### База данных

Neon автоматически делает бэкапы, но рекомендуется:
- Настроить регулярные экспорты
- Хранить бэкапы в безопасном месте

### Код

- Все изменения в Git
- Теги для версий
- Регулярные коммиты

---

## Производительность

### Оптимизации

- Использовать Server Components
- Оптимизировать изображения (Next.js Image)
- Настроить кеширование
- Использовать CDN (Vercel автоматически)

### Мониторинг

- Vercel Analytics
- Проверять метрики в Dashboard
- Настроить алерты при ошибках

---

**Последнее обновление:** 2026-01-19
