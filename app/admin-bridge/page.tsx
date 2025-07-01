'use client';

import { useEffect, useState } from 'react';

export default function AdminBridge() {
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    // Function to run our auth bridge logic
    const setupTinaAuth = async () => {
      try {
        setStatus('Initializing TinaCMS authentication bridge...');

        // Get auth token from multiple possible sources
        const getAuthToken = () => {
          // First try localStorage - our custom login flow sets this
          const token = localStorage.getItem('tinaAuthToken');
          if (token) return token;

          // Try the HTTP cookie set by our API
          const cookieToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('tinaAuthToken='));

          if (cookieToken) {
            return cookieToken.split('=')[1];
          }

          // As a last resort, check if we already have a TinaCMS auth token
          const existingTinaCMSAuth = localStorage.getItem('tinacms-auth');
          if (existingTinaCMSAuth) {
            try {
              const parsed = JSON.parse(existingTinaCMSAuth);
              if (parsed && parsed.token) {
                return parsed.token;
              }
            } catch (e) {
              console.error('Failed to parse existing TinaCMS auth:', e);
            }
          }

          return null;
        };

        // Get client ID from environment variable or localStorage
        const getClientId = () => {
          // Try environment variable first
          if (process.env.NEXT_PUBLIC_TINA_CLIENT_ID) {
            return process.env.NEXT_PUBLIC_TINA_CLIENT_ID;
          }

          // Check if the window has it
          if (typeof window !== 'undefined' && (window as any).NEXT_PUBLIC_TINA_CLIENT_ID) {
            return (window as any).NEXT_PUBLIC_TINA_CLIENT_ID;
          }

          // Look for it in localStorage (might have been set by auth-success)
          const storedClientId = localStorage.getItem('NEXT_PUBLIC_TINA_CLIENT_ID');
          if (storedClientId) {
            return storedClientId;
          }

          // As a last resort, check if we already have a TinaCMS auth
          const existingTinaCMSAuth = localStorage.getItem('tinacms-auth');
          if (existingTinaCMSAuth) {
            try {
              const parsed = JSON.parse(existingTinaCMSAuth);
              if (parsed && parsed.clientId) {
                return parsed.clientId;
              }
            } catch (e) {
              console.error('Failed to parse existing TinaCMS auth for clientId:', e);
            }
          }

          return 'default-client-id';
        };

        const authToken = getAuthToken();
        const clientId = getClientId();

        if (!authToken) {
          setStatus('No auth token found, redirecting to login...');
          window.location.href = '/admin-login';
          return;
        }

        // For debugging
        console.log('Auth token found, clientId:', clientId);
        setStatus(`Auth token found, setting up TinaCMS auth with client ID: ${clientId.substring(0, 5)}...`);

        // Create TinaCMS auth object
        const tinaAuthState = {
          clientId: clientId,
          token: authToken,
          expiresAtInMs: Date.now() + 7 * 24 * 60 * 60 * 1000 // 1 week
        };

        // Set the auth in localStorage where TinaCMS looks for it
        localStorage.setItem('tinacms-auth', JSON.stringify(tinaAuthState));

        // Also set the individual token for our middleware
        localStorage.setItem('tinaAuthToken', authToken);

        setStatus('TinaCMS auth set up successfully, redirecting to admin...');

        // Check if we're in a potential loop by looking at referrer
        const referrer = document.referrer;
        const isFromAdminPage = referrer && (referrer.includes('/admin/') || referrer.endsWith('/admin'));
        const directAccess = !document.location.search.includes('from=middleware');
        
        if (isFromAdminPage && directAccess) {
          // We might be in a loop - go directly to TinaCMS admin with specific path to bypass middleware
          setStatus('Potential loop detected, using direct TinaCMS access...');
          window.location.href = '/admin/index.html?direct=true';
          return;
        }
        
        // Wait a moment and redirect to the actual admin
        // Use direct access to avoid middleware interception
        setStatus('TinaCMS auth set up successfully, redirecting to admin...');
        setTimeout(() => {
          // Add a special parameter that the middleware can check to prevent loop
          window.location.href = '/admin/index.html?auth_complete=true';
        }, 1500);
      } catch (error) {
        console.error('Error setting up TinaCMS auth:', error);
        setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    // Run the auth setup
    setupTinaAuth();
  }, []);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      color: '#333'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1>Setting up TinaCMS admin</h1>
        <p>{status}</p>
      </div>
    </div>
  );
}
