import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { buildingService } from '@/services/building.service';
import { createBuildingSchema } from '@/lib/validations';
import { cacheKeys, invalidateCache } from '@/lib/cache';
import { handleRouteError, zodErrorResponse } from '@/lib/apiErrorResponse';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const districtId = searchParams.get('districtId');
    const parsedDistrictId = districtId ? parseInt(districtId) : undefined;

    const buildings = await buildingService.getAll(parsedDistrictId);
    return NextResponse.json(buildings);
  } catch (error) {
    return handleRouteError(request, '[API] Error fetching buildings', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createBuildingSchema.parse(body);

    const building = await buildingService.create(validatedData);
    
    // Инвалидируем кеш при создании building
    invalidateCache([
      cacheKeys.buildings(),
      cacheKeys.buildings(building.districtId),
      cacheKeys.districts
    ]);
    
    return NextResponse.json(building, { status: 201 });
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

    return handleRouteError(request, '[API] Error creating building', error);
  }
}
