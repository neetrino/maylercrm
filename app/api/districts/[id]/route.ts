import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { districtService } from '@/services/district.service';
import { updateDistrictSchema } from '@/lib/validations';
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
        { error: 'Invalid district ID' },
        { status: 400 }
      );
    }

    const district = await districtService.getById(id);

    if (!district) {
      return NextResponse.json(
        { error: 'District not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(district);
  } catch (error) {
    return handleRouteError(request, '[API] Error fetching district', error);
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
        { error: 'Invalid district ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateDistrictSchema.parse(body);

    const district = await districtService.update(id, validatedData);
    
    // Инвалидируем кеш при обновлении district
    invalidateCache([cacheKeys.districts, cacheKeys.buildings()]);
    
    return NextResponse.json(district);
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

    return handleRouteError(request, '[API] Error updating district', error);
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
        { error: 'Invalid district ID' },
        { status: 400 }
      );
    }

    await districtService.delete(id);
    
    // Инвалидируем кеш при удалении district
    invalidateCache([cacheKeys.districts, cacheKeys.buildings()]);
    
    return NextResponse.json({ message: 'District deleted' }, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('зданий')) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }

    return handleRouteError(request, '[API] Error deleting district', error);
  }
}
