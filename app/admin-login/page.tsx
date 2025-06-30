'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import LoginForm from '../../components/auth/LoginForm';
import LoginHeader from '../../components/auth/LoginHeader';
import { setTinaAuthToken } from '../../lib/tina-auth';

// Separate component to use searchParams within Suspense boundary
function AdminLoginContent() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get the redirect path if one was provided
  const redirectTo = searchParams.get('redirectTo') || '/admin';

  const handleLogin = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    
    try {
      // Call authentication endpoint
      const response = await fetch('/api/auth/tina-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      // Store token in localStorage for client-side auth checks
      if (data.token) {
        setTinaAuthToken(data.token);
      }
      
      // Add a short delay to ensure cookie is set before redirect
      setTimeout(() => {
        router.push(redirectTo);
      }, 300);
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg transition-all">
        <LoginHeader />
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-600 p-4 mb-4 rounded-md overflow-hidden transition-all duration-300">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9a1 1 0 112 0v4a1 1 0 11-2 0V9zm1-5a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <LoginForm onSubmit={handleLogin} />
        
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200">
            ← Back to website
          </Link>
        </div>
      </div>
      
      <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Having trouble? Contact your administrator for assistance.</p>
      </div>
    </div>
  );
}

// Main component with Suspense boundary for useSearchParams
export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AdminLoginContent />
    </Suspense>
  );
}
