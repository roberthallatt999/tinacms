'use client';

import { useEffect, useState } from 'react';

export default function DirectAdmin() {
  const [status, setStatus] = useState('Initializing TinaCMS direct admin...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set up TinaCMS auth directly
    const setupAuth = async () => {
      try {
        // Get auth token from cookie or localStorage
        const getAuthToken = () => {
          // Try localStorage first
          const token = localStorage.getItem('tinaAuthToken');
          if (token) return token;
          
          // Try cookie
          const cookieToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('tinaAuthToken='));
          
          return cookieToken ? cookieToken.split('=')[1] : null;
        };
        
        const authToken = getAuthToken();
        
        if (!authToken) {
          setStatus('No auth token found');
          setError('Authentication token not found. Please log in first.');
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
        
        setStatus('Loading TinaCMS admin directly...');
        
        // Create an iframe to load TinaCMS admin
        const iframe = document.createElement('iframe');
        iframe.src = '/admin/index.html?direct=1';
        iframe.style.width = '100%';
        iframe.style.height = '100vh';
        iframe.style.border = 'none';
        
        // Get container and append iframe
        const container = document.getElementById('admin-container');
        if (container) {
          container.innerHTML = '';
          container.appendChild(iframe);
        }
      } catch (err) {
        console.error('Error setting up admin:', err);
        setStatus('Error occurred');
        setError(`${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };
    
    setupAuth();
  }, []);

  return (
    <>
      <div style={{ padding: '20px', display: error ? 'block' : 'none' }}>
        <h2>Status: {status}</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {error && (
          <a href="/admin-login" style={{ display: 'inline-block', marginTop: '20px', padding: '10px 20px', background: '#ec4815', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
            Back to Login
          </a>
        )}
      </div>
      <div id="admin-container" style={{ height: '100vh', width: '100%' }}></div>
    </>
  );
}
