import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { getOrCreateRequestId } from '@/lib/requestId';

function rateLimitResponse(request: NextRequest, retryAfterSec: number): NextResponse {
  const requestId = getOrCreateRequestId(request);
  return NextResponse.json(
    { error: 'Too many requests', requestId },
    {
      status: 429,
      headers: {
        'retry-after': String(retryAfterSec),
        'x-request-id': requestId,
      },
    }
  );
}

export default auth(async (req) => {
  const path = req.nextUrl.pathname;

  const ip = getClientIp(req);

  if (path.startsWith('/api/external/')) {
    const { success, retryAfterSec } = await checkRateLimit(ip, 'external');
    if (!success) {
      return rateLimitResponse(req, retryAfterSec);
    }
  }

  if (path.startsWith('/api/landing/')) {
    const { success, retryAfterSec } = await checkRateLimit(ip, 'landing');
    if (!success) {
      return rateLimitResponse(req, retryAfterSec);
    }
  }

  if (path.startsWith('/api/auth/')) {
    const { success, retryAfterSec } = await checkRateLimit(ip, 'auth');
    if (!success) {
      return rateLimitResponse(req, retryAfterSec);
    }
    return NextResponse.next();
  }

  const session = req.auth;

  // Allow access to login page
  if (path === '/login') {
    if (session) {
      return NextResponse.redirect(new URL('/apartments', req.url));
    }
    return NextResponse.next();
  }

  // Public landing pages: no account needed, access by link only
  if (path.startsWith('/l/')) {
    return NextResponse.next();
  }

  // Public API for landing data (used by /l/[token] page, no auth)
  if (path.startsWith('/api/landing/')) {
    return NextResponse.next();
  }

  // Allow API routes with Bearer Token (they handle auth themselves)
  if (path.startsWith('/api/')) {
    const authHeader = req.headers.get('authorization');
    const apiToken = process.env.API_TOKEN;

    // If Bearer Token is present, let API route handle authentication
    if (authHeader && authHeader.startsWith('Bearer ') && apiToken) {
      return NextResponse.next();
    }

    // For API routes without Bearer Token, check session
    if (!session) {
      const requestId = getOrCreateRequestId(req);
      return NextResponse.json(
        { error: 'Unauthorized', requestId },
        { status: 401, headers: { 'x-request-id': requestId } }
      );
    }

    return NextResponse.next();
  }

  // Require authentication for all other pages
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Admin routes protection
  if (path.startsWith('/admin') && session.user.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/apartments', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
