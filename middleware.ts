import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default auth((req) => {
  const session = req.auth;
  const path = req.nextUrl.pathname;

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
