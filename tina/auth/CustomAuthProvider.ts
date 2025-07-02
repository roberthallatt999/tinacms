import { AbstractAuthProvider } from 'tinacms';

export class CustomAuthProvider extends AbstractAuthProvider {
  constructor() {
    super();
  }

  async authenticate(props?: {}): Promise<any> {
    const isProd = typeof window !== 'undefined' && process.env.NODE_ENV === 'production';
    const logPrefix = isProd ? '[Auth]' : 'CustomAuthProvider:';
    
    console.log(`${logPrefix} authenticate() called. Redirecting directly to /admin/index.html`);
    
    // Skip the auth bridge and go directly to the admin HTML file
    // This approach works in development and might bypass redirect issues in production
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/index.html';
    }
    
    return Promise.resolve();
  }

  async getToken(): Promise<{ id_token: string } | null> {
    const isProd = typeof window !== 'undefined' && process.env.NODE_ENV === 'production';
    const logPrefix = isProd ? '[Auth]' : 'CustomAuthProvider:';
    
    console.log(`${logPrefix} getToken() called`);
    
    try {
      // Try both localStorage and sessionStorage
      let authString = null;
      
      if (typeof window !== 'undefined') {
        // First check localStorage
        authString = localStorage.getItem('tinacms-auth');
        
        // If not in localStorage, try sessionStorage as fallback
        if (!authString) {
          authString = sessionStorage.getItem('tinacms-auth');
        }
        
        if (authString) {
          const authObject = JSON.parse(authString);
          if (authObject && authObject.token) {
            console.log(`${logPrefix} getToken() - token found:`, 
              authObject.token.substring(0, 15) + '...');
              
            // Store the token in both places to maximize availability
            if (typeof window !== 'undefined') {
              try {
                localStorage.setItem('tinacms-auth', authString);
                sessionStorage.setItem('tinacms-auth', authString);
              } catch (e) {
                // Ignore storage errors
              }
            }
            
            return { id_token: authObject.token };
          }
        }
      }
    } catch (e) {
      console.error(`${logPrefix} Error getting TinaCMS token:`, e);
    }
    
    console.log(`${logPrefix} getToken() - no token found`);
    return null;
  }

  async getUser(): Promise<any> {
    const isProd = typeof window !== 'undefined' && process.env.NODE_ENV === 'production';
    const logPrefix = isProd ? '[Auth]' : 'CustomAuthProvider:';
    
    console.log(`${logPrefix} getUser() called`);
    
    try {
      // Try both localStorage and sessionStorage
      let authString = null;
      
      if (typeof window !== 'undefined') {
        // First check localStorage
        authString = localStorage.getItem('tinacms-auth');
        
        // If not in localStorage, try sessionStorage as fallback
        if (!authString) {
          authString = sessionStorage.getItem('tinacms-auth');
        }
        
        if (authString) {
          const authObject = JSON.parse(authString);
          // Return a truthy value if the token exists and is not expired
          // For production, be more lenient with expiry to prevent lockouts
          if (authObject && authObject.token) {
            // Only check expiry if it exists and we're not in production
            // In production, let the backend handle token expiry
            const isExpired = authObject.expiresAtInMs && authObject.expiresAtInMs < Date.now();
            
            if (!isExpired) {
              console.log(`${logPrefix} getUser() - user found, token valid.`);
              return { name: 'TinaCMS User', role: 'admin' }; // A simple truthy object with admin role
            }
            console.log(`${logPrefix} getUser() - token found but expired.`);
          } else {
            console.log(`${logPrefix} getUser() - auth object found but no token.`);
          }
        }
      }
    } catch (e) {
      console.error(`${logPrefix} Error getting TinaCMS user:`, e);
    }
    
    console.log(`${logPrefix} getUser() - no user found (returning falsy).`);
    return null; // Falsy value indicates not logged in
  }

  async logout(): Promise<void> {
    localStorage.removeItem('tinacms-auth');
    sessionStorage.removeItem('tinacms-auth');
    // Optionally redirect to a logout page or home
    window.location.href = '/';
  }
}
