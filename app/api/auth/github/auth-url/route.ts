import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // GitHub OAuth configuration
    const githubClientId = process.env.GITHUB_CLIENT_ID;
    
    // Check if GitHub client ID is configured
    if (!githubClientId) {
      return NextResponse.json(
        { message: 'GitHub OAuth is not configured. Missing GITHUB_CLIENT_ID.' },
        { status: 500 }
      );
    }

    // Set up the OAuth scope - these are the permissions we're requesting
    const scope = 'read:user user:email'; // Basic user info and email
    
    // Redirect URI - GitHub will redirect here after authentication
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/auth/github/callback`;
    
    // Generate a random state parameter for security
    // This helps prevent CSRF attacks
    const state = Math.random().toString(36).substring(2, 15);
    
    // Store the state in cookies to verify when the user is redirected back
    const response = NextResponse.json({
      authUrl: `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&scope=${encodeURIComponent(scope)}&state=${state}`,
    });
    
    // Set a cookie with the state parameter
    response.cookies.set({
      name: 'github_oauth_state',
      value: state,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 5, // 5 minutes
    });
    
    return response;
  } catch (error) {
    console.error('Error generating GitHub auth URL:', error);
    return NextResponse.json(
      { 
        message: 'Failed to generate GitHub authentication URL',
        error: (error as Error).message 
      },
      { status: 500 }
    );
  }
}
