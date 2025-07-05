import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware intentionally does nothing to allow default TinaCMS auth to work
export function middleware(request: NextRequest) {
  // Always proceed to let TinaCMS handle its own authentication
  return NextResponse.next();
}

// Configure matcher to run middleware only on admin routes
export const config = {
  matcher: ['/admin/:path*'],
};
