import { NextRequest, NextResponse } from 'next/server';
import { buildingService } from '@/services/building.service';
import { apartmentService } from '@/services/apartment.service';
import { handleRouteError } from '@/lib/apiErrorResponse';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Проверка Bearer Token для внешнего API
    const authHeader = request.headers.get('authorization');
    const apiToken = process.env.API_TOKEN;

    if (!authHeader || !apiToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    if (token !== apiToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    // Согласно спецификации: GET /api/buildings/{building_slug}/apartments
    // Временное решение: ищем здание по slug во всех районах
    const allBuildings = await buildingService.getAll();
    const building = allBuildings.find((b) => b.slug === slug);

    if (!building) {
      return NextResponse.json(
        { error: 'Building not found' },
        { status: 404 }
      );
    }

    // Получаем параметры пагинации
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    const result = await apartmentService.getAll({
      buildingId: building.id,
      status: status
        ? (status.toUpperCase() as 'UPCOMING' | 'AVAILABLE' | 'RESERVED' | 'SOLD')
        : undefined,
      page,
      limit,
    });

    // Формат для внешнего API (с данными сделки)
    // Включаем все поля, как в apartment show
    const items = result.items.map((apt) => ({
      id: apt.id,
      apartment_no: apt.apartmentNo,
      apartment_name: apt.apartmentName,
      apartment_type: apt.apartmentType,
      floor: apt.floor,
      status: apt.status.toLowerCase(),
      sqm: apt.sqm,
      price_sqm: apt.price_sqm,
      total_price: apt.total_price,
      total_paid: apt.total_paid,
      balance: apt.balance,
      deal_date: apt.deal_date
        ? new Date(apt.deal_date).toISOString().split('T')[0]
        : null,
      ownership_name: apt.ownership_name,
      email: apt.email,
      passport_tax_no: apt.passport_tax_no,
      phone: apt.phone,
      sales_type: apt.sales_type ? apt.sales_type.toLowerCase() : 'unsold',
      deal_description: apt.deal_description,
      matter_link: apt.matter_link,
      floorplan_distribution: apt.floorplan_distribution,
      exterior_link: apt.exterior_link,
      exterior_link2: apt.exterior_link2,
      building_id: apt.building.id,
      building_slug: apt.building.slug,
      building_name: apt.building.name,
      district_id: apt.building.district.id,
      district_slug: apt.building.district.slug,
      district_name: apt.building.district.name,
      attachments: apt.attachments.map((att) => ({
        id: att.id,
        fileType: att.fileType,
        fileUrl: att.fileUrl,
        fileName: att.fileName,
        fileSize: att.fileSize,
        md5Hash: att.md5Hash,
        createdAt: att.createdAt.toISOString(),
      })),
      created_at: apt.createdAt.toISOString(),
      updated_at: apt.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      data: {
        items,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    return handleRouteError(request, '[API] Error fetching apartments by building slug', error);
  }
}
