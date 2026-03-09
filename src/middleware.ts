import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Server-side middleware to protect private routes.
 * Checks for the existence of the '__session' cookie set during Firebase login.
 */
export function middleware(request: NextRequest) {
  const session = request.cookies.get('__session');
  const { pathname } = request.nextUrl;

  // Define protected routes that require authentication
  const protectedRoutes = [
    '/orders',
    '/checkout',
    '/profile',
    '/wishlist',
    '/cart',
    '/account',
    '/admin'
  ];

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // If trying to access a protected route without a session, redirect to home
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Optimization: Only run middleware on protected paths
export const config = {
  matcher: [
    '/orders/:path*',
    '/checkout/:path*',
    '/profile/:path*',
    '/wishlist/:path*',
    '/cart/:path*',
    '/account/:path*',
    '/admin/:path*'
  ],
};
