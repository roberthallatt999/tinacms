import { NextResponse, NextRequest } from 'next/server';
import { setTinaAuthToken } from '../../../../../lib/tina-auth';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    
    // Get the stored state from cookies to prevent CSRF
    const storedState = request.cookies.get('github_oauth_state')?.value;
    
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
    
    if (tokenData.error || !tokenData.access_token) {
      console.error('GitHub OAuth error:', tokenData);
      return NextResponse.redirect(
        new URL(`/admin-login?error=${tokenData.error || 'access_token_missing'}`, request.url)
      );
    }
    
    // Get user data from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `token ${tokenData.access_token}`,
      },
    });
    
    const userData = await userResponse.json();
    
    if (!userData || !userData.id) {
      return NextResponse.redirect(
        new URL('/admin-login?error=github_user_data_missing', request.url)
      );
    }
    
    // Get user emails (if scope includes email permission)
    const emailsResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `token ${tokenData.access_token}`,
      },
    });
    
    const emailsData = await emailsResponse.json();
    const primaryEmail = emailsData.find((email: any) => email.primary)?.email || emailsData[0]?.email;
    
    // Create a Tina auth token (in a real app, this would validate against authorized users)
    // This is where you'd verify if the GitHub user is authorized to access the TinaCMS admin
    // For example, checking their email or organization membership
    
    // Generate a token for Tina with user details
    const tinaToken = generateTinaToken(userData, primaryEmail);
    
    // We need to redirect to a special page that will set up TinaCMS auth
    // This ensures we don't get double login prompts
    const redirectUrl = '/auth-success';
      
    // Create redirect with query parameters needed for auth
    const successUrl = new URL(redirectUrl, request.url);
    successUrl.searchParams.set('token', tinaToken);
    successUrl.searchParams.set('clientId', process.env.NEXT_PUBLIC_TINA_CLIENT_ID || '');

    const response = NextResponse.redirect(successUrl);
    
    // Set the auth cookie
    response.cookies.set({
      name: 'tinaAuthToken',
      value: tinaToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
    
    // Clear the oauth state cookie
    response.cookies.set({
      name: 'github_oauth_state',
      value: '',
      expires: new Date(0),
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Error in GitHub callback:', error);
    return NextResponse.redirect(
      new URL('/admin-login?error=github_callback_error', request.url)
    );
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
