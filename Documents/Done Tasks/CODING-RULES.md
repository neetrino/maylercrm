# 📝 Правила написания кода

## Общие принципы

### 1. Чистый код
- Минимум "магических чисел" и повторений
- Следование принципам SOLID, DRY, KISS
- Понятные имена переменных и функций
- Комментарии к ключевым функциям и классам

### 2. Стиль кода

**TypeScript/JavaScript:**
- Использовать Airbnb Style Guide (базовая)
- Prettier для автоматического форматирования
- ESLint для проверки качества

**Примеры хороших имён:**
```typescript
// ✅ Хорошо
const userProfile = getUserProfile(userId);
const calculateTotalPrice = (sqm: number, priceSqm: number) => sqm * priceSqm;

// ❌ Плохо
const x1 = getData(id);
const calc = (a, b) => a * b;
```

### 3. Форматирование

**Использовать Prettier:**
- 2 пробела для отступов
- Одинарные кавычки для строк
- Точка с запятой обязательна
- Trailing commas в многострочных структурах

**Пример .prettierrc:**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

---

## Структура проекта

### Папки и файлы

**Структура папок:**
```
src/
├── app/              # Next.js App Router (роутинг)
├── components/        # React компоненты
│   ├── ui/           # UI компоненты (переиспользуемые)
│   └── ...           # Специфичные компоненты
├── lib/              # Утилиты и конфигурация
├── services/         # Бизнес-логика
├── types/            # TypeScript типы
└── middleware.ts     # Next.js middleware
```

**Правила именования:**
- Компоненты: `PascalCase` (например, `ApartmentCard.tsx`)
- Файлы утилит: `camelCase` (например, `formatDate.ts`)
- Сервисы: `camelCase.service.ts` (например, `apartment.service.ts`)
- Типы: `camelCase.ts` (например, `apartment.ts`)

---

## TypeScript

### Типизация

**Всегда использовать типы:**
```typescript
// ✅ Хорошо
interface Apartment {
  id: number;
  apartment_no: string;
  status: 'upcoming' | 'available' | 'reserved' | 'sold';
}

function getApartment(id: number): Promise<Apartment> {
  // ...
}

// ❌ Плохо
function getApartment(id) {
  // ...
}
```

**Использовать `interface` для объектов, `type` для union/intersection:**
```typescript
// ✅ Interface для объектов
interface District {
  id: number;
  name: string;
  slug: string;
}

// ✅ Type для union
type ApartmentStatus = 'upcoming' | 'available' | 'reserved' | 'sold';
```

### Избегать `any`
```typescript
// ✅ Хорошо
function processData(data: unknown): Apartment {
  if (isApartment(data)) {
    return data;
  }
  throw new Error('Invalid data');
}

// ❌ Плохо
function processData(data: any): any {
  return data;
}
```

---

## React компоненты

### Server vs Client Components

**Server Components (по умолчанию):**
- Использовать для данных из БД
- Нет состояния, нет эффектов
- Быстрее, меньше JS

```typescript
// ✅ Server Component
export default async function ApartmentList() {
  const apartments = await getApartments();
  return <div>{/* render */}</div>;
}
```

**Client Components (когда нужны хуки):**
```typescript
'use client';

import { useState } from 'react';

export default function ApartmentCard() {
  const [status, setStatus] = useState('available');
  // ...
}
```

### Структура компонента

```typescript
// 1. Импорты
import { useState } from 'react';
import type { Apartment } from '@/types/apartment';

// 2. Типы/Интерфейсы
interface ApartmentCardProps {
  apartment: Apartment;
  onStatusChange: (id: number, status: string) => void;
}

// 3. Компонент
export default function ApartmentCard({
  apartment,
  onStatusChange,
}: ApartmentCardProps) {
  // 4. Hooks
  const [isLoading, setIsLoading] = useState(false);

  // 5. Handlers
  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true);
    try {
      await onStatusChange(apartment.id, newStatus);
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

---

## API Routes

### Структура API endpoint

```typescript
// app/api/apartments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { apartmentService } from '@/services/apartment.service';
import { updateApartmentStatusSchema } from '@/lib/validations';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid apartment ID' },
        { status: 400 }
      );
    }

    const apartment = await apartmentService.getById(id);
    
    if (!apartment) {
      return NextResponse.json(
        { error: 'Apartment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(apartment);
  } catch (error) {
    console.error('Error fetching apartment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Обработка ошибок

**Всегда логировать ошибки:**
```typescript
try {
  // код
} catch (error) {
  console.error('[API] Error in endpoint:', {
    endpoint: '/api/apartments',
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
  });
  
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

---

## Сервисы (Business Logic)

### Разделение ответственности

**Сервисы содержат всю бизнес-логику:**
```typescript
// services/apartment.service.ts
import { prisma } from '@/lib/prisma';
import type { Apartment, ApartmentStatus } from '@/types/apartment';

export const apartmentService = {
  async getById(id: number): Promise<Apartment | null> {
    const apartment = await prisma.apartment.findUnique({
      where: { id },
      include: {
        building: {
          include: {
            district: true,
          },
        },
      },
    });

    if (!apartment) {
      return null;
    }

    // Вычисляемые поля
    const totalPrice = apartment.sqm && apartment.price_sqm
      ? apartment.sqm * apartment.price_sqm
      : null;

    const balance = totalPrice && apartment.total_paid
      ? totalPrice - apartment.total_paid
      : null;

    return {
      ...apartment,
      total_price: totalPrice,
      balance,
    };
  },

  async updateStatus(
    id: number,
    status: ApartmentStatus
  ): Promise<Apartment> {
    // Валидация бизнес-правил
    if (status === 'sold' && !apartment.deal_date) {
      throw new Error('Deal date is required for sold status');
    }

    return await prisma.apartment.update({
      where: { id },
      data: { status, updated_at: new Date() },
    });
  },
};
```

---

## Валидация

### Использование Zod

**Все входные данные валидируются через Zod:**
```typescript
// lib/validations.ts
import { z } from 'zod';

export const updateApartmentStatusSchema = z.object({
  status: z.enum(['upcoming', 'available', 'reserved', 'sold']),
});

export const createApartmentSchema = z.object({
  building_id: z.number().int().positive(),
  apartment_no: z.string().min(1).max(50),
  apartment_type: z.number().int().optional(),
  sqm: z.number().positive().optional(),
  price_sqm: z.number().positive().optional(),
  // ...
});
```

**Использование в API:**
```typescript
const body = await request.json();
const validatedData = updateApartmentStatusSchema.parse(body);
```

---

## Работа с базой данных

### Prisma

**Всегда использовать Prisma Client:**
```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

**Типы из Prisma:**
```typescript
import type { Apartment, Building } from '@prisma/client';
```

---

## Логирование

### Визуальное логирование

**Использовать понятные сообщения:**
```typescript
// ✅ Хорошо
console.log('[Apartment Service] Fetching apartment:', { id });
console.log('[Apartment Service] Apartment found:', { id, status });
console.error('[Apartment Service] Error fetching apartment:', {
  id,
  error: error.message,
  stack: error.stack,
});

// ❌ Плохо
console.log('data:', data);
console.log('error');
```

**Формат логов:**
```
[Module/Service] Action: description
  Context: { key: value }
```

---

## Тестирование

### Unit тесты

**Тестировать сервисы и утилиты:**
```typescript
// __tests__/services/apartment.service.test.ts
import { apartmentService } from '@/services/apartment.service';

describe('apartmentService', () => {
  it('should calculate total_price correctly', async () => {
    const apartment = await apartmentService.getById(1);
    expect(apartment?.total_price).toBe(34060000);
  });
});
```

---

## Git

### Коммиты

**Формат коммитов:**
```
type(scope): description

[optional body]
```

**Типы:**
- `feat` - новая функциональность
- `fix` - исправление бага
- `docs` - документация
- `style` - форматирование
- `refactor` - рефакторинг
- `test` - тесты
- `chore` - рутинные задачи

**Примеры:**
```
feat(apartments): add status change functionality
fix(api): handle invalid apartment ID
docs(api): update API specification
```

---

## Безопасность

### Валидация входных данных

**Всегда валидировать:**
- Параметры запросов
- Тела запросов
- Query параметры

### Защита от SQL Injection

**Использовать Prisma (защита встроена):**
```typescript
// ✅ Безопасно
await prisma.apartment.findUnique({
  where: { id: parseInt(id) },
});

// ❌ НЕ ДЕЛАТЬ ТАК (если бы использовали raw SQL)
const query = `SELECT * FROM apartments WHERE id = ${id}`;
```

### XSS защита

**React автоматически экранирует, но:**
```typescript
// ✅ Безопасно
<div>{apartment.name}</div>

// ⚠️ Осторожно с dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: content }} />
```

---

## Производительность

### Оптимизация запросов

**Использовать select для нужных полей:**
```typescript
// ✅ Хорошо (только нужные поля)
await prisma.apartment.findMany({
  select: {
    id: true,
    apartment_no: true,
    status: true,
  },
});

// ⚠️ Плохо (все поля + связи)
await prisma.apartment.findMany({
  include: {
    building: {
      include: { district: true },
    },
  },
});
```

### Кеширование

**Использовать Next.js revalidate:**
```typescript
export const revalidate = 60; // кеш на 60 секунд
```

---

**Последнее обновление:** 2026-01-19
