/**
 * TinaCMS API Proxy Interceptor
 * 
 * This script intercepts API calls from TinaCMS and redirects them through our proxy.
 * It should be included in the TinaCMS admin interface.
 */

(function() {
  // Wait for the document to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIntercept);
  } else {
    initIntercept();
  }

  function initIntercept() {
    console.log('TinaCMS API Proxy Interceptor initialized');
    
    // Intercept fetch calls
    const originalFetch = window.fetch;
    window.fetch = async function(url, options = {}) {
      // Only intercept TinaCMS API calls
      if (typeof url === 'string' && url.includes('content.tinajs.io')) {
        try {
          // Replace the TinaCMS API URL with our proxy URL
          const proxyUrl = url.replace(
            'https://content.tinajs.io',
            `${window.location.origin}/api/tina-proxy`
          );
          
          console.log(`Proxying TinaCMS API call: ${url} -> ${proxyUrl}`);
          
          // Forward the request through our proxy
          return await originalFetch(proxyUrl, options);
        } catch (error) {
          console.error('Error in API proxy intercept:', error);
          return await originalFetch(url, options);
        }
      }
      
      // For non-TinaCMS API calls, use the original fetch
      return await originalFetch(url, options);
    };

    // Intercept XMLHttpRequest
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
      // Only intercept TinaCMS API calls
      if (typeof url === 'string' && url.includes('content.tinajs.io')) {
        // Replace the TinaCMS API URL with our proxy URL
        const proxyUrl = url.replace(
          'https://content.tinajs.io',
          `${window.location.origin}/api/tina-proxy`
        );
        
        console.log(`Proxying TinaCMS API call (XHR): ${url} -> ${proxyUrl}`);
        
        // Call the original open method with the modified URL
        return originalOpen.call(this, method, proxyUrl, ...rest);
      }
      
      // For non-TinaCMS API calls, use the original open method
      return originalOpen.call(this, method, url, ...rest);
    };

    // Look for the login form and auto-submit if present
    checkForLoginForm();
  }

  // Check for login form every second until found or timeout
  function checkForLoginForm() {
    let attempts = 0;
    const maxAttempts = 10;
    
    const checkInterval = setInterval(() => {
      attempts++;
      
      // Look for TinaCMS login form
      const loginForm = document.querySelector('form[data-testid="login-form"]');
      if (loginForm) {
        console.log('TinaCMS login form detected - attempting to bypass');
        clearInterval(checkInterval);
        bypassTinaCMSLogin();
      }
      
      // Stop checking after max attempts
      if (attempts >= maxAttempts) {
        console.log('Stopped looking for TinaCMS login form after max attempts');
        clearInterval(checkInterval);
      }
    }, 1000);
  }

  // Try to bypass the TinaCMS login form
  function bypassTinaCMSLogin() {
    // This function will simulate a successful login with the token we've already set
    try {
      // Check for our auth token in cookies
      const tinaTokenCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('tinaAuthToken='));
        
      if (!tinaTokenCookie) {
        console.error('No tinaAuthToken cookie found');
        return;
      }
      
      const token = tinaTokenCookie.split('=')[1];
      
      // Get TinaCMS client ID
      const getClientId = () => {
        // Check meta tag first
        const metaTag = document.querySelector('meta[name="tina-client-id"]');
        if (metaTag && metaTag.content) {
          return metaTag.content;
        }
        
        // Try to extract from the URL or page content as fallback
        const htmlContent = document.documentElement.innerHTML;
        const clientIdMatch = htmlContent.match(/clientId["':]\s*["']([^"']+)["']/);
        return clientIdMatch ? clientIdMatch[1] : null;
      };
      
      const clientId = getClientId();
      
      if (!clientId) {
        console.error('Could not determine TinaCMS client ID');
        return;
      }
      
      console.log(`Setting up TinaCMS auth with clientId: ${clientId.substring(0, 5)}...`);
      
      // Set up TinaCMS auth in localStorage
      const authObject = {
        token: token,
        clientId: clientId,
        expiresAtInMs: Date.now() + 7 * 24 * 60 * 60 * 1000 // 1 week
      };
      
      localStorage.setItem('tinacms-auth', JSON.stringify(authObject));
      sessionStorage.setItem('tinacms-auth', JSON.stringify(authObject));
      
      console.log('TinaCMS auth object set in localStorage and sessionStorage');
      
      // Force reload the page to apply the auth
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Error bypassing TinaCMS login:', error);
    }
  }
})();
