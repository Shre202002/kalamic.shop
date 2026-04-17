/**
 * @fileOverview DEPRECATED dynamic sitemap route.
 * Replaced by static generation via next-sitemap to resolve 403 access issues.
 * This file is kept as a placeholder to prevent route matching conflicts.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  // Return a 404 to allow the static public/sitemap.xml to be served by the host
  return new NextResponse(null, { status: 404 });
}
