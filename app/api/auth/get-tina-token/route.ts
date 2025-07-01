import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint to securely retrieve the TinaCMS token from httpOnly cookie
 * This allows client-side code to access the token for localStorage without exposing it in cookies
 */
export async function GET(request: NextRequest) {
  try {
    // Get the TinaCMS auth token from the cookie - await the cookie store
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('tinaAuthToken');
    const tinaAuthToken = tokenCookie?.value;
    
    if (!tinaAuthToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Return the token securely (this endpoint should only be called by authenticated users)
    return NextResponse.json({ token: tinaAuthToken });
  } catch (error) {
    console.error('Error retrieving TinaCMS token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
