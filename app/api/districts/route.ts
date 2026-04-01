import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { districtService } from '@/services/district.service';
import { createDistrictSchema } from '@/lib/validations';
import { getCachedData, cacheKeys, invalidateCache } from '@/lib/cache';
import { handleRouteError, zodErrorResponse } from '@/lib/apiErrorResponse';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    // Проверка для внешнего API (Bearer Token) или внутреннего (Session)
    const authHeader = request.headers.get('authorization');
    const apiToken = process.env.API_TOKEN;

    if (authHeader && apiToken) {
      // Внешний API через Bearer Token - НЕ используем кеш, всегда свежие данные!
      const token = authHeader.replace('Bearer ', '');
      if (token !== apiToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      // Для внешнего API - всегда свежие данные без кеша
      const districts = await districtService.getAll();
      const formatted = districts.map((d) => ({
        id: d.id,
        slug: d.slug,
        name: d.name,
        created_at: d.createdAt.toISOString(),
        updated_at: d.updatedAt.toISOString(),
      }));
      return NextResponse.json({ data: formatted });
    } else {
      // Внутренний API через Session - используем короткий кеш (60 секунд)
      const session = await auth();
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Кеш на 60 секунд - очень короткий для актуальности данных
      const districts = await getCachedData(
        cacheKeys.districts,
        () => districtService.getAll(),
        60, // 60 секунд (1 минута)
        ['districts']
      );
      
      return NextResponse.json(districts);
    }
  } catch (error) {
    return handleRouteError(request, '[API] Error fetching districts', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createDistrictSchema.parse(body);

    const district = await districtService.create(validatedData);
    
    // Инвалидируем кеш при создании district
    invalidateCache([cacheKeys.districts, cacheKeys.buildings()]);
    
    return NextResponse.json(district, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return zodErrorResponse(request, error);
    }

    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Район с таким slug уже существует' },
        { status: 409 }
      );
    }

    return handleRouteError(request, '[API] Error creating district', error);
  }
}
