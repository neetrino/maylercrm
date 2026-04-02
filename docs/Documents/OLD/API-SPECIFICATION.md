# 🔌 API Спецификация Meluvis CRM

**Версия:** 1.0  
**Базовый URL:** `https://your-domain.vercel.app/api`  
**Авторизация:** Bearer Token

---

## Общая информация

### Формат запросов
- Все запросы: `Content-Type: application/json`
- Все ответы: `Content-Type: application/json`

### Авторизация
**⚠️ ВАЖНО: Все API endpoints требуют авторизации через Bearer Token.**

Для внешних систем используется простой Bearer Token:
```
Authorization: Bearer YOUR_API_TOKEN
```

**Токен настраивается в переменных окружения** (`API_TOKEN` в `.env`).  
**Токен выдаётся администратором** - он просто сообщает токен внешней команде.

**Минимальная система:**
- Один токен для всех внешних систем
- Токен хранится в переменных окружения
- Простая проверка в middleware
- Для смены токена - меняется переменная окружения

### Коды ответов
- `200 OK` - успешный запрос
- `201 Created` - успешное создание
- `400 Bad Request` - ошибка валидации
- `401 Unauthorized` - не авторизован
- `403 Forbidden` - нет доступа
- `404 Not Found` - ресурс не найден
- `500 Internal Server Error` - ошибка сервера

### Формат ошибок
```json
{
  "error": "Error message",
  "details": "Additional details (optional)"
}
```

---

## Endpoint 1: Получить список районов

### `GET /api/districts`

Получить список всех районов (districts).

**Авторизация:** Bearer Token (обязательно)

**Query параметры:** Нет

**Пример запроса:**
```bash
curl -X GET https://your-domain.vercel.app/api/districts \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

**Пример ответа:**
```json
[
  {
    "id": 1,
    "slug": "kentron",
    "name": "Kentron",
    "created_at": "2026-01-15T10:00:00Z",
    "updated_at": "2026-01-15T10:00:00Z"
  },
  {
    "id": 2,
    "slug": "arabkir",
    "name": "Arabkir",
    "created_at": "2026-01-15T10:00:00Z",
    "updated_at": "2026-01-15T10:00:00Z"
  }
]
```

**Поля ответа:**
- `id` (number) - ID района
- `slug` (string) - Уникальный идентификатор (используется для запросов)
- `name` (string) - Название района
- `created_at` (string, ISO 8601) - Дата создания
- `updated_at` (string, ISO 8601) - Дата обновления

---

## Endpoint 2: Получить список зданий по району

### `GET /api/districts-by-slug/{district_slug}/buildings`

**Примечание:** Из-за ограничений Next.js роутинга используется путь `/api/districts-by-slug/{slug}/buildings` вместо `/api/districts/{slug}/buildings`

Получить список всех зданий в указанном районе.

**Авторизация:** Bearer Token (обязательно)

**Path параметры:**
- `district_slug` (string, required) - Slug района (например, "kentron")

**Query параметры:** Нет

**Пример запроса:**
```bash
curl -X GET https://your-domain.vercel.app/api/districts-by-slug/kentron/buildings \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

**Пример ответа:**
```json
[
  {
    "id": 10,
    "slug": "tower-1",
    "name": "Tower 1",
    "district_id": 1,
    "district_slug": "kentron",
    "created_at": "2026-01-15T10:00:00Z",
    "updated_at": "2026-01-15T10:00:00Z"
  },
  {
    "id": 11,
    "slug": "tower-2",
    "name": "Tower 2",
    "district_id": 1,
    "district_slug": "kentron",
    "created_at": "2026-01-15T10:00:00Z",
    "updated_at": "2026-01-15T10:00:00Z"
  }
]
```

**Поля ответа:**
- `id` (number) - ID здания
- `slug` (string) - Уникальный идентификатор здания
- `name` (string) - Название здания
- `district_id` (number) - ID района
- `district_slug` (string) - Slug района (для удобства)
- `created_at` (string, ISO 8601) - Дата создания
- `updated_at` (string, ISO 8601) - Дата обновления

**Ошибки:**
- `401` - Не авторизован (нет или неверный токен)
- `404` - Район с указанным slug не найден

---

## Endpoint 3: Получить список квартир по зданию

### `GET /api/buildings-by-slug/{building_slug}/apartments`

**Примечание:** Из-за ограничений Next.js роутинга используется путь `/api/buildings-by-slug/{slug}/apartments` вместо `/api/buildings/{slug}/apartments`

Получить список всех квартир в указанном здании.

**Авторизация:** Bearer Token (обязательно)

**Path параметры:**
- `building_slug` (string, required) - Slug здания (например, "tower-1")

**Query параметры:**
- `status` (string, optional) - Фильтр по статусу: `upcoming`, `available`, `reserved`, `sold`
- `page` (number, optional) - Номер страницы (по умолчанию: 1)
- `limit` (number, optional) - Количество на странице (по умолчанию: 50, максимум: 100)

**Пример запроса:**
```bash
# Все квартиры
curl -X GET https://your-domain.vercel.app/api/buildings-by-slug/tower-1/apartments \
  -H "Authorization: Bearer YOUR_API_TOKEN"

# Только доступные
curl -X GET https://your-domain.vercel.app/api/buildings-by-slug/tower-1/apartments?status=available \
  -H "Authorization: Bearer YOUR_API_TOKEN"

# С пагинацией
curl -X GET https://your-domain.vercel.app/api/buildings-by-slug/tower-1/apartments?page=1&limit=20 \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

**Пример ответа:**
```json
{
  "items": [
    {
      "id": 501,
      "apartment_no": "12-05",
      "apartment_type": 2,
      "status": "available",
      "sqm": 52.4,
      "price_sqm": 650000,
      "total_price": 34060000,
      "total_paid": 0,
      "balance": 34060000,
      "building_id": 10,
      "building_slug": "tower-1",
      "district_id": 1,
      "district_slug": "kentron",
      "created_at": "2026-01-15T10:00:00Z",
      "updated_at": "2026-01-15T10:00:00Z"
    },
    {
      "id": 502,
      "apartment_no": "12-06",
      "apartment_type": 2,
      "status": "reserved",
      "sqm": 52.4,
      "price_sqm": 650000,
      "total_price": 34060000,
      "total_paid": 10000000,
      "balance": 24060000,
      "building_id": 10,
      "building_slug": "tower-1",
      "district_id": 1,
      "district_slug": "kentron",
      "created_at": "2026-01-15T10:00:00Z",
      "updated_at": "2026-01-16T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 120,
    "total_pages": 3
  }
}
```

**Поля ответа:**
- `items` (array) - Массив квартир
  - `id` (number) - ID квартиры
  - `apartment_no` (string) - Номер квартиры
  - `apartment_type` (number) - Тип квартиры
  - `status` (string) - Статус: `upcoming`, `available`, `reserved`, `sold`
  - `sqm` (number) - Площадь в м²
  - `price_sqm` (number) - Цена за м² (AMD)
  - `total_price` (number) - Общая цена (AMD, вычисляется: sqm * price_sqm)
  - `total_paid` (number) - Оплачено (AMD)
  - `balance` (number) - Остаток к оплате (AMD, вычисляется: total_price - total_paid)
  - `building_id` (number) - ID здания
  - `building_slug` (string) - Slug здания
  - `district_id` (number) - ID района
  - `district_slug` (string) - Slug района
  - `created_at` (string, ISO 8601) - Дата создания
  - `updated_at` (string, ISO 8601) - Дата обновления
- `pagination` (object) - Информация о пагинации
  - `page` (number) - Текущая страница
  - `limit` (number) - Количество на странице
  - `total` (number) - Всего квартир
  - `total_pages` (number) - Всего страниц

**Ошибки:**
- `401` - Не авторизован (нет или неверный токен)
- `404` - Здание с указанным slug не найдено
- `400` - Некорректные query параметры

---

## Endpoint 4: Получить детали квартиры

### `GET /api/external/apartments/{id}`

**Примечание:** Для внешнего API используется путь `/api/external/apartments/{id}` для отличия от внутреннего API

Получить полную информацию о квартире, включая все поля сделки.

**Авторизация:** Bearer Token (обязательно)

**Path параметры:**
- `id` (number, required) - ID квартиры

**Query параметры:** Нет

**Пример запроса:**
```bash
curl -X GET https://your-domain.vercel.app/api/external/apartments/501 \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

**Пример ответа:**
```json
{
  "id": 501,
  "apartment_no": "12-05",
  "apartment_type": 2,
  "status": "available",
  "sqm": 52.4,
  "price_sqm": 650000,
  "total_price": 34060000,
  "total_paid": 0,
  "balance": 34060000,
  "deal_date": null,
  "ownership_name": null,
  "email": null,
  "passport_tax_no": null,
  "phone": null,
  "sales_type": "unsold",
  "deal_description": null,
  "matter_link": null,
  "floorplan_distribution": null,
  "exterior_link": null,
  "exterior_link2": null,
  "building_id": 10,
  "building_slug": "tower-1",
  "building_name": "Tower 1",
  "district_id": 1,
  "district_slug": "kentron",
  "district_name": "Kentron",
  "attachments": [
    {
      "id": 1,
      "fileType": "FLOORPLAN",
      "fileUrl": "https://...",
      "fileName": "floorplan.pdf",
      "fileSize": 12345,
      "md5Hash": "5d41402abc4b2a76b9719d911017c592",
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ],
  "created_at": "2026-01-15T10:00:00Z",
  "updated_at": "2026-01-15T10:00:00Z"
}
```

**Поля ответа:**
- Все поля из списка квартир (Endpoint 3)
- `deal_date` (string, ISO 8601 date, nullable) - Дата сделки
- `ownership_name` (string, nullable) - Имя владельца
- `email` (string, nullable) - Email
- `passport_tax_no` (string, nullable) - Паспорт/Налоговый номер
- `phone` (string, nullable) - Телефон
- `sales_type` (string) - Тип продажи: `unsold`, `mortgage`, `cash`, `timebased`
- `deal_description` (string, nullable, max 500) - Описание сделки
- `matter_link` (string, nullable) - Ссылка на Matter
- `floorplan_distribution` (string, nullable, max 500) - Распределение планировки
- `exterior_link` (string, nullable) - Внешняя ссылка 1
- `exterior_link2` (string, nullable) - Внешняя ссылка 2
- `building_name` (string) - Название здания
- `district_name` (string) - Название района
- `attachments` (array) - Массив вложений (файлов)
  - `id` (number) - ID вложения
  - `fileType` (string) - Тип файла: `AGREEMENT`, `FLOORPLAN`, `IMAGE`, `PROGRESS_IMAGE`
  - `fileUrl` (string) - URL файла для скачивания
  - `fileName` (string, nullable) - Имя файла
  - `fileSize` (number, nullable) - Размер файла в байтах
  - `md5Hash` (string, nullable) - MD5 хеш файла (32 символа) - **используется для проверки, нужно ли скачивать файл**
  - `createdAt` (string, ISO 8601) - Дата создания

**Ошибки:**
- `401` - Не авторизован (нет или неверный токен)
- `404` - Квартира с указанным ID не найдена

---

## Endpoint 5: Обновить статус квартиры

### `PUT /api/apartments/{id}/status`

Обновить статус квартиры. Используется внешней системой для синхронизации статусов.

**Авторизация:** Bearer Token (обязательно)

**Path параметры:**
- `id` (number, required) - ID квартиры

**Body:**
```json
{
  "status": "reserved"
}
```

**Валидные значения статуса:**
- `upcoming` - Предстоящая
- `available` - Доступна
- `reserved` - Зарезервирована
- `sold` - Продана

**Пример запроса:**
```bash
curl -X PUT https://your-domain.vercel.app/api/apartments/501/status \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "reserved"}'
```

**Примечание:** Этот endpoint использует стандартный путь `/api/apartments/{id}/status`

**Пример ответа:**
```json
{
  "id": 501,
  "status": "reserved",
  "updated_at": "2026-01-19T10:12:00Z"
}
```

**Примечание:** Статус возвращается в верхнем регистре (RESERVED), но принимается в любом регистре

**Поля ответа:**
- `id` (number) - ID квартиры
- `status` (string) - Новый статус
- `updated_at` (string, ISO 8601) - Дата обновления

**Ошибки:**
- `400` - Некорректный статус или формат запроса
- `401` - Не авторизован (нет или неверный токен)
- `404` - Квартира с указанным ID не найдена
- `500` - Ошибка сервера

**Пример ошибки:**
```json
{
  "error": "Invalid status value",
  "details": "Status must be one of: upcoming, available, reserved, sold"
}
```

---

## Тестовые данные для интеграции

### Тестовый аккаунт API
```
API Token: test_api_token_12345 (для тестирования)
```

**Внимание:** В production будет выдан реальный токен.

### Тестовые данные

**Район:**
- Slug: `kentron`
- ID: 1

**Здание:**
- Slug: `tower-1`
- ID: 10
- Район: `kentron`

**Квартира:**
- ID: 501
- Номер: `12-05`
- Здание: `tower-1`
- Статус: `available`

### Пример полного потока запросов

```bash
# Все запросы требуют Bearer Token!

# 1. Получить список районов
curl https://your-domain.vercel.app/api/districts \
  -H "Authorization: Bearer test_api_token_12345"

# 2. Получить здания в районе "kentron"
curl https://your-domain.vercel.app/api/districts-by-slug/kentron/buildings \
  -H "Authorization: Bearer test_api_token_12345"

# 3. Получить квартиры в здании "tower-1"
curl https://your-domain.vercel.app/api/buildings-by-slug/tower-1/apartments?status=available \
  -H "Authorization: Bearer test_api_token_12345"

# 4. Получить детали квартиры 501
curl https://your-domain.vercel.app/api/external/apartments/501 \
  -H "Authorization: Bearer test_api_token_12345"

# 5. Изменить статус квартиры 501 на "reserved"
curl -X PUT https://your-domain.vercel.app/api/apartments/501/status \
  -H "Authorization: Bearer test_api_token_12345" \
  -H "Content-Type: application/json" \
  -d '{"status": "reserved"}'
```

---

## Версионирование API

Текущая версия: **v1**

В будущем возможны изменения. Версионирование будет реализовано через:
- URL: `/api/v1/...` или
- Header: `API-Version: 1`

---

## Лимиты и ограничения

- **Rate Limiting:** 100 запросов в минуту на токен (может быть изменено)
- **Максимальный размер запроса:** 1 MB
- **Максимальный limit для пагинации:** 100 записей

## Безопасность

### Простая система защиты

**Как это работает:**
- API токен хранится в переменной окружения `API_TOKEN`
- Middleware проверяет токен на каждом запросе
- Если токен совпадает → доступ разрешён
- Если токен неверный → ошибка `401 Unauthorized`

**Использование токена:**
- Токен передаётся в заголовке `Authorization: Bearer TOKEN`
- Токен даёт доступ ко всем API endpoints
- Не передавайте токен в URL или в логах

**Смена токена:**
- Администратор меняет `API_TOKEN` в переменных окружения
- Перезапускает приложение (или Vercel автоматически)
- Старый токен перестаёт работать

**Рекомендации:**
- Использовать разные токены для staging и production
- Не коммитить токены в Git (только в `.env`)
- Периодически менять токен для безопасности

---

---

## MD5 хеши для файлов

### Что такое MD5?

MD5 — это уникальный "отпечаток" файла (строка из 32 символов). Для одного и того же файла всегда получается одинаковый MD5.

### Зачем это нужно?

MD5 позволяет клиенту проверить, есть ли у него уже этот файл, и скачать только новые или изменившиеся файлы. Это экономит трафик и снижает нагрузку на сервер.

### Как использовать MD5?

**Пример использования на стороне клиента:**

```typescript
// 1. Получить список файлов с MD5
const response = await fetch('/api/external/apartments/501', {
  headers: { 'Authorization': 'Bearer TOKEN' }
});
const apartment = await response.json();

// 2. Для каждого файла проверить, есть ли он локально
for (const attachment of apartment.attachments) {
  // Вычислить MD5 локального файла (если он есть)
  const localMD5 = await calculateLocalFileMD5(attachment.fileName);
  
  // Сравнить MD5
  if (localMD5 !== attachment.md5Hash) {
    // Файл новый или изменился → скачать
    await downloadFile(attachment.fileUrl, attachment.fileName);
  } else {
    // Файл уже есть → пропустить
    console.log(`File ${attachment.fileName} already exists, skipping...`);
  }
}
```

**Как вычислить MD5 локально:**

- **Node.js:** Используйте библиотеку `crypto`:
  ```javascript
  const crypto = require('crypto');
  const fs = require('fs');
  
  const fileBuffer = fs.readFileSync('path/to/file');
  const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
  ```

- **Python:** Используйте библиотеку `hashlib`:
  ```python
  import hashlib
  
  with open('path/to/file', 'rb') as f:
      file_hash = hashlib.md5(f.read()).hexdigest()
  ```

- **Bash:** Используйте команду `md5sum`:
  ```bash
  md5sum path/to/file
  ```

### Важные моменты

- Поле `md5Hash` может быть `null` для старых файлов (до внедрения MD5)
- Если `md5Hash` равен `null`, клиент должен скачать файл для проверки
- MD5 вычисляется автоматически при загрузке новых файлов
- Для существующих файлов MD5 вычисляется через скрипт миграции

---

## Поддержка

Для вопросов по API обращайтесь к администратору системы.

**Последнее обновление:** 2026-01-26
