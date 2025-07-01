import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const { pathname } = request.nextUrl;
  
  // TEMPORARY DEBUGGING FIX:
  // Skip all admin-related routes to stop redirection loops
  if (pathname.startsWith('/admin')) {
    console.log('Skipping middleware for admin route:', pathname);
    return NextResponse.next();
  }
  
  // Other routes that still need protection (if any)
  // Add your custom middleware logic here if needed
}

// Configure matcher to only run middleware on admin routes
export const config = {
  matcher: ['/admin/:path*'],
};
