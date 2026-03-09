import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { buildingService } from '@/services/building.service';
import { createBuildingSchema } from '@/lib/validations';
import { cacheKeys, invalidateCache } from '@/lib/cache';
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
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : undefined;
    console.error('[API] Error fetching buildings:', message, stack);
    return NextResponse.json(
      { error: 'Internal server error', detail: message },
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
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
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

    console.error('[API] Error creating building:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
