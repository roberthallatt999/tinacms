import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const { pathname } = request.nextUrl;

  // Check if this is an admin route
  if (pathname.startsWith('/admin') && pathname !== '/admin-login') {
    // Check for authentication token in cookies
    // Note: In a production app, you would verify this token
    const hasAuthToken = request.cookies.has('tinaAuthToken');
    
    if (!hasAuthToken) {
      // Redirect to login page if no auth token is present
      const loginUrl = new URL('/admin-login', request.url);
      // Store the original URL to redirect back after login
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Continue with the request for non-admin routes or authenticated users
  return NextResponse.next();
}

// Configure matcher to only run middleware on admin routes
export const config = {
  matcher: ['/admin/:path*'],
};
