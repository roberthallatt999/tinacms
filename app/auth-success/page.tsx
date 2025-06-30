'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// Component that receives auth parameters and sets up TinaCMS auth
function AuthSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Get authentication parameters from URL
    const token = searchParams.get('token');
    const clientId = searchParams.get('clientId');
    
    if (!token || !clientId) {
      console.error('Missing auth parameters');
      router.push('/admin-login?error=missing_auth_params');
      return;
    }
    
    try {
      // Set up TinaCMS expected auth in localStorage
      // This is the key part that connects your auth with TinaCMS
      
      // TinaCMS stores tokens in specific JSON format
      const tinaAuthState = {
        clientId,
        token,
        expiresAtInMs: Date.now() + 7 * 24 * 60 * 60 * 1000, // 1 week
      };
      
      // Store auth state in the way TinaCMS expects
      localStorage.setItem('tinacms-auth', JSON.stringify(tinaAuthState));
      
      // Also set our custom token for middleware
      localStorage.setItem('tinaAuthToken', token);
      
      console.log('TinaCMS auth successfully set up');
      
      // Redirect to admin with a slight delay
      setTimeout(() => {
        // Use window.location for a full page reload which is needed for TinaCMS to pick up the auth
        window.location.href = '/admin';
      }, 500);
    } catch (error) {
      console.error('Error setting up TinaCMS auth:', error);
      router.push('/admin-login?error=auth_setup_failed');
    }
  }, [router, searchParams]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Authentication successful</h1>
        <p className="text-gray-500 dark:text-gray-400">Redirecting to admin dashboard...</p>
        <div className="mt-4">
          <div className="w-12 h-12 rounded-full border-4 border-t-indigo-600 border-gray-200 animate-spin mx-auto"></div>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense for useSearchParams
export default function AuthSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AuthSuccessContent />
    </Suspense>
  );
}
