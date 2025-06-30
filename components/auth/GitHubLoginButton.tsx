'use client';

import { useState } from 'react';
import { Github, Loader2 } from 'lucide-react';

interface GitHubLoginButtonProps {
  onLoginStart?: () => void;
}

export default function GitHubLoginButton({ onLoginStart }: GitHubLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGitHubLogin = async () => {
    try {
      setIsLoading(true);
      if (onLoginStart) onLoginStart();
      
      // Request GitHub auth URL from our API
      const response = await fetch('/api/auth/github/auth-url');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch auth URL: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.authUrl) {
        console.log('Redirecting to GitHub OAuth:', data.authUrl);
        // Redirect to GitHub auth
        window.location.href = data.authUrl;
      } else {
        setError('Failed to get GitHub authorization URL');
      }
    } catch (error) {
      setError('Error initiating GitHub login');
      console.error('GitHub login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleGitHubLogin}
      disabled={isLoading}
      className="w-full flex justify-center items-center gap-3 bg-gray-800 hover:bg-gray-900 text-white py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
      type="button"
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Github className="h-5 w-5" />
      )}
      {isLoading ? 'Connecting to GitHub...' : 'Sign in with GitHub'}
    </button>
  );
}
