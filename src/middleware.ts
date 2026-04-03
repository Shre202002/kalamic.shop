
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Server-side middleware to protect private routes and secure API endpoints.
 * Enforces session verification for admin and protected user actions.
 */
export async function middleware(request: NextRequest) {
  const session = request.cookies.get('__session')?.value;
  const { pathname } = request.nextUrl;

  // 1. ADMIN API PROTECTION
  if (pathname.startsWith('/api/admin')) {
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Deep verification of admin role would happen here using admin SDK
    // For this prototype, we rely on the session presence and subsequent API-level checks
  }

  // 2. USER API PROTECTION (Checkout/Orders)
  const protectedApiRoutes = ['/api/checkout', '/api/orders'];
  if (protectedApiRoutes.some(r => pathname.startsWith(r))) {
    if (!session) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }
  }

  // 3. PAGE ROUTE PROTECTION
  const protectedPages = [
    '/admin',
    '/checkout',
    '/orders',
    '/profile',
    '/wishlist',
  ];

  // Specific exclusion for success page to allow auth to initialize on the client
  if (pathname.startsWith('/checkout/success')) {
    return NextResponse.next();
  }

  const isProtectedPage = protectedPages.some(route => pathname.startsWith(route));

  if (isProtectedPage && !session) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/admin/:path*',
    '/api/checkout/:path*',
    '/api/orders/:path*',
    '/admin/:path*',
    '/checkout/:path*',
    '/orders/:path*',
    '/profile/:path*',
    '/wishlist/:path*',
    '/checkout/success',
  ],
};
