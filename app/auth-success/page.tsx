'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function AuthSuccess() {
  const [status, setStatus] = useState('Setting up authentication...');
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const setupTinaAuth = async () => {
      try {
        // Get token from URL params
        const token = searchParams.get('token');

        if (!token) {
          setStatus('Error: No token found in URL parameters');
          return;
        }

        // Store token in localStorage for our app's auth system
        localStorage.setItem('tinaAuthToken', token);

        // Get the TinaCMS client ID
        const getClientId = () => {
          // Try environment variable
          const envClientId = process.env.NEXT_PUBLIC_TINA_CLIENT_ID;
          if (envClientId) {
            return envClientId;
          }

          // Look for it in localStorage (might have been set elsewhere)
          const localClientId = localStorage.getItem('tinaClientId');
          if (localClientId) {
            return localClientId;
          }

          // Default value as fallback (this should ideally be set in your .env)
          return 'default-client-id';
        };

        const clientId = getClientId();

        // CRITICAL: Create TinaCMS auth object in the exact format expected by TinaCMS
        const tinaAuthState = {
          token: token,
          clientId: clientId,
          schema: undefined, // Not needed for simple auth
          // Set expiration to 1 week from now (TinaCMS expects this)
          expiresAtInMs: Date.now() + 7 * 24 * 60 * 60 * 1000
        };

        // Store TinaCMS auth in localStorage where TinaCMS admin UI will look for it
        localStorage.setItem('tinacms-auth', JSON.stringify(tinaAuthState));

        // Also create a backup in sessionStorage in case TinaCMS checks there
        sessionStorage.setItem('tinacms-auth', JSON.stringify(tinaAuthState));

        setStatus('Authentication set up successfully, redirecting...');

        // Redirect to admin with auth_complete=true to avoid middleware loops
        setTimeout(() => {
          router.push('/admin?auth_complete=true');
        }, 1000);
      } catch (error) {
        setStatus(`Error setting up authentication: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.error('Auth setup error:', error);
      }
    };

    setupTinaAuth();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 shadow-md rounded-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Authentication Status</h1>
        <div className="animate-pulse">
          <p className="text-gray-600">{status}</p>
        </div>
      </div>
    </div>
  );
}
