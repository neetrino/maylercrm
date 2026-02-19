# Документация по импорту данных в CRM

Описание процесса загрузки тестовых и рабочих данных: Excel → БД, медиа из R2, Matter-ссылки.

---

## Обзор

Импорт состоит из двух этапов:

1. **Данные из Excel** — районы, здания, квартиры; для квартир подставляются шаблонные данные по типу (Type Media).
2. **Медиа и ссылки из R2 / фиксированные URL** — вложения (фото, планы) и поле Matter Link по типу квартиры (1–21).

Переменные окружения берутся из `.env` и `.env.local` (приоритет у `.env.local`).

---

## Предварительные условия

- **DATABASE_URL** — строка подключения к PostgreSQL (в `.env` или `.env.local`).
- **R2_PUBLIC_URL** — публичный URL бакета Cloudflare R2 (без слэша в конце), нужен для скрипта вложений.
- Файл Excel: по умолчанию `import/MylerDBActualData.xlsx`.
- Файлы медиа уже загружены в R2 в структуре, описанной ниже.

---

## Порядок загрузки (полный цикл)

### 1. Очистка (при необходимости)

При повторной загрузке старые данные можно удалить вручную (Prisma Studio или SQL) или оставить — скрипты используют upsert (районы, здания, квартиры) и полную перезапись вложений.

### 2. Импорт из Excel

```bash
npm run db:import-excel
```

Или с указанием файла:

```bash
npx tsx scripts/import-from-excel.ts путь/к/файлу.xlsx
```

- Читает 4 листа по **именам** (ищет листы, содержащие: district, building, apartment, type media).
- **Районы** — создаёт/обновляет по `slug` (нормализация: пробелы и `_` → `-`, только `a-z0-9-`).
- **Здания** — привязка к району по `district_slug`, уникальность по `district_id` + `slug`.
- **Квартиры** — привязка к зданию по `district_slug` + `building_slug`; для каждой квартиры по `apartment_type` (1–21) подставляются пустые поля из листа **Type Media** (sqm, price_sqm, floor и т.д.).
- Даты в Excel (числовой формат) конвертируются в даты (YYYY-MM-DD).

### 3. Заполнение вложений и Matter Link из R2

```bash
npm run db:seed-attachments-r2
```

- Удаляет все существующие записи вложений в БД (файлы в R2 не трогает).
- Для каждой квартиры создаёт:
  - 6 вложений типа **IMAGE**: фото из `import/Type_floorplans/Renders/` (Render2.jpeg … Render7.jpeg).
  - 1 вложение **FLOORPLAN** (PDF) и 1 **FLOORPLAN** (PNG) по типу квартиры из `import/Type_floorplans/2D/PDF/` и `.../PNG/` (Type_1 … Type_21).
- Проставляет в каждой квартире поле **matterLink** по типу:  
  `https://3d.evolver.company/Appartment1` … `Appartment21`.

Требуется **R2_PUBLIC_URL** в окружении.

### 4. Только Matter Link (без перезаписи вложений)

Если нужно обновить только Matter-ссылки:

```bash
npx tsx scripts/seed-matter-links.ts
```

Обходит все квартиры и выставляет `matterLink` по `apartment_type` (1–21).

---

## Структура Excel-файла

Ожидаются 4 листа (имена могут содержать ключевые слова, регистр не важен):

| Лист        | Назначение | Основные колонки (примеры) |
|------------|------------|----------------------------|
| **districts**  | Районы     | `name`, `districts_slug` или `slug` |
| **buildings**  | Здания     | `district_slug`, `name`, `buildings_slug` или `slug` |
| **apartments** | Квартиры   | `district_slug`, `building_slug`, `apartment_no`, `apartment_type`, `Floor`, `status`, `sqm`, `price_sqm`, `sales_type`, `deal_date`, контакты и др. |
| **Type Media** | Шаблон по типу (1–21) | `Type` (или аналог), колонки для подстановки: `sqm`, `price_sqm`, `floor` и т.д. |

Для квартир связь с районом/зданием — по slug после нормализации (нижний регистр, `_` → `-`, только буквы/цифры/дефис). Дата сделки может быть числом Excel (serial date) или строкой YYYY-MM-DD.

---

## Структура файлов на R2 (бакет)

Файлы должны лежать в бакете по путям (ключам) относительно корня:

```
import/
  Type_floorplans/
    Renders/
      Render2.jpeg
      Render3.jpeg
      Render4.jpeg
      Render5.jpeg
      Render6.jpeg
      Render7.jpeg
    2D/
      PDF/
        Type_1.pdf … Type_21.pdf
      PNG/
        Type_1.png … Type_21.png
```

Скрипт собирает URL как: `{R2_PUBLIC_URL}/{ключ}`, например  
`https://pub-xxx.r2.dev/import/Type_floorplans/Renders/Render2.jpeg`.

---

## Matter Link по типу квартиры

Для типов 1–21 используются фиксированные ссылки:

- Тип 1 → `https://3d.evolver.company/Appartment1`
- Тип 2 → `https://3d.evolver.company/Appartment2`
- …
- Тип 21 → `https://3d.evolver.company/Appartment21`

Они проставляются при запуске `db:seed-attachments-r2` или отдельно — `seed-matter-links.ts`.

---

## Справочник скриптов и команд

| Команда | Описание |
|--------|----------|
| `npm run db:import-excel` | Импорт из `import/MylerDBActualData.xlsx` (районы, здания, квартиры + Type Media). |
| `npm run db:seed-attachments-r2` | Пересоздание вложений из R2 и простановка matterLink по типу. |
| `npx tsx scripts/seed-matter-links.ts` | Только обновление matterLink у всех квартир по типу. |
| `npm run db:import-csv` | Импорт из CSV в `data/import/` (districts, buildings, apartments), с поддержкой колонки `floor`. |

---

## Удаление вложений в интерфейсе

Кнопка «Delete» у файла в карточке квартиры **только отвязывает** вложение от квартиры (удаляет запись в БД). Файл в R2 не удаляется.

---

## Поле Floor (этаж)

- В модели квартиры есть поле **floor** (целое, опционально).
- Оно участвует в создании/редактировании квартиры, во всех API (в т.ч. внешних) и в импорте (Excel и CSV).
- В Excel используется колонка **Floor** (с большой буквы).

---

## Возможные проблемы

- **Квартиры не создаются** — проверить, что в Excel у районов и зданий slug после нормализации совпадают с теми, что указаны в листе квартир (`district_slug`, `building_slug`). Подчёркивания приводятся к дефисам.
- **Нет вложений после seed** — проверить `R2_PUBLIC_URL` в `.env.local` и наличие файлов в R2 по указанной структуре.
- **Даты из Excel неверные** — скрипт поддерживает числовой формат Excel (serial date) и строку YYYY-MM-DD.

Подробности по окружению и деплою — в `Documents/ENVIRONMENT.md` и `Documents/DEPLOYMENT.md`.
