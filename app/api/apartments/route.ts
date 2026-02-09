import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { apartmentService } from '@/services/apartment.service';
import { createApartmentSchema } from '@/lib/validations';
import { getCachedData, invalidateCache, cacheKeys, cacheTags } from '@/lib/cache';
import { z } from 'zod';

const CACHE_REVALIDATE_SEC = 30;

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get('buildingId');
    const status = searchParams.get('status');
    const search = searchParams.get('search') ?? searchParams.get('q') ?? '';
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    const sortBy = searchParams.get('sortBy');
    const sortOrder = searchParams.get('sortOrder');

    const filters = {
      buildingId: buildingId ? parseInt(buildingId) : undefined,
      status: status
        ? (status.toUpperCase() as 'UPCOMING' | 'AVAILABLE' | 'RESERVED' | 'SOLD')
        : undefined,
      search: search.trim() || undefined,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      sortBy: sortBy || undefined,
      sortOrder: (sortOrder as 'asc' | 'desc') || undefined,
    };

    const cacheKey = cacheKeys.apartmentsList({
      buildingId: filters.buildingId,
      status: filters.status,
      search: filters.search,
      page: filters.page,
      limit: filters.limit,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    });

    const result = await getCachedData(
      cacheKey,
      () => apartmentService.getAll(filters),
      CACHE_REVALIDATE_SEC,
      [cacheTags.apartmentsList]
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Error fetching apartments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createApartmentSchema.parse(body);

    const apartment = await apartmentService.create(validatedData);
    
    // Инвалидируем кеш dashboard и списка квартир при создании apartment
    invalidateCache(
      [
        cacheKeys.dashboard.summary,
        cacheKeys.dashboard.financial,
        cacheKeys.dashboard.timeline,
        cacheKeys.buildings(apartment.building.districtId),
      ],
      [cacheTags.apartmentsList]
    );
    
    return NextResponse.json(apartment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('не найдено')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes('уже существует')) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }

    console.error('[API] Error creating apartment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
