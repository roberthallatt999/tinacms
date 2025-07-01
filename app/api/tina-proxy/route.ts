import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API route that acts as a reverse proxy for TinaCMS admin requests
 * This allows us to intercept and modify requests/responses to inject authentication
 */
export async function GET(request: NextRequest) {
  return handleProxyRequest(request);
}

export async function POST(request: NextRequest) {
  return handleProxyRequest(request);
}

export async function PUT(request: NextRequest) {
  return handleProxyRequest(request);
}

export async function DELETE(request: NextRequest) {
  return handleProxyRequest(request);
}

export async function PATCH(request: NextRequest) {
  return handleProxyRequest(request);
}

/**
 * Handle proxy request for any HTTP method
 */
async function handleProxyRequest(request: NextRequest) {
  try {
    // Get auth token from cookie
    const cookieStore = await cookies();
    const authTokenCookie = cookieStore.get('tinaAuthToken');
    const authToken = authTokenCookie?.value;
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse the request URL to determine the target URL
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/tina-proxy', '');
    
    // The base TinaCMS API URL
    const targetBaseUrl = 'https://content.tinajs.io';
    const targetUrl = `${targetBaseUrl}${path}${url.search}`;
    
    // Clone headers to a standard object
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      // Skip host header to avoid conflicts
      if (key !== 'host') {
        headers[key] = value;
      }
    });
    
    // Add authentication headers
    headers['Authorization'] = `Bearer ${authToken}`;
    headers['X-Client-ID'] = process.env.NEXT_PUBLIC_TINA_CLIENT_ID || '';
    
    // Forward the request to the target URL with modified headers
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.blob(),
      redirect: 'follow',
    });
    
    // Get response body based on content type
    const contentType = response.headers.get('content-type') || '';
    let body;
    
    if (contentType.includes('application/json')) {
      // If it's JSON, we can modify it if needed
      const jsonData = await response.json();
      body = JSON.stringify(jsonData);
    } else {
      // Otherwise, pass through as is
      body = await response.blob();
    }
    
    // Create a new response with the original status and headers
    const proxyResponse = new NextResponse(body, {
      status: response.status,
      statusText: response.statusText,
    });
    
    // Copy response headers
    response.headers.forEach((value, key) => {
      // Skip content-encoding as we're handling the body directly
      if (key !== 'content-encoding') {
        proxyResponse.headers.set(key, value);
      }
    });
    
    return proxyResponse;
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Proxy error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
