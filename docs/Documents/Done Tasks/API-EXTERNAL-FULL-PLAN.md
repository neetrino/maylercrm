# План: API «всё в одном JSON» для внешней команды

## Запрос внешней команды
Создать **один API endpoint**, который в **одном JSON** передаёт **всю информацию** сразу: Districts → Buildings → Apartments (со всеми полями и attachments). Чтобы не делать несколько запросов, а получить всё за один вызов.

---

## Что уже есть

| Endpoint | Описание |
|----------|----------|
| `GET /api/external/apartments/[id]` | Одна квартира по ID (Bearer token) |
| `GET /api/districts` | Список районов |
| `GET /api/districts-by-slug/[slug]/buildings` | Здания по району |
| `GET /api/buildings/[id]/apartments` | Квартиры по зданию |

Внешняя команда сейчас вынуждена делать много запросов: сначала districts, потом buildings для каждого district, потом apartments для каждого building. Нужно **всё в одном ответе**.

---

## Предлагаемое решение

### 1. Новый endpoint

**`GET /api/external/full`**

- **Авторизация:** Bearer Token (как в существующем `/api/external/apartments/[id]`)
- **Переменная окружения:** `API_TOKEN` (уже используется)

### 2. Формат ответа (JSON)

Иерархия: **Districts → Buildings → Apartments** (со всеми полями и attachments).

```json
{
  "districts": [
    {
      "id": 1,
      "slug": "kentron",
      "name": "Kentron",
      "buildings": [
        {
          "id": 1,
          "district_id": 1,
          "name": "Building A",
          "slug": "building-a",
          "apartments": [
            {
              "id": 1,
              "apartment_no": "101",
              "apartment_type": 2,
              "status": "available",
              "sqm": 85.5,
              "price_sqm": 350000,
              "total_price": 29925000,
              "total_paid": null,
              "balance": null,
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
              "building_id": 1,
              "building_slug": "building-a",
              "building_name": "Building A",
              "district_id": 1,
              "district_slug": "kentron",
              "district_name": "Kentron",
              "attachments": [
                {
                  "id": 1,
                  "fileType": "IMAGE",
                  "fileUrl": "https://...",
                  "fileName": "photo.jpg",
                  "fileSize": 12345,
                  "md5Hash": "...",
                  "createdAt": "2026-..."
                }
              ],
              "created_at": "...",
              "updated_at": "..."
            }
          ]
        }
      ]
    }
  ],
  "meta": {
    "generated_at": "2026-02-05T12:00:00.000Z",
    "total_districts": 1,
    "total_buildings": 1,
    "total_apartments": 1
  }
}
```

Поля квартир — те же, что в `GET /api/external/apartments/[id]` (snake_case, вычисляемые `total_price`, `balance` и т.д.).

### 3. Что нужно для реализации

| № | Что | Комментарий |
|---|-----|-------------|
| 1 | **Новый файл** `app/api/external/full/route.ts` | GET handler |
| 2 | **Проверка Bearer token** | Логика как в `/api/external/apartments/[id]` |
| 3 | **Prisma-запрос** | `prisma.district.findMany({ include: { buildings: { include: { apartments: { include: { attachments: true } } } } } })` — один запрос, без N+1 |
| 4 | **Сервис или inline-логика** | Форматирование данных (snake_case, вычисление total_price/balance для apartments) |
| 5 | **`API_TOKEN`** | Уже есть в `.env` — ничего менять не нужно |

### 4. Дополнительные вопросы (для обсуждения)

- **Пагинация:** если квартир много (сотни/тысячи), ответ может быть тяжёлым. Нужна ли пагинация/фильтрация (например, только один district или один building) или «всё сразу» — нормально?
- **Кэширование:** можно добавить `Cache-Control` (например, 1–5 минут), чтобы снизить нагрузку при частых запросах.
- **Rate limit:** стоит ли ограничить число вызовов `/api/external/full` (например, 10 запросов в минуту), чтобы защититься от злоупотреблений?

---

## Итог

- **Сделать:** один endpoint `GET /api/external/full` с Bearer token, который возвращает все districts → buildings → apartments (включая attachments) в одном JSON.
- **Не менять:** существующие API, БД, миграции.
- **Окружение:** `API_TOKEN` уже используется, изменений не требуется.

Жду вашего одобрения — после этого приступлю к реализации.
