import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const { pathname } = request.nextUrl;
  
  // Skip middleware for admin-bridge to prevent redirection loops
  if (pathname === '/admin-bridge') {
    return NextResponse.next();
  }

  // Check if this is an admin route
  if (pathname.startsWith('/admin') && pathname !== '/admin-login') {
    // Special handling for admin root and admin/index.html
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
        // If authenticated, redirect to our Next.js auth bridge
        // Add a special query parameter to indicate this is from middleware
        // to help prevent redirection loops
        const authBridgeUrl = new URL('/admin-bridge', request.url);
        authBridgeUrl.searchParams.set('from', 'middleware');
        return NextResponse.redirect(authBridgeUrl);
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
