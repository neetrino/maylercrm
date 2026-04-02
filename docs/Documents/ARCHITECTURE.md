# 🏗️ Архитектура проекта Meluvis CRM

## Технологический стек

### Frontend
- **Next.js 14+** (App Router) - React фреймворк
- **TypeScript** - типизация
- **Tailwind CSS** - стилизация
- **shadcn/ui** - UI компоненты (опционально)
- **React Hook Form** - формы
- **Zod** - валидация

### Backend
- **Next.js API Routes** - серверная логика
- **NextAuth.js** - авторизация
- **Prisma ORM** - работа с БД
- **PostgreSQL** (Neon) - база данных

### Инфраструктура
- **Vercel** - хостинг и деплой
- **Cloudflare R2** - хранение файлов (S3-совместимое API)
- **Neon PostgreSQL** - облачная БД

### Инструменты разработки
- **ESLint** - линтер
- **Prettier** - форматирование
- **Husky** - git hooks (опционально)

---

## Структура проекта

```
meluviscrm/
├── .next/                    # Next.js build
├── .vercel/                  # Vercel config
├── prisma/
│   ├── schema.prisma         # Prisma схема
│   └── migrations/           # Миграции БД
├── public/                   # Статические файлы
│   ├── images/
│   └── ...
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── (auth)/           # Группа роутов (авторизация)
│   │   │   └── login/
│   │   ├── (dashboard)/      # Группа роутов (основное)
│   │   │   ├── apartments/
│   │   │   ├── dashboard/
│   │   │   └── layout.tsx
│   │   ├── api/              # API routes
│   │   │   ├── auth/
│   │   │   ├── districts/
│   │   │   ├── buildings/
│   │   │   ├── apartments/
│   │   │   └── dashboard/
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Главная страница
│   ├── components/           # React компоненты
│   │   ├── ui/               # UI компоненты (кнопки, формы)
│   │   ├── apartments/       # Компоненты квартир
│   │   ├── districts/        # Компоненты районов
│   │   ├── buildings/        # Компоненты зданий
│   │   ├── dashboard/        # Компоненты dashboard
│   │   └── layout/           # Layout компоненты
│   ├── lib/                  # Утилиты и конфигурация
│   │   ├── prisma.ts         # Prisma client
│   │   ├── auth.ts           # NextAuth config
│   │   ├── utils.ts          # Общие утилиты
│   │   └── validations.ts    # Zod схемы
│   ├── services/             # Бизнес-логика
│   │   ├── district.service.ts
│   │   ├── building.service.ts
│   │   ├── apartment.service.ts
│   │   └── dashboard.service.ts
│   ├── types/                # TypeScript типы
│   │   ├── district.ts
│   │   ├── building.ts
│   │   ├── apartment.ts
│   │   └── user.ts
│   └── middleware.ts         # Next.js middleware
├── .env.local                # Локальные переменные (gitignore)
├── .env.example              # Пример переменных
├── .eslintrc.json           # ESLint config
├── .prettierrc              # Prettier config
├── next.config.js           # Next.js config
├── package.json
├── tsconfig.json
└── README.md
```

---

## Архитектурные принципы

### 1. Разделение ответственности

**App Router (app/)** - только роутинг и композиция
- Не содержит бизнес-логику
- Только вызовы сервисов и компонентов

**Services (services/)** - вся бизнес-логика
- Валидация данных
- Работа с БД через Prisma
- Вычисления (total_price, balance)
- Правила бизнес-логики

**Components (components/)** - только отображение
- UI компоненты без логики
- Получают данные через props
- Вызывают сервисы через callbacks

**API Routes (app/api/)** - только HTTP обработка
- Валидация запросов
- Вызов сервисов
- Формирование ответов
- Обработка ошибок

### 2. Типизация

- Все данные типизированы через TypeScript
- Использование Zod для валидации runtime
- Prisma генерирует типы из схемы

### 3. Безопасность

- NextAuth.js для авторизации
- Middleware для защиты роутов
- Валидация всех входных данных
- Защита от SQL Injection (Prisma)
- CSRF защита (NextAuth)
- XSS защита (React автоматически)

---

## Схема базы данных

### Таблица `users`
```sql
id              SERIAL PRIMARY KEY
email           VARCHAR(255) UNIQUE NOT NULL
password_hash   VARCHAR(255) NOT NULL
role            ENUM('admin', 'sales') NOT NULL
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

### Таблица `districts`
```sql
id              SERIAL PRIMARY KEY
name            VARCHAR(255) NOT NULL
slug            VARCHAR(255) UNIQUE NOT NULL
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

### Таблица `buildings`
```sql
id              SERIAL PRIMARY KEY
district_id     INTEGER REFERENCES districts(id) ON DELETE CASCADE
name            VARCHAR(255) NOT NULL
slug            VARCHAR(255) NOT NULL
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
UNIQUE(district_id, slug)
```

### Таблица `apartments`
```sql
id                      SERIAL PRIMARY KEY
building_id             INTEGER REFERENCES buildings(id) ON DELETE CASCADE
apartment_no            VARCHAR(50) NOT NULL
apartment_type          INTEGER
status                  ENUM('upcoming', 'available', 'reserved', 'sold') DEFAULT 'upcoming'
deal_date               DATE
ownership_name          TEXT
email                   VARCHAR(255)
passport_tax_no         VARCHAR(100)
phone                   VARCHAR(50)
sqm                     DECIMAL(10, 2)
price_sqm               DECIMAL(12, 2)
total_price             DECIMAL(12, 2)  -- вычисляемое: sqm * price_sqm
sales_type              ENUM('unsold', 'mortgage', 'cash', 'timebased') DEFAULT 'unsold'
total_paid              DECIMAL(12, 2) DEFAULT 0
deal_description        TEXT  -- max 500
matter_link             TEXT
floorplan_distribution  TEXT  -- max 500
exterior_link           TEXT
exterior_link2          TEXT
created_at              TIMESTAMP DEFAULT NOW()
updated_at              TIMESTAMP DEFAULT NOW()
UNIQUE(building_id, apartment_no)
```

### Таблица `apartment_attachments`
```sql
id              SERIAL PRIMARY KEY
apartment_id    INTEGER REFERENCES apartments(id) ON DELETE CASCADE
file_type       ENUM('agreement', 'floorplan', 'image', 'progress_image')
file_url        TEXT NOT NULL
file_name       VARCHAR(255)
file_size       INTEGER
created_at      TIMESTAMP DEFAULT NOW()
```


---

## Потоки данных

### Создание квартиры
```
User Input (Form)
  ↓
Component (validation)
  ↓
API Route (/api/apartments POST)
  ↓
Service (apartment.service.ts)
  ↓
Prisma (database)
  ↓
Response (JSON)
```

### Получение списка квартир
```
API Request (/api/apartments?status=available)
  ↓
API Route
  ↓
Service (apartment.service.ts)
  ↓
Prisma (database query)
  ↓
Service (calculate total_price, balance)
  ↓
Response (JSON)
```

### Изменение статуса (внешнее API)
```
External System Request
  ↓
API Route (/api/apartments/[id]/status PUT)
  ↓
Auth Middleware (Bearer Token)
  ↓
Service (apartment.service.ts)
  ↓
Prisma (update)
  ↓
Response (JSON)
```

---

## Безопасность

### Авторизация
- NextAuth.js с JWT для веб-интерфейса
- Session-based для веб-интерфейса
- Простой Bearer Token для API (обязательно для всех endpoints)
  - Токен хранится в переменной окружения `API_TOKEN`
  - Middleware проверяет токен на каждом API запросе
  - Простая проверка: `request.headers.authorization === 'Bearer ' + process.env.API_TOKEN`

### Роли и права
- **Admin**: полный доступ ко всем операциям
- **Sales**: только чтение и редактирование квартир

### Валидация
- Все входные данные валидируются через Zod
- SQL Injection защита через Prisma
- XSS защита через React

### API Security
- Rate limiting (опционально, через Vercel)
- CORS настройки
- Bearer Token авторизация

---

## Производительность

### Оптимизации
- Server Components где возможно
- Пагинация для списков
- Индексы в БД (slug, status, building_id)
- Кеширование через Next.js (revalidate)
- Оптимизация изображений (Next.js Image)

### Мониторинг
- Vercel Analytics (опционально)
- Логирование ошибок

---

## Масштабируемость

### Горизонтальное масштабирование
- Stateless приложение (можно масштабировать)
- Внешняя БД (Neon)
- Внешнее хранилище файлов (Cloudflare R2)

### Вертикальное масштабирование
- Оптимизация запросов к БД
- Индексы
- Кеширование

---

**Последнее обновление:** 2026-01-19
