'use client';

import { useEffect, useState } from 'react';

export default function AdminBridge() {
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    // Function to run our auth bridge logic
    const setupTinaAuth = () => {
      try {
        // Get auth token from cookie or localStorage
        const getAuthToken = () => {
          // Try to get from localStorage first
          const token = localStorage.getItem('tinaAuthToken');
          if (token) return token;
          
          // Try to get from cookie
          const cookieToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('tinaAuthToken='));
          
          return cookieToken ? cookieToken.split('=')[1] : null;
        };
        
        const authToken = getAuthToken();
        
        if (!authToken) {
          setStatus('No auth token found, redirecting to login...');
          window.location.href = '/admin-login';
          return;
        }
        
        setStatus('Auth token found, setting up TinaCMS auth...');
        
        // Create TinaCMS auth object
        const tinaAuthState = {
          clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID || 'default-client-id',
          token: authToken,
          expiresAtInMs: Date.now() + 7 * 24 * 60 * 60 * 1000 // 1 week
        };
        
        // Set the auth in localStorage where TinaCMS looks for it
        localStorage.setItem('tinacms-auth', JSON.stringify(tinaAuthState));
        
        setStatus('TinaCMS auth set up successfully, redirecting to admin...');
        
        // Wait a moment and redirect to the actual admin
        setTimeout(() => {
          window.location.href = '/admin/index.html';
        }, 1000);
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
