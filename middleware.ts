import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected paths that require authentication
const PROTECTED_PATHS = ['/admin', '/admin-auth-bridge'];

export function middleware(request: NextRequest) {
  const { pathname } = new URL(request.url);
  
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
    // If user is authenticated, let them proceed but inject our script
    const isAuthenticated = request.cookies.get('tinaAuthStatus') !== null;
    
    if (isAuthenticated) {
      // For the root admin path, always redirect to admin-auth-bridge to ensure script injection
      if (pathname === '/admin' || pathname === '/admin/index.html') {
        // Avoid redirect loop by checking if coming from bridge
        const fromBridge = new URL(request.url).searchParams.get('from') === 'bridge';
        if (!fromBridge) {
          return NextResponse.redirect(new URL('/admin-auth-bridge', request.url));
        }
        // If coming from bridge, add script injection via response headers
        const response = NextResponse.next();
        response.headers.set(
          'Link', 
          '</admin/proxy-intercept.js>; rel="preload"; as="script"'
        );
        return response;
      }
      
      // For other admin paths, proceed normally with script injection
      const response = NextResponse.next();
      response.headers.set(
        'Link', 
        '</admin/proxy-intercept.js>; rel="preload"; as="script"'
      );
      return response;
    } else {
      // If not authenticated, redirect to login
      return NextResponse.redirect(new URL('/admin-login', request.url));
    }
  }
  
  // Handle other protected paths
  if (isProtectedPath) {
    const isAuthenticated = request.cookies.get('tinaAuthStatus') !== null;
    
    if (!isAuthenticated && pathname !== '/admin-login') {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL('/admin-login', request.url));
    }
  }
  
  // Special case for admin-bridge to avoid redirect loops
  if (pathname === '/admin-auth-bridge') {
    // If already authenticated, proceed
    const isAuthenticated = request.cookies.get('tinaAuthStatus') !== null;
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/admin-login', request.url));
    }
    
    return NextResponse.next();
  }

  return NextResponse.next();
}

// Configure matcher to only run middleware on admin routes
export const config = {
  matcher: ['/admin/:path*'],
};
