import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected paths that require authentication
const PROTECTED_PATHS = ['/admin', '/admin-auth-bridge'];

export function middleware(request: NextRequest) {
  const { pathname } = new URL(request.url);
  
  // IMPORTANT: Check if we're in development or if TINA_PUBLIC_IS_LOCAL is true
  // If so, bypass all authentication checks
  const isDev = process.env.NODE_ENV !== 'production';
  const isLocalTina = process.env.TINA_PUBLIC_IS_LOCAL === 'true';
  
  if (isDev || isLocalTina) {
    // In development, bypass all auth checks
    console.log('[Middleware] Bypassing auth checks in development mode');
    return NextResponse.next();
  }
  
  // Skip middleware for API routes and static assets
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.') // Static files like .js, .css, etc.
  ) {
    return NextResponse.next();
  }

  // Check if this is a protected path
  const isProtectedPath = PROTECTED_PATHS.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );
  
  // Special handling for /admin path
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    // Check for TinaCMS auth in either cookie or authStatus cookie
    const hasTinaAuthToken = request.cookies.get('tinaAuthToken') !== undefined;
    const hasTinaAuthStatus = request.cookies.get('tinaAuthStatus') !== undefined;
    const isAuthenticated = hasTinaAuthToken || hasTinaAuthStatus;
    
    if (isAuthenticated) {
      // For direct access to admin/index.html, don't redirect, just pass through
      if (pathname === '/admin/index.html') {
        const response = NextResponse.next();
        // Add authorization header directly for TinaCMS API requests
        const token = request.cookies.get('tinaAuthToken')?.value;
        if (token) {
          response.headers.set('X-TinaCMS-Token', token); // Custom header that our script can use
        }
        return response;
      }
      
      // For the root admin path, always redirect to admin/index.html directly
      if (pathname === '/admin') {
        return NextResponse.redirect(new URL('/admin/index.html', request.url));
      }
      
      // For other admin paths, proceed normally
      return NextResponse.next();
    } else {
      // If not authenticated, redirect to auth bridge
      return NextResponse.redirect(new URL('/admin-auth-bridge', request.url));
    }
  }
  
  // Handle other protected paths
  if (isProtectedPath) {
    // Check for TinaCMS auth in either cookie
    const hasTinaAuthToken = request.cookies.get('tinaAuthToken') !== undefined;
    const hasTinaAuthStatus = request.cookies.get('tinaAuthStatus') !== undefined;
    const isAuthenticated = hasTinaAuthToken || hasTinaAuthStatus;
    
    if (!isAuthenticated && pathname !== '/admin-auth-bridge') {
      // Redirect to auth bridge if not authenticated
      return NextResponse.redirect(new URL('/admin-auth-bridge', request.url));
    }
  }

  return NextResponse.next();
}

// Configure matcher to only run middleware on admin routes
export const config = {
  matcher: ['/admin/:path*'],
};
