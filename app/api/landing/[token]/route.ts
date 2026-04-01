import { NextRequest, NextResponse } from 'next/server';
import { apartmentService } from '@/services/apartment.service';
import { handleRouteError } from '@/lib/apiErrorResponse';

/** Public API: get apartment by landing token. No auth — only link holders can access. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token: tokenParam } = await params;
    const token = tokenParam?.trim();
    if (!token) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const apartment = await apartmentService.getByLandingToken(token);
    if (!apartment) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(apartment, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    return handleRouteError(_request, '[API] Error fetching landing apartment', error);
  }
}
