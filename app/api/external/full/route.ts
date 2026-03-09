import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const apiToken = process.env.API_TOKEN;

    if (!authHeader || !apiToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    if (token !== apiToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const districts = await prisma.district.findMany({
      orderBy: { name: 'asc' },
      include: {
        buildings: {
          orderBy: { name: 'asc' },
          include: {
            apartments: {
              orderBy: { apartmentNo: 'asc' },
              include: {
                attachments: true,
              },
            },
          },
        },
      },
    });

    let totalApartments = 0;
    const districtsData = districts.map((district) => ({
      id: district.id,
      slug: district.slug,
      name: district.name,
      buildings: district.buildings.map((building) => {
        const apartments = building.apartments.map((apartment) => {
          totalApartments++;
          const sqm = apartment.sqm ? Number(apartment.sqm) : null;
          const priceSqm = apartment.priceSqm ? Number(apartment.priceSqm) : null;
          const totalPaid = apartment.totalPaid ? Number(apartment.totalPaid) : null;
          const totalPrice =
            sqm && priceSqm ? sqm * priceSqm : null;
          const balance =
            totalPrice !== null && totalPaid !== null
              ? totalPrice - totalPaid
              : totalPrice;

          return {
            id: apartment.id,
            apartment_no: apartment.apartmentNo,
            apartment_type: apartment.apartmentType,
            floor: apartment.floor,
            status: apartment.status.toLowerCase(),
            sqm,
            price_sqm: priceSqm,
            total_price: totalPrice,
            total_paid: totalPaid,
            balance,
            deal_date: apartment.dealDate
              ? apartment.dealDate.toISOString().split('T')[0]
              : null,
            ownership_name: apartment.ownershipName,
            email: apartment.email,
            passport_tax_no: apartment.passportTaxNo,
            phone: apartment.phone,
            sales_type: apartment.salesType
              ? apartment.salesType.toLowerCase()
              : 'unsold',
            deal_description: apartment.dealDescription,
            matter_link: apartment.matterLink,
            floorplan_distribution: apartment.floorplanDistribution,
            exterior_link: apartment.exteriorLink,
            exterior_link2: apartment.exteriorLink2,
            building_id: building.id,
            building_slug: building.slug,
            building_name: building.name,
            district_id: district.id,
            district_slug: district.slug,
            district_name: district.name,
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
          };
        });

        return {
          id: building.id,
          district_id: district.id,
          name: building.name,
          slug: building.slug,
          apartments,
        };
      }),
    }));

    const response = NextResponse.json({
      districts: districtsData,
      meta: {
        generated_at: new Date().toISOString(),
        total_districts: districts.length,
        total_buildings: districts.reduce((s, d) => s + d.buildings.length, 0),
        total_apartments: totalApartments,
      },
    });

    response.headers.set(
      'Cache-Control',
      'public, max-age=60, s-maxage=120'
    );

    return response;
  } catch (error) {
    console.error('[API] Error fetching full external data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
