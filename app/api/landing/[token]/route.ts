import { NextRequest, NextResponse } from 'next/server';
import { apartmentService } from '@/services/apartment.service';

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
    console.error('[API] Error fetching landing apartment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
