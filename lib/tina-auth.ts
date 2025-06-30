/**
 * TinaCMS Authentication Utilities
 * 
 * This file handles authentication functions between your custom login
 * and the TinaCMS admin interface.
 */

// Check if user is authenticated for TinaCMS admin
export async function isTinaAuthenticated(): Promise<boolean> {
  // In a real implementation, check if the user has a valid session
  // This could be checking cookies, local storage, or an API call
  
  try {
    // Example implementation
    const sessionToken = localStorage.getItem('tinaAuthToken');
    
    // If no token exists, user is not authenticated
    if (!sessionToken) {
      return false;
    }
    
    // Optionally verify token with your API
    // const isValid = await verifyToken(sessionToken);
    // return isValid;
    
    return true;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

// Store authentication token after login
export function setTinaAuthToken(token: string): void {
  localStorage.setItem('tinaAuthToken', token);
}

// Clear authentication token on logout
export function clearTinaAuth(): void {
  localStorage.removeItem('tinaAuthToken');
}

// Redirect to login if not authenticated
export function redirectToLoginIfNeeded(): void {
  // This function would be used on client components that need auth
  if (typeof window !== 'undefined') {
    const isLoggedIn = localStorage.getItem('tinaAuthToken') !== null;
    
    if (!isLoggedIn) {
      window.location.href = '/admin-login';
    }
  }
}
