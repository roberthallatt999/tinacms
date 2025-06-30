import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const { pathname } = request.nextUrl;

  // Check if this is an admin route
  if (pathname.startsWith('/admin') && pathname !== '/admin-login') {
    // Special handling for admin/index.html - redirect to our auth injector page
    if (pathname === '/admin' || pathname === '/admin/index.html') {
      // Check for authentication token in cookies
      const hasAuthToken = request.cookies.has('tinaAuthToken');
      
      if (!hasAuthToken) {
        // Redirect to login page if no auth token is present
        const loginUrl = new URL('/admin-login', request.url);
        // Store the original URL to redirect back after login
        loginUrl.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(loginUrl);
      } else {
        // If authenticated, redirect to our auth injection page
        const authInjectUrl = new URL('/admin/auth-inject.html', request.url);
        return NextResponse.redirect(authInjectUrl);
      }
    } else {
      // For other admin routes, check auth normally
      const hasAuthToken = request.cookies.has('tinaAuthToken');
      
      if (!hasAuthToken) {
        // Redirect to login page if no auth token is present
        const loginUrl = new URL('/admin-login', request.url);
        // Store the original URL to redirect back after login
        loginUrl.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  // Continue with the request for non-admin routes or authenticated users
  return NextResponse.next();
}

// Configure matcher to only run middleware on admin routes
export const config = {
  matcher: ['/admin/:path*'],
};
