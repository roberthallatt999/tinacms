'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, LogOut, ChevronDown } from 'lucide-react';
import { clearTinaAuth } from '../../lib/tina-auth';

export default function AdminLoginStatus() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    // Check for authentication when component mounts
    const checkAuth = () => {
      // Check for authentication token in client-side storage
      const hasAuthToken = 
        typeof window !== 'undefined' && 
        document.cookie.includes('tinaAuthToken=');
      
      setIsLoggedIn(hasAuthToken);
    };
    
    checkAuth();
    
    // Optional: listen for storage events to detect login/logout in other tabs
    const handleStorageChange = () => {
      checkAuth();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = async () => {
    try {
      // Call logout API endpoint
      await fetch('/api/auth/tina-logout', {
        method: 'POST',
      });
      
      // Clear client-side auth token
      clearTinaAuth();
      
      // Close menu
      setIsMenuOpen(false);
      
      // Update login state
      setIsLoggedIn(false);
      
      // Redirect to home page
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!isLoggedIn) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="relative">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md shadow-lg transition-all duration-200"
          aria-expanded={isMenuOpen}
          aria-haspopup="true"
        >
          <Pencil className="h-4 w-4" />
          <span className="text-sm font-medium">Admin</span>
          <ChevronDown 
            className={`h-4 w-4 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} 
          />
        </button>

        {isMenuOpen && (
          <div 
            className="absolute bottom-full right-0 mb-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none"
            role="menu"
            aria-orientation="vertical"
          >
            <div className="py-1" role="none">
              <Link
                href="/admin"
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                role="menuitem"
                onClick={() => setIsMenuOpen(false)}
              >
                <Pencil className="h-4 w-4" />
                Open TinaCMS Admin
              </Link>
              <button
                className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                role="menuitem"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
