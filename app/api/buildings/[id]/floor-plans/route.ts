import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { buildingService } from '@/services/building.service';
import { putObject } from '@/lib/r2';
import { invalidateCache, cacheKeys } from '@/lib/cache';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const buildingId = parseInt(params.id);
    if (isNaN(buildingId)) {
      return NextResponse.json({ error: 'Invalid building ID' }, { status: 400 });
    }

    const building = await buildingService.getById(buildingId);
    if (!building) {
      return NextResponse.json({ error: 'Building not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const floorStr = formData.get('floor') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    const floor = floorStr ? parseInt(floorStr, 10) : NaN;
    if (isNaN(floor) || floor < 1) {
      return NextResponse.json({ error: 'Valid floor number (≥1) is required' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP, PDF' },
        { status: 400 }
      );
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const key = `buildings/${buildingId}/floor-${floor}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const { url: fileUrl } = await putObject(key, buffer, file.type);

    await buildingService.createFloorPlan(buildingId, floor, fileUrl, file.name);

    invalidateCache([
      cacheKeys.buildings(),
      cacheKeys.buildings(building.districtId),
    ]);

    return NextResponse.json({
      floor,
      fileUrl,
      fileName: file.name,
    });
  } catch (error) {
    console.error('[API] Error uploading building floor plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const buildingId = parseInt(params.id);
    if (isNaN(buildingId)) {
      return NextResponse.json({ error: 'Invalid building ID' }, { status: 400 });
    }

    const building = await buildingService.getById(buildingId);
    if (!building) {
      return NextResponse.json({ error: 'Building not found' }, { status: 404 });
    }

    return NextResponse.json(building.floorPlans || []);
  } catch (error) {
    console.error('[API] Error fetching building floor plans:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
