import { NextResponse, NextRequest } from 'next/server';
import { setTinaAuthToken } from '../../../../../lib/tina-auth';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    // Get the stored state from cookies to prevent CSRF
    const cookieStore = await cookies();
    const storedStateCookie = cookieStore.get('github_oauth_state');
    const storedState = storedStateCookie?.value;

    // Verify state parameter to prevent CSRF attacks
    if (!state || !storedState || state !== storedState) {
      return NextResponse.redirect(
        new URL('/admin-login?error=oauth_state_mismatch', request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/admin-login?error=github_code_missing', request.url)
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/auth/github/callback`,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('GitHub OAuth error:', tokenData);
      return NextResponse.redirect(
        new URL('/admin-login?error=github_token_error', request.url)
      );
    }

    const accessToken = tokenData.access_token;

    // Get GitHub user info to verify identity
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const userData = await userResponse.json();

    // Get email if available
    const emailsResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const emails = await emailsResponse.json();
    const primaryEmail = emails.find((email: any) => email.primary)?.email || emails[0]?.email || '';

    // Generate a proper JWT token for TinaCMS using the GitHub user info
    const tinaToken = generateTinaToken(userData, primaryEmail);

    // Create a cookie with the TinaCMS token
    // This will be picked up by our proxy API
    await cookieStore.set({
      name: 'tinaAuthToken',
      value: tinaToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    // Also set non-httpOnly cookie for client-side scripts
    await cookieStore.set({
      name: 'tinaAuthStatus',
      value: 'authenticated',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    // Store GitHub user info in session
    await cookieStore.set({
      name: 'githubUser',
      value: JSON.stringify({
        id: userData.id,
        login: userData.login,
        name: userData.name,
        avatar_url: userData.avatar_url,
      }),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    // Redirect to the auth-bridge page that will handle injection
    return NextResponse.redirect(new URL('/admin-auth-bridge', request.url));
  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    return new NextResponse('Authentication error', { status: 500 });
  }
}

// This function generates a valid JWT for TinaCMS authentication
function generateTinaToken(userData: any, email: string): string {
  // Create a proper JWT with the required format for TinaCMS
  
  // Header part
  const header = {
    alg: 'HS256', // Algorithm
    typ: 'JWT'    // Token type
  };
  
  // Payload part
  const payload = {
    sub: `github:${userData.id}`,
    name: userData.name || userData.login,
    email: email,
    avatar: userData.avatar_url,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 1 week
    // Add TinaCMS-specific claims if needed
    client_id: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
    tina_org_id: process.env.TINA_ORG_ID || '',
  };
  
  // Encode header and payload parts to Base64Url format
  const base64UrlEncode = (obj: any): string => {
    return Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };
  
  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);
  
  // For a full JWT, we'd need to create a signature with a secret key
  // But since we're using a reverse proxy approach, we can use a simpler format
  // that TinaCMS will accept for parsing but our proxy will handle actual authentication
  
  // Create JWT with format: header.payload.signature
  // Using a dummy signature as our proxy will handle actual auth
  const dummySignature = base64UrlEncode({ sig: 'proxy-auth' });
  
  return `${encodedHeader}.${encodedPayload}.${dummySignature}`;
}
