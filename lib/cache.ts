import { unstable_cache, revalidateTag } from 'next/cache';

/**
 * Утилита для кеширования данных
 * 
 * ВАЖНО: 
 * - Кеш используется ТОЛЬКО для защиты от множественных одновременных запросов
 * - Кеш должен быть очень коротким (30-60 секунд максимум)
 * - Данные должны быть всегда актуальными
 * - При любых изменениях данных - ОБЯЗАТЕЛЬНО инвалидировать кеш
 */

// In-memory кеш для инвалидации (можно заменить на Redis)
const cacheInvalidationKeys = new Set<string>();

/**
 * Получить данные из кеша или выполнить функцию
 * 
 * @param key - уникальный ключ кеша
 * @param fn - функция для получения данных
 * @param revalidate - время жизни кеша в секундах (максимум 60 секунд!)
 * @param tags - теги для групповой инвалидации
 */
export async function getCachedData<T>(
  key: string,
  fn: () => Promise<T>,
  revalidate: number = 30,
  tags?: string[]
): Promise<T> {
  // Проверяем, не был ли кеш инвалидирован
  if (cacheInvalidationKeys.has(key)) {
    cacheInvalidationKeys.delete(key);
    // Выполняем функцию без кеша
    return fn();
  }

  // Используем unstable_cache от Next.js
  const cachedFn = unstable_cache(
    async () => fn(),
    [key],
    {
      revalidate: Math.min(revalidate, 60), // Максимум 60 секунд!
      tags: tags || [],
    }
  );

  return cachedFn();
}

/**
 * Инвалидировать кеш по ключу и/или по тегам
 *
 * @param keys - ключи кеша для инвалидации
 * @param tags - теги для инвалидации (revalidateTag) — сбрасывает все закешированные ответы с этим тегом
 */
export function invalidateCache(keys: string[], tags?: string[]): void {
  if (keys.length) {
    keys.forEach((key) => cacheInvalidationKeys.add(key));
  }
  if (tags?.length) {
    tags.forEach((tag) => revalidateTag(tag));
  }
}

/**
 * Инвалидировать кеш по тегам (для Next.js cache tags)
 * 
 * @param tags - теги для инвалидации
 */
export async function invalidateCacheByTags(tags: string[]): Promise<void> {
  tags.forEach((tag) => {
    cacheInvalidationKeys.add(`tag:${tag}`);
  });
}

/**
 * Генераторы ключей кеша для разных endpoints
 */
/** Теги для групповой инвалидации кеша (revalidateTag) */
export const cacheTags = {
  apartmentsList: 'apartments-list',
} as const;

export const cacheKeys = {
  dashboard: {
    summary: 'dashboard:summary',
    financial: 'dashboard:financial',
    timeline: 'dashboard:timeline',
  },
  districts: 'districts',
  buildings: (districtId?: number) => 
    districtId ? `buildings:district:${districtId}` : 'buildings:all',
  apartments: (buildingId?: number, status?: string) => {
    if (buildingId && status) {
      return `apartments:building:${buildingId}:status:${status}`;
    }
    if (buildingId) {
      return `apartments:building:${buildingId}`;
    }
    if (status) {
      return `apartments:status:${status}`;
    }
    return 'apartments:all';
  },
  /** Ключ для кеша списка квартир (GET /api/apartments) по параметрам запроса */
  apartmentsList: (params: {
    buildingId?: number;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    const b = params.buildingId ?? 'all';
    const s = params.status ?? 'all';
    const q = params.search?.trim() ?? '';
    const p = params.page ?? 1;
    const l = params.limit ?? 21;
    const sort = params.sortBy ?? 'apartmentNo';
    const order = params.sortOrder ?? 'asc';
    return `apartments:list:${b}:${s}:${q}:${p}:${l}:${sort}:${order}`;
  },
};
