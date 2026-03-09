import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { buildingService } from '@/services/building.service';
import { invalidateCache, cacheKeys } from '@/lib/cache';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; floor: string } }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const buildingId = parseInt(params.id);
    const floor = parseInt(params.floor, 10);

    if (isNaN(buildingId) || isNaN(floor)) {
      return NextResponse.json({ error: 'Invalid building or floor' }, { status: 400 });
    }

    const building = await buildingService.getById(buildingId);
    if (!building) {
      return NextResponse.json({ error: 'Building not found' }, { status: 404 });
    }

    await buildingService.deleteFloorPlan(buildingId, floor);

    invalidateCache([
      cacheKeys.buildings(),
      cacheKeys.buildings(building.districtId),
    ]);

    return NextResponse.json({ message: 'Floor plan deleted' });
  } catch (error) {
    console.error('[API] Error deleting building floor plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
