/**
 * TinaCMS API Interceptor Script
 * 
 * This script intercepts fetch requests to the TinaCMS API and injects the authorization header
 * from localStorage to fix the "No authorization header set" error in production.
 */

(function() {
  console.log('[Tina API Interceptor] Initializing...');
  
  // Store the original fetch function
  const originalFetch = window.fetch;
  
  // Helper function to get auth token from localStorage
  function getAuthToken() {
    try {
      const tinaAuth = localStorage.getItem('tinacms-auth');
      if (!tinaAuth) {
        console.warn('[Tina API Interceptor] No tinacms-auth found in localStorage');
        return null;
      }
      
      const authData = JSON.parse(tinaAuth);
      return authData.token;
    } catch (err) {
      console.error('[Tina API Interceptor] Error extracting token:', err);
      return null;
    }
  }
  
  // Replace the fetch function with our interceptor
  window.fetch = function(url, options = {}) {
    // Convert to string if it's a Request object
    const urlString = typeof url === 'string' ? url : url.url;
    
    // Check if this is a TinaCMS API request
    if (urlString.includes('content.tinajs.io') || urlString.includes('/api/tina')) {
      console.log(`[Tina API Interceptor] Intercepting request to: ${urlString}`);
      
      // Initialize headers if they don't exist
      options.headers = options.headers || {};
      
      // Create a headers object if it's a Headers instance
      if (options.headers instanceof Headers) {
        const headerObj = {};
        options.headers.forEach((value, key) => {
          headerObj[key] = value;
        });
        options.headers = headerObj;
      }

      // Get the token
      const token = getAuthToken();
      
      if (token) {
        // Add the authorization header
        console.log('[Tina API Interceptor] Adding authorization header');
        options.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn('[Tina API Interceptor] No token available for request');
      }
    }
    
    // Call the original fetch with potentially modified options
    return originalFetch(url, options);
  };
  
  console.log('[Tina API Interceptor] Initialized successfully');
})();
