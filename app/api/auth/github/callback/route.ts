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

    // Generate or fetch your TinaCMS auth token using the GitHub user info
    // Here, we're using GitHub token directly as our TinaCMS token for simplicity
    // In a real implementation, you might want to exchange this for a proper TinaCMS token
    const tinaToken = accessToken;

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

// This is a placeholder function - in a real app, you would:
// 1. Validate if this GitHub user is authorized to access your TinaCMS admin
// 2. Generate a secure token with appropriate claims
function generateTinaToken(userData: any, email: string): string {
  // In a real implementation, you might:
  // - Check if this GitHub user is in an allowed list
  // - Verify their email domain
  // - Check organization membership
  // - Generate a JWT with appropriate claims

  // For demo purposes, we're creating a simple token with user info
  // IMPORTANT: Replace this with proper JWT or other secure token generation
  const token = Buffer.from(
    JSON.stringify({
      sub: `github:${userData.id}`,
      name: userData.name || userData.login,
      email: email,
      avatar: userData.avatar_url,
      iat: Date.now(),
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
    })
  ).toString('base64');

  return token;
}
