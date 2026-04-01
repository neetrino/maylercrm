import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { apartmentService } from '@/services/apartment.service';
import { updateApartmentSchema } from '@/lib/validations';
import { invalidateCache, cacheKeys, cacheTags } from '@/lib/cache';
import { handleRouteError, zodErrorResponse } from '@/lib/apiErrorResponse';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);

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

    // Кэширование на 30 секунд для оптимизации
    return NextResponse.json(apartment, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    return handleRouteError(request, '[API] Error fetching apartment', error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid apartment ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateApartmentSchema.parse(body);

    // Преобразование данных для Prisma
    const updateData: Prisma.ApartmentUpdateInput = { ...validatedData };

    // Преобразование даты
    if (validatedData.dealDate !== undefined) {
      updateData.dealDate = validatedData.dealDate
        ? new Date(validatedData.dealDate)
        : null;
    }

    // Получаем текущую квартиру для инвалидации кеша
    const currentApartment = await apartmentService.getById(id);
    
    await apartmentService.update(id, updateData);
    
    // Получаем обновленную квартиру в правильном формате с пересчитанными полями
    const updatedApartment = await apartmentService.getById(id);
    
    // Инвалидируем кеш dashboard и списка квартир при обновлении apartment
    invalidateCache(
      [
        cacheKeys.dashboard.summary,
        cacheKeys.dashboard.financial,
        cacheKeys.dashboard.timeline,
      ],
      [cacheTags.apartmentsList]
    );

    // Инвалидируем кеш buildings если изменился district
    if (currentApartment && updatedApartment) {
      const currentDistrictId = currentApartment.district_id;
      const updatedDistrictId = updatedApartment.district_id;
      if (currentDistrictId !== updatedDistrictId) {
        invalidateCache([
          cacheKeys.buildings(currentDistrictId),
          cacheKeys.buildings(updatedDistrictId),
        ]);
      }
    }
    
    return NextResponse.json(updatedApartment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return zodErrorResponse(request, error);
    }

    return handleRouteError(request, '[API] Error updating apartment', error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid apartment ID' },
        { status: 400 }
      );
    }

    // Получаем квартиру перед удалением для инвалидации кеша
    const apartment = await apartmentService.getById(id);
    
    await apartmentService.delete(id);
    
    // Инвалидируем кеш dashboard и списка квартир при удалении apartment
    invalidateCache(
      [
        cacheKeys.dashboard.summary,
        cacheKeys.dashboard.financial,
        cacheKeys.dashboard.timeline,
      ],
      [cacheTags.apartmentsList]
    );

    if (apartment) {
      invalidateCache([cacheKeys.buildings(apartment.district_id)]);
    }
    
    return NextResponse.json({ message: 'Apartment deleted' }, { status: 200 });
  } catch (error) {
    return handleRouteError(request, '[API] Error deleting apartment', error);
  }
}
