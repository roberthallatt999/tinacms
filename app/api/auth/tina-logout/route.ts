import { NextResponse } from 'next/server';

// Handles logout by clearing the authentication cookie
export async function POST() {
  try {
    // Create a response
    const response = NextResponse.json({ 
      success: true,
      message: 'Logged out successfully' 
    });
    
    // Clear the auth cookie by setting it to expire in the past
    response.cookies.set({
      name: 'tinaAuthToken',
      value: '',
      expires: new Date(0), // Set to epoch time, effectively deleting the cookie
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { message: 'Error during logout', error: (error as Error).message },
      { status: 500 }
    );
  }
}
