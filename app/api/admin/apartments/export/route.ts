import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { handleRouteError } from '@/lib/apiErrorResponse';
import { prisma } from '@/lib/prisma';
import { buildApartmentsExportXlsxBuffer } from '@/lib/apartmentsFullExport';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const apartments = await prisma.apartment.findMany({
      orderBy: { id: 'asc' },
      include: {
        building: {
          include: { district: true },
        },
      },
    });

    const buffer = buildApartmentsExportXlsxBuffer(apartments);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `apartments-export-${dateStr}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return handleRouteError(request, '[API] admin apartments export', error);
  }
}
