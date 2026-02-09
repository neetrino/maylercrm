# Миграция с Vercel Blob на Cloudflare R2

## Что нужно для миграции

### 1. Данные от Cloudflare

- **Cloudflare аккаунт** — зайти на [dash.cloudflare.com](https://dash.cloudflare.com).
- **R2 bucket** — R2 → Create bucket (имя, например `meluvis-files`).
- **R2 API Token** — R2 → Manage R2 API Tokens → Create API token (Object Read & Write). Получите:
  - **Access Key ID**
  - **Secret Access Key**
- **Account ID** — в правой колонке Dashboard или в URL страницы.

### 2. Публичный доступ к файлам

R2 по умолчанию не раздаёт объекты по HTTP. Нужен один из вариантов:

- **Custom domain** (рекомендуется): в настройках бакета → Public access → Connect domain (например `files.meluvis.com`). Тогда публичный URL файла: `https://files.meluvis.com/apartments/...`
- **R2.dev subdomain**: включить в настройках бакета Public access → R2.dev subdomain. URL будет вида `https://pub-xxx.r2.dev/...`

### 3. Переменные окружения

Добавить в `.env.local` и в Vercel (Environment Variables). Пример для бакета `meluviscrm`:

```env
R2_ACCOUNT_ID="d37de990b96eb743e6532942f0563953"
R2_ACCESS_KEY_ID="ваш_access_key_id"
R2_SECRET_ACCESS_KEY="ваш_secret_access_key"
R2_BUCKET_NAME="meluviscrm"
# Включите Public access у бакета в R2 → настройки бакета → получите URL вида https://pub-xxxx.r2.dev
R2_PUBLIC_URL="https://pub-xxxx.r2.dev"
```

**Важно:** после включения Public access для бакета подставьте реальный `R2_PUBLIC_URL` (его покажет Cloudflare).

### 4. Зависимости

- Удалить: `@vercel/blob`
- Установить: `@aws-sdk/client-s3` (R2 совместим с S3 API)

### 5. Изменения в коде

- **Загрузка:** `app/api/apartments/[id]/attachments/route.ts` — заменить `put()` из `@vercel/blob` на `PutObject` из AWS SDK, endpoint `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`, формировать `fileUrl` как `R2_PUBLIC_URL + '/' + key`.
- **Удаление:** `app/api/apartments/[id]/attachments/[attachmentId]/route.ts` — заменить `del(url)` на `DeleteObject` по ключу. Ключ можно извлекать из `fileUrl` (всё после базового URL) или хранить в БД.
- **next.config.js:** в `images.domains` заменить хост Vercel Blob на хост из `R2_PUBLIC_URL` (если используете Next.js Image для картинок из хранилища).
- **Ссылки на логотип:** в `app/login/page.tsx` и `app/(dashboard)/layout.tsx` обновить URL логотипа, если переносите его в R2.

### 6. Миграция существующих файлов (опционально)

Если уже есть файлы в Vercel Blob:

- Скрипт: скачать каждый файл по старому URL и загрузить в R2 с тем же ключом (путь), обновить в БД `fileUrl` на новый базовый URL.
- Либо оставить старые URL в БД и только новые файлы писать в R2 (два хранилища временно).

---

## Итоговый чек-лист

- [ ] Создать R2 bucket в Cloudflare
- [ ] Создать R2 API token, сохранить Access Key ID и Secret Access Key
- [ ] Настроить публичный доступ (custom domain или R2.dev)
- [ ] Добавить переменные R2_* в .env.local и Vercel
- [ ] Заменить в коде @vercel/blob на @aws-sdk/client-s3 (upload/delete + формирование URL)
- [ ] Обновить next.config.js (images.domains) и URL логотипа при необходимости
- [ ] При необходимости написать скрипт миграции старых файлов из Blob в R2
