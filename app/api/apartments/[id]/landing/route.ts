import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { apartmentService } from '@/services/apartment.service';

/** Generate or return landing token and full URL for the apartment. Requires auth. */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid apartment ID' },
        { status: 400 }
      );
    }

    const token = await apartmentService.ensureLandingToken(id);
    if (!token) {
      return NextResponse.json(
        { error: 'Apartment not found' },
        { status: 404 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : request.nextUrl.origin;
    const landingUrl = `${baseUrl.replace(/\/$/, '')}/l/${token}`;

    return NextResponse.json({ url: landingUrl, token });
  } catch (error) {
    console.error('[API] Error ensuring landing token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
