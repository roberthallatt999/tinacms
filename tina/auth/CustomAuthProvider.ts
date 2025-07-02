import { AbstractAuthProvider } from 'tinacms';

export class CustomAuthProvider extends AbstractAuthProvider {
  constructor() {
    super();
  }

  async authenticate(props?: {}): Promise<any> {
    console.log('CustomAuthProvider: authenticate() called. Redirecting to /admin-auth-bridge');
    // In our case, authentication is handled by the /admin-auth-bridge page
    // If TinaCMS calls this, it means getUser() returned falsy.
    // We should redirect to our auth bridge page.
    window.location.href = '/admin-auth-bridge';
    return Promise.resolve();
  }

  async getToken(): Promise<{ id_token: string } | null> {
    console.log('CustomAuthProvider: getToken() called');
    try {
      const authString = localStorage.getItem('tinacms-auth');
      if (authString) {
        const authObject = JSON.parse(authString);
        if (authObject && authObject.token) {
          console.log('CustomAuthProvider: getToken() - token found:', authObject.token.substring(0, 15) + '...');
          return { id_token: authObject.token };
        }
      }
    } catch (e) {
      console.error('CustomAuthProvider: Error getting TinaCMS token from localStorage:', e);
    }
    console.log('CustomAuthProvider: getToken() - no token found');
    return null;
  }

  async getUser(): Promise<any> {
    console.log('CustomAuthProvider: getUser() called');
    try {
      const authString = localStorage.getItem('tinacms-auth');
      if (authString) {
        const authObject = JSON.parse(authString);
        // Return a truthy value if the token exists and is not expired
        if (authObject && authObject.token && authObject.expiresAtInMs > Date.now()) {
          console.log('CustomAuthProvider: getUser() - user found, token valid.');
          return { name: 'TinaCMS User' }; // A simple truthy object indicating a logged-in user
        }
        console.log('CustomAuthProvider: getUser() - token found but invalid or expired.');
      }
    } catch (e) {
      console.error('CustomAuthProvider: Error getting TinaCMS user from localStorage:', e);
    }
    console.log('CustomAuthProvider: getUser() - no user found (returning falsy).');
    return undefined; // Falsy value indicates not logged in
  }

  async logout(): Promise<void> {
    localStorage.removeItem('tinacms-auth');
    sessionStorage.removeItem('tinacms-auth');
    // Optionally redirect to a logout page or home
    window.location.href = '/';
  }
}
