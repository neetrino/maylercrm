# 🌍 Описание окружений Meluvis CRM

## Окружения проекта

### Development (Локальная разработка)
**URL:** `http://localhost:3000`  
**База данных:** Neon Development или локальная PostgreSQL  
**Назначение:** Разработка и тестирование

### Staging (Тестовое)
**URL:** `https://meluvis-crm-staging.vercel.app`  
**База данных:** Neon Staging  
**Назначение:** Тестирование перед production, демо для клиентов

### Production (Рабочее)
**URL:** `https://meluvis-crm.vercel.app` (или кастомный домен)  
**База данных:** Neon Production  
**Назначение:** Рабочее приложение для пользователей

---

## Переменные окружения

### Обязательные переменные

#### DATABASE_URL
**Описание:** Connection string для PostgreSQL  
**Формат:** `postgresql://user:password@host/database?sslmode=require`

**Примеры:**
```env
# Development
DATABASE_URL="postgresql://neondb_owner:password@ep-orange-haze-agl6wo78-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"

# Production
DATABASE_URL="postgresql://prod_user:password@ep-prod-host.neon.tech/proddb?sslmode=require"
```

#### NEXTAUTH_URL
**Описание:** Базовый URL приложения для NextAuth  
**Примеры:**
```env
# Development
NEXTAUTH_URL="http://localhost:3000"

# Staging
NEXTAUTH_URL="https://meluvis-crm-staging.vercel.app"

# Production
NEXTAUTH_URL="https://meluvis-crm.vercel.app"
```

#### NEXTAUTH_SECRET
**Описание:** Секретный ключ для JWT (минимум 32 символа)  
**Генерация:**
```bash
openssl rand -base64 32
```

**Пример:**
```env
NEXTAUTH_SECRET="your-generated-secret-key-minimum-32-characters"
```

#### API_TOKEN
**Описание:** Токен для внешнего API (Bearer Token)  
**Использование:** Выдаётся интеграторам для доступа к API

**Пример:**
```env
API_TOKEN="meluvis_api_token_abc123xyz789"
```

### Опциональные переменные

#### Cloudflare R2 (хранение файлов)
**Переменные:** `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`  
**Описание:** Обязательны для загрузки и удаления вложений. Подробнее: `Documents/R2-MIGRATION.md`

#### NODE_ENV
**Описание:** Окружение Node.js  
**Значения:** `development`, `production`  
**По умолчанию:** Автоматически определяется Vercel

---

## Настройка окружений в Vercel

### Development (локально)

Создать файл `.env.local`:
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"
API_TOKEN="dev-token"
```

### Staging и Production

В Vercel Dashboard:
1. Project Settings → Environment Variables
2. Добавить переменные для каждого окружения:
   - **Development** - для preview deployments
   - **Preview** - для всех preview branches
   - **Production** - для main branch

---

## Тестовые данные для интеграторов

### Тестовый API Token

**Для Staging:**
```
Token: test_api_token_staging_12345
```

**Для Production:**
```
Token: (будет выдан после настройки)
```

### Тестовые данные в БД

#### Район (District)
```json
{
  "id": 1,
  "slug": "kentron",
  "name": "Kentron"
}
```

#### Здание (Building)
```json
{
  "id": 10,
  "slug": "tower-1",
  "name": "Tower 1",
  "district_id": 1,
  "district_slug": "kentron"
}
```

#### Квартира (Apartment)
```json
{
  "id": 501,
  "apartment_no": "12-05",
  "apartment_type": 2,
  "status": "available",
  "building_id": 10,
  "building_slug": "tower-1",
  "district_id": 1,
  "district_slug": "kentron"
}
```

### Тестовые пользователи

#### Admin
```
Email: admin@meluvis.local
Password: (устанавливается при создании)
Role: admin
```

#### Sales
```
Email: sales@meluvis.local
Password: (устанавливается при создании)
Role: sales
```

**Важно:** Создать тестовых пользователей в каждой среде для тестирования.

---

## Доступ к базам данных

### Neon Development
```
Connection String: (из Neon Dashboard)
```

### Neon Staging
```
Connection String: (отдельный проект в Neon)
```

### Neon Production
```
Connection String: (отдельный проект в Neon)
```

**Рекомендация:** Использовать отдельные проекты Neon для каждого окружения.

---

## API Endpoints по окружениям

### Development
```
Base URL: http://localhost:3000/api
```

### Staging
```
Base URL: https://meluvis-crm-staging.vercel.app/api
```

### Production
```
Base URL: https://meluvis-crm.vercel.app/api
```

**Примеры запросов:**
```bash
# Staging
curl https://meluvis-crm-staging.vercel.app/api/districts

# Production
curl https://meluvis-crm.vercel.app/api/districts
```

---

## Безопасность

### Правила

1. **Никогда не коммитить реальные значения**
   - Использовать `.env.example` как шаблон
   - `.env.local` в `.gitignore`

2. **Разные секреты для каждого окружения**
   - `NEXTAUTH_SECRET` должен быть разным
   - `API_TOKEN` должен быть разным

3. **Ограничение доступа**
   - Staging доступен только для тестирования
   - Production только для авторизованных пользователей

4. **Ротация токенов**
   - Периодически менять `API_TOKEN`
   - При компрометации - немедленно заменить

---

## Мониторинг

### Логи

**Vercel Dashboard:**
- Development: Локальные логи
- Staging/Production: Vercel Dashboard → Logs

### Метрики

**Vercel Analytics:**
- Производительность
- Ошибки
- Трафик

### База данных

**Neon Dashboard:**
- Использование ресурсов
- Запросы
- Бэкапы

---

## Чеклист настройки окружения

### Development
- [ ] `.env.local` создан
- [ ] `DATABASE_URL` настроен
- [ ] `NEXTAUTH_SECRET` сгенерирован
- [ ] Локальный сервер запускается
- [ ] Подключение к БД работает

### Staging
- [ ] Проект создан на Vercel
- [ ] Переменные окружения добавлены
- [ ] База данных настроена
- [ ] Деплой успешен
- [ ] Тестовые данные созданы
- [ ] API endpoints работают

### Production
- [ ] Проект создан на Vercel
- [ ] Production переменные настроены
- [ ] Production база данных настроена
- [ ] Домен настроен (если нужен)
- [ ] SSL сертификат активен
- [ ] Мониторинг настроен
- [ ] Бэкапы настроены

---

**Последнее обновление:** 2026-01-19
