import { NextRequest, NextResponse } from 'next/server';
import { apartmentService } from '@/services/apartment.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const id = parseInt(params.id);

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

    // Формат для внешнего API (как в спецификации)
    return NextResponse.json({
      id: apartment.id,
      apartment_no: apartment.apartmentNo,
      apartment_type: apartment.apartmentType,
      floor: apartment.floor,
      status: apartment.status.toLowerCase(),
      sqm: apartment.sqm,
      price_sqm: apartment.price_sqm,
      total_price: apartment.total_price,
      total_paid: apartment.total_paid,
      balance: apartment.balance,
      deal_date: apartment.dealDate
        ? new Date(apartment.dealDate).toISOString().split('T')[0]
        : null,
      ownership_name: apartment.ownershipName,
      email: apartment.email,
      passport_tax_no: apartment.passportTaxNo,
      phone: apartment.phone,
      sales_type: apartment.salesType ? apartment.salesType.toLowerCase() : 'unsold',
      deal_description: apartment.dealDescription,
      matter_link: apartment.matterLink,
      floorplan_distribution: apartment.floorplanDistribution,
      exterior_link: apartment.exteriorLink,
      exterior_link2: apartment.exteriorLink2,
      building_id: apartment.buildingId,
      building_slug: apartment.building.slug,
      building_name: apartment.building.name,
      district_id: apartment.building.district.id,
      district_slug: apartment.building.district.slug,
      district_name: apartment.building.district.name,
      attachments: apartment.attachments.map((att) => ({
        id: att.id,
        fileType: att.fileType,
        fileUrl: att.fileUrl,
        fileName: att.fileName,
        fileSize: att.fileSize,
        md5Hash: att.md5Hash,
        createdAt: att.createdAt.toISOString(),
      })),
      created_at: apartment.createdAt.toISOString(),
      updated_at: apartment.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('[API] Error fetching apartment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
