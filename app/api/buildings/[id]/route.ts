import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { buildingService } from '@/services/building.service';
import { updateBuildingSchema } from '@/lib/validations';
import { invalidateCache, cacheKeys } from '@/lib/cache';
import { handleRouteError, zodErrorResponse } from '@/lib/apiErrorResponse';
import { z } from 'zod';

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
        { error: 'Invalid building ID' },
        { status: 400 }
      );
    }

    const building = await buildingService.getById(id);

    if (!building) {
      return NextResponse.json(
        { error: 'Building not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(building);
  } catch (error) {
    return handleRouteError(request, '[API] Error fetching building', error);
  }
}

export async function PUT(
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
        { error: 'Invalid building ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateBuildingSchema.parse(body);

    const building = await buildingService.update(id, validatedData);
    
    // Инвалидируем кеш при обновлении building
    invalidateCache([
      cacheKeys.buildings(),
      cacheKeys.buildings(building.districtId),
      cacheKeys.districts
    ]);
    
    return NextResponse.json(building);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return zodErrorResponse(request, error);
    }

    if (error instanceof Error) {
      if (error.message.includes('не найден')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Здание с таким slug уже существует в этом районе' },
          { status: 409 }
        );
      }
    }

    return handleRouteError(request, '[API] Error updating building', error);
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
        { error: 'Invalid building ID' },
        { status: 400 }
      );
    }

    // Получаем building перед удалением для инвалидации кеша
    const building = await buildingService.getById(id);
    
    await buildingService.delete(id);
    
    // Инвалидируем кеш при удалении building
    if (building) {
      invalidateCache([
        cacheKeys.buildings(),
        cacheKeys.buildings(building.districtId),
        cacheKeys.districts
      ]);
    }
    
    return NextResponse.json({ message: 'Building deleted' }, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('квартир')) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }

    return handleRouteError(request, '[API] Error deleting building', error);
  }
}
