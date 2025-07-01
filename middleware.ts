import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const { pathname } = request.nextUrl;
  
  // Skip middleware for admin-bridge and any admin paths with query parameters
  // to prevent potential redirection loops
  if (pathname === '/admin-bridge' || request.nextUrl.search.includes('auth_complete=true')) {
    return NextResponse.next();
  }
  
  // Check if this is an admin route that needs protection
  if (pathname.startsWith('/admin') && pathname !== '/admin-login') {
    // Check for authentication token in cookies
    const hasAuthToken = request.cookies.has('tinaAuthToken');
    
    if (!hasAuthToken) {
      // Redirect to login page if no auth token is present
      const loginUrl = new URL('/admin-login', request.url);
      // Store the original URL to redirect back after login
      loginUrl.searchParams.set('redirectTo', encodeURIComponent(pathname));
      return NextResponse.redirect(loginUrl);
    }
    
    // For authenticated users, continue without additional redirections
    return NextResponse.next();
  }
  
  // Continue with the request for non-admin routes
  return NextResponse.next();
}

// Configure matcher to only run middleware on admin routes
export const config = {
  matcher: ['/admin/:path*'],
};
