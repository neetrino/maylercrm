# 🚀 Быстрая инструкция: Деплой на Vercel

## ❓ Часто задаваемые вопросы

### Вопрос 1: Нужно ли добавлять NEXTAUTH_URL сейчас?

**Ответ:** Да, лучше добавить сейчас с примерным значением.

**Что делать:**
1. Добавьте переменную `NEXTAUTH_URL` с примерным значением: `https://meluviscrm.vercel.app`
2. После первого деплоя Vercel покажет реальный URL (например: `meluviscrm-abc123.vercel.app`)
3. Обновите значение на реальный URL в настройках проекта
4. Сделайте новый деплой (или подождите автоматического)

**Альтернатива:** Можно добавить после первого деплоя, но тогда авторизация не будет работать до обновления.

### Вопрос 2: Использую ту же БД, что локально. Нужно что-то делать?

**Ответ:** Нет, ничего дополнительного делать не нужно! ✅

**Почему:**
- Миграции уже выполнены - Prisma пропустит их при проверке
- База уже заполнена - данные останутся на месте
- Скрипт `vercel-build` безопасен - выполнит только новые миграции, если появятся

**Что произойдет:**
- При деплое Prisma проверит состояние БД
- Увидит, что миграции уже применены
- Пропустит их и продолжит сборку
- Ваши данные останутся нетронутыми

---

## Что такое NEXTAUTH_URL?

`NEXTAUTH_URL` - это базовый URL вашего приложения, который NextAuth.js использует для:
- Генерации правильных callback URL для авторизации
- Создания ссылок для редиректов после входа/выхода
- Валидации запросов (защита от CSRF атак)

**Важно:** URL должен точно совпадать с доменом, где работает приложение!

---

## 📋 Пошаговая инструкция деплоя на Vercel

### Шаг 1: Подготовка (уже готово ✅)
- ✅ Репозиторий на GitHub: `https://github.com/neetrino-com/meluviscrm.git`
- ✅ `.env` в `.gitignore` (секреты не попадут в git)

### Шаг 2: Создание проекта на Vercel

1. **Зайдите на [vercel.com](https://vercel.com)**
   - Войдите через GitHub аккаунт

2. **Создайте новый проект**
   - Нажмите "Add New..." → "Project"
   - Выберите репозиторий `neetrino-com/meluviscrm`
   - Нажмите "Import"

3. **Настройте проект**
   - **Framework Preset:** Next.js (определится автоматически)
   - **Root Directory:** `./` (оставьте по умолчанию)
   - **Build Command:** `npm run build` (автоматически)
   - **Output Directory:** `.next` (автоматически)
   - **Install Command:** `npm install` (автоматически)

### Шаг 3: Настройка переменных окружения

**⚠️ ВАЖНО:** Не нажимайте "Deploy" пока не добавите все переменные!

В разделе **"Environment Variables"** добавьте:

#### 1. DATABASE_URL
```
Name: DATABASE_URL
Value: postgresql://neondb_owner:npg_QIo5jxR1TyUn@ep-orange-haze-agl6wo78-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
Environment: Production, Preview, Development (все три!)
```

#### 2. NEXTAUTH_URL
```
Name: NEXTAUTH_URL
Value: https://meluviscrm.vercel.app
(или примерный URL - можно обновить после первого деплоя)
Environment: Production, Preview, Development
```

**📌 Варианты действий:**

**Вариант 1 (рекомендуется):** Добавить с примерным значением сейчас
- Используйте примерный URL: `https://meluviscrm.vercel.app`
- После первого деплоя Vercel покажет реальный URL (например: `meluviscrm-abc123.vercel.app`)
- Обновите значение на реальный URL в настройках проекта

**Вариант 2:** Добавить после первого деплоя
- Можно не добавлять сейчас
- После деплоя скопируйте реальный URL из Vercel
- Добавьте переменную с правильным URL
- Сделайте новый деплой

**⚠️ Важно:** 
- URL должен точно совпадать с доменом Vercel
- Используйте `https://` (не `http://`)
- После изменения URL нужно сделать новый деплой

#### 3. NEXTAUTH_SECRET
```
Name: NEXTAUTH_SECRET
Value: 8Iavp8kCMxOHWc8eQAg1g+01putYD80hmG81U6A3bAM=
Environment: Production, Preview, Development
```

#### 4. API_TOKEN
```
Name: API_TOKEN
Value: 026bf0c4fdbe8af4c3a3a14485c02eb160833b87758323e60fe2ac701a6f9852
Environment: Production, Preview, Development
```

#### 5. NEXT_PUBLIC_APP_URL (для коротких ссылок на лендинги)
```
Name: NEXT_PUBLIC_APP_URL
Value: https://maylercrm.neetrino.com
Environment: Production (и Preview, если нужны короткие ссылки и там)
```
Без этой переменной ссылка «Лендинг» в CRM будет вести на длинный URL деплоя (`maylercrm-xxx.vercel.app`). С ней ссылки будут вида `https://maylercrm.neetrino.com/l/TOKEN`.

**Как добавить:**
1. Нажмите "Add" для каждой переменной
2. Выберите все три окружения (Production, Preview, Development)
3. Нажмите "Save"

### Шаг 4: Настройка миграций базы данных

**✅ У вас уже настроено!** Скрипт `vercel-build` уже добавлен в `package.json`.

**📌 Если используете ту же БД, что и локально:**

**Хорошие новости:** Ничего дополнительного делать не нужно!

1. **Миграции уже выполнены** - Prisma проверит состояние БД и пропустит уже примененные миграции
2. **База уже заполнена** - данные останутся на месте
3. **Скрипт `vercel-build` безопасен** - он выполнит только новые миграции, если они появятся

**Что произойдет при деплое:**
- `prisma generate` - сгенерирует Prisma Client
- `prisma migrate deploy` - проверит миграции (пропустит уже примененные)
- `next build` - соберет приложение

**⚠️ Если миграции еще не выполнены:**
- Выполните их локально: `npm run db:migrate`
- Или через Neon SQL Editor вручную

### Шаг 5: Деплой

1. **Нажмите "Deploy"**
2. Дождитесь завершения сборки (2-5 минут)
3. После успешного деплоя Vercel покажет URL вашего приложения

### Шаг 6: Обновление NEXTAUTH_URL

После первого деплоя:

1. Скопируйте URL из Vercel (например: `https://meluviscrm-abc123.vercel.app`)
2. Зайдите в Project Settings → Environment Variables
3. Найдите `NEXTAUTH_URL`
4. Обновите значение на ваш реальный URL
5. Сделайте новый деплой (или подождите автоматического)

### Шаг 7: Проверка

1. Откройте URL приложения
2. Проверьте страницу входа `/login`
3. Попробуйте войти
4. Проверьте работу API endpoints

---

## 🔄 Автоматический деплой

Vercel автоматически деплоит при:
- **Push в `main` branch** → Production деплой
- **Push в другие branches** → Preview деплой

---

## 🌍 Настройка для разных окружений

### Development (локально)
```env
NEXTAUTH_URL="http://localhost:3000"
```

### Preview (Vercel Preview)
```env
NEXTAUTH_URL="https://meluviscrm-git-branch-username.vercel.app"
```
Vercel автоматически подставит правильный URL для preview!

### Production (Vercel Production)
```env
NEXTAUTH_URL="https://meluviscrm.vercel.app"
```
Или ваш кастомный домен, если настроен.

---

## ⚠️ Важные моменты

1. **NEXTAUTH_URL должен точно совпадать с доменом**
   - Если URL: `https://meluviscrm.vercel.app`
   - То `NEXTAUTH_URL` должен быть: `https://meluviscrm.vercel.app`
   - Не используйте `http://` для production!

2. **Разные секреты для разных окружений**
   - Production должен иметь свой `NEXTAUTH_SECRET`
   - Preview может использовать тот же или другой

3. **База данных**
   - Убедитесь, что Neon БД доступна извне
   - Проверьте, что connection string правильный

---

## 🐛 Troubleshooting

### Ошибка: "Invalid NEXTAUTH_URL"
- Проверьте, что `NEXTAUTH_URL` точно совпадает с доменом
- Убедитесь, что используется `https://` для production

### Ошибка: "Database connection failed"
- Проверьте `DATABASE_URL` в Environment Variables
- Убедитесь, что БД доступна извне (Neon настройки)

### Ошибка: "Migration failed"
- Выполните миграции вручную через Neon SQL Editor
- Или добавьте `vercel-build` скрипт в `package.json`

### Авторизация не работает
- Проверьте `NEXTAUTH_SECRET` (должен быть минимум 32 символа)
- Проверьте `NEXTAUTH_URL` (должен совпадать с доменом)
- Очистите cookies в браузере и попробуйте снова

### При открытии ссылки на лендинг просит верификацию Vercel
Лендинги (`/l/TOKEN`) должны открываться без входа. Если Vercel показывает свою страницу верификации:

1. **Project Settings → Deployment Protection**
2. Для **Production** выберите **"Only Preview Deployments"** (защищать только превью), чтобы продакшен и кастомный домен были без запроса входа.
3. Либо отключите **Vercel Authentication** для продакшена.
4. Ссылки на лендинг лучше давать с **кастомным доменом** (`https://maylercrm.neetrino.com/l/...`) — на нём защита превью не действует.

---

## 📝 Чеклист перед деплоем

- [ ] Все переменные окружения добавлены в Vercel
- [ ] `NEXTAUTH_URL` будет обновлен после первого деплоя
- [ ] База данных настроена и доступна
- [ ] Миграции выполнены (или настроен автоматический запуск)
- [ ] Код закоммичен и запушен в GitHub
- [ ] `.env` не попадает в git (проверено)

---

**Готово! После выполнения этих шагов ваш проект будет работать на Vercel.**
