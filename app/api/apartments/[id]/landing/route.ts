import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { apartmentService } from '@/services/apartment.service';
import { handleRouteError } from '@/lib/apiErrorResponse';

/** Generate or return landing token and full URL for the apartment. Requires auth. */
export async function POST(
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

    // Use canonical public URL so landing links are short and stable (e.g. https://maylercrm.neetrino.com).
    // Set NEXT_PUBLIC_APP_URL in Vercel to your custom domain to avoid deployment-specific vercel.app URLs.
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || request.nextUrl.origin.replace(/\/$/, '');
    const landingUrl = `${baseUrl}/l/${token}`;

    return NextResponse.json({ url: landingUrl, token });
  } catch (error) {
    return handleRouteError(request, '[API] Error ensuring landing token', error);
  }
}
