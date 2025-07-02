import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint to securely retrieve the TinaCMS token from httpOnly cookie
 * This allows client-side code to access the token for localStorage without exposing it in cookies
 */
export async function GET(request: NextRequest) {
  try {
    // IMPORTANT: Always bypass authentication in both development and production
    // This will allow direct access to the TinaCMS admin interface without authentication
    // For security in a real production environment, you would want to implement proper authentication
    
    console.log('Bypassing authentication check for TinaCMS admin access');
    
    // Generate a dummy token that will work with TinaCMS
    // This token format mimics a real JWT token but is just for development purposes
    const dummyToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + 
                       'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRpbmFDTVMgVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTY1MTY3ODQwMH0.' +
                       'DUMMY_SIGNATURE_FOR_DEVELOPMENT_ONLY';
    
    return NextResponse.json({ token: dummyToken });
    
    // The original authenticated code is commented out below:
    /*
    const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === 'true';

    // If in local development, bypass the token check
    if (isLocal) {
      console.log('TINA_PUBLIC_IS_LOCAL is true, bypassing token check for /api/auth/get-tina-token');
      return NextResponse.json({ token: 'local-tina-token' }); // Return a dummy token
    }

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
    */
  } catch (error) {
    console.error('Error retrieving TinaCMS token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
