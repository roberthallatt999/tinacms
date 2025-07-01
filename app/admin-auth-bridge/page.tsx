"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'

/**
 * This page serves as a bridge between our custom authentication 
 * and the TinaCMS admin interface.
 * 
 * It injects our proxy interceptor script before redirecting to the admin.
 */
export default function AdminAuthBridge() {
  const router = useRouter()
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [showDebug, setShowDebug] = useState(true) // Set to false in production when fixed

  // Add debug message with timestamp
  const addDebug = (message: string) => {
    console.log(`DEBUG: ${message}`)
    setDebugInfo(prev => [...prev, `[${new Date().toISOString()}] ${message}`])
  }

  useEffect(() => {
    addDebug('Admin auth bridge loading')
    
    // Check if we have a token in the cookies
    const checkAuthStatus = async () => {
      try {
        // Fetch token from API 
        const res = await fetch('/api/auth/get-tina-token')
        
        if (!res.ok) {
          addDebug(`ERROR: Failed to get token: ${res.status} ${res.statusText}`)
          return
        }
        
        const data = await res.json()
        
        if (!data.token) {
          addDebug('ERROR: No token returned from API')
          return
        }
        
        addDebug(`Token received from API: ${data.token.substring(0, 15)}...`)
        
        // Get client ID from environment
        const clientId = process.env.NEXT_PUBLIC_TINA_CLIENT_ID
        
        if (!clientId) {
          addDebug('ERROR: No client ID available')
          return
        }
        
        // Set up TinaCMS auth object
        const authObject = {
          token: data.token,
          clientId: clientId,
          expiresAtInMs: Date.now() + 7 * 24 * 60 * 60 * 1000 // 1 week
        }
        
        // Store in localStorage for TinaCMS to use
        localStorage.setItem('tinacms-auth', JSON.stringify(authObject))
        sessionStorage.setItem('tinacms-auth', JSON.stringify(authObject))
        
        addDebug('TinaCMS auth set in localStorage and sessionStorage')
        
        // Redirect to TinaCMS admin after short delay
        setTimeout(() => {
          addDebug('Redirecting to /admin...')
          router.push('/admin')
        }, 2000)
      } catch (error) {
        addDebug(`ERROR: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
    
    checkAuthStatus()
    
  }, [router])
  
  // Script onLoad handler
  const handleScriptLoad = () => {
    addDebug('Proxy intercept script loaded')
  }

  // Script onError handler  
  const handleScriptError = () => {
    addDebug('ERROR: Failed to load proxy intercept script')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      {/* Embed proxy interceptor script directly */}
      <Script
        id="proxy-intercept-script"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
(function() {
  // Debug logging function - can be toggled for production
  const DEBUG = true;
  const logs = [];
  
  function debug(message, data) {
    if (!DEBUG) return;
    
    const timestamp = new Date().toISOString();
    const logMessage = \`[${timestamp}] ${message}\`;
    
    // Add to logs array for later inspection
    if (data !== undefined) {
      logs.push({ message: logMessage, data });
      console.log(logMessage, data);
    } else {
      logs.push({ message: logMessage });
      console.log(logMessage);
    }
    
    // Store logs in sessionStorage for debugging
    try {
      sessionStorage.setItem('tina-proxy-logs', JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to write logs to sessionStorage:', e);
    }
  }

  // Add debugging UI to the page
  function injectDebugUI() {
    try {
      if (!DEBUG) return;
      
      // Only add if not already present
      if (document.getElementById('tina-proxy-debug')) return;
      
      const container = document.createElement('div');
      container.id = 'tina-proxy-debug';
      container.style.position = 'fixed';
      container.style.bottom = '10px';
      container.style.right = '10px';
      container.style.zIndex = '99999';
      
      const button = document.createElement('button');
      button.innerText = 'Show TinaCMS Proxy Debug';
      button.style.padding = '8px';
      button.style.background = '#2296fe';
      button.style.color = 'white';
      button.style.border = 'none';
      button.style.borderRadius = '4px';
      button.style.cursor = 'pointer';
      
      button.addEventListener('click', () => {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.right = '0';
        overlay.style.bottom = '0';
        overlay.style.background = 'rgba(0, 0, 0, 0.8)';
        overlay.style.zIndex = '999999';
        overlay.style.padding = '20px';
        overlay.style.overflowY = 'auto';
        overlay.style.color = 'white';
        overlay.style.fontFamily = 'monospace';
        
        const closeBtn = document.createElement('button');
        closeBtn.innerText = 'Close';
        closeBtn.style.padding = '8px';
        closeBtn.style.background = '#f44336';
        closeBtn.style.color = 'white';
        closeBtn.style.border = 'none';
        closeBtn.style.borderRadius = '4px';
        closeBtn.style.marginBottom = '10px';
        
        closeBtn.addEventListener('click', () => document.body.removeChild(overlay));
        
        const copyBtn = document.createElement('button');
        copyBtn.innerText = 'Copy Logs';
        copyBtn.style.padding = '8px';
        copyBtn.style.background = '#4CAF50';
        copyBtn.style.color = 'white';
        copyBtn.style.border = 'none';
        copyBtn.style.borderRadius = '4px';
        copyBtn.style.marginBottom = '10px';
        copyBtn.style.marginLeft = '10px';
        
        copyBtn.addEventListener('click', () => {
          const logText = logs.map(log => {
            if (log.data) {
              return \`${log.message} ${JSON.stringify(log.data)}\`;
            }
            return log.message;
          }).join('\n');
          
          navigator.clipboard.writeText(logText).then(() => {
            alert('Logs copied to clipboard');
          });
        });
        
        const content = document.createElement('div');
        
        // Add environment info
        content.innerHTML += '<h3>Environment Info:</h3>';
        content.innerHTML += \`<p>URL: ${window.location.href}</p>\`;
        content.innerHTML += \`<p>User Agent: ${navigator.userAgent}</p>\`;
        
        // Add auth info (safely)
        content.innerHTML += '<h3>Authentication Status:</h3>';
        const hasLocalStorage = !!localStorage.getItem('tinacms-auth');
        const hasSessionStorage = !!sessionStorage.getItem('tinacms-auth');
        content.innerHTML += \`<p>tinacms-auth in localStorage: ${hasLocalStorage}</p>\`;
        content.innerHTML += \`<p>tinacms-auth in sessionStorage: ${hasSessionStorage}</p>\`;
        
        // Add log entries
        content.innerHTML += '<h3>Proxy Logs:</h3>';
        content.innerHTML += '<pre>' + logs.map(log => {
          if (log.data) {
            return \`${log.message} ${JSON.stringify(log.data, null, 2)}\`;
          }
          return log.message;
        }).join('\n') + '</pre>';
        
        overlay.appendChild(closeBtn);
        overlay.appendChild(copyBtn);
        overlay.appendChild(content);
        document.body.appendChild(overlay);
      });
      
      container.appendChild(button);
      document.body.appendChild(container);
    } catch (e) {
      console.error('Failed to inject debug UI:', e);
    }
  }

  // Wait for the document to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIntercept);
  } else {
    initIntercept();
  }

  function initIntercept() {
    debug('TinaCMS API Proxy Interceptor initialized', {
      url: window.location.href,
      timestamp: new Date().toISOString()
    });
    
    // Add debug UI after a short delay
    setTimeout(injectDebugUI, 1000);
    
    // Check for existing auth in localStorage/sessionStorage
    const localStorageAuth = localStorage.getItem('tinacms-auth');
    const sessionStorageAuth = sessionStorage.getItem('tinacms-auth');
    
    debug('Auth check on init', { 
      hasLocalStorage: !!localStorageAuth,
      hasSessionStorage: !!sessionStorageAuth
    });

    // Intercept fetch calls
    const originalFetch = window.fetch;
    window.fetch = async function(url, options = {}) {
      // Only intercept TinaCMS API calls
      if (typeof url === 'string' && url.includes('content.tinajs.io')) {
        try {
          // Replace the TinaCMS API URL with our proxy URL
          const proxyUrl = url.replace(
            'https://content.tinajs.io',
            \`${window.location.origin}/api/tina-proxy\`
          );
          
          debug(\`Proxying TinaCMS API call: ${url} -> ${proxyUrl}\`, {
            originalUrl: url,
            proxyUrl: proxyUrl,
            method: options?.method || 'GET'
          });
          
          // Forward the request through our proxy
          return await originalFetch(proxyUrl, options);
        } catch (error) {
          debug('Error in API proxy intercept:', error);
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
          \`${window.location.origin}/api/tina-proxy\`
        );
        
        debug(\`Proxying TinaCMS API call (XHR): ${url} -> ${proxyUrl}\`, {
          originalUrl: url,
          proxyUrl: proxyUrl,
          method: method
        });
        
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
    const maxAttempts = 20; // Increased for production
    
    const checkInterval = setInterval(() => {
      attempts++;
      
      // Look for TinaCMS login form
      const loginForm = document.querySelector('form[data-testid="login-form"]');
      debug(\`Login form check attempt ${attempts}/${maxAttempts}: ${loginForm ? 'found' : 'not found'}\`);
      
      if (loginForm) {
        debug('TinaCMS login form detected - attempting to bypass');
        clearInterval(checkInterval);
        bypassTinaCMSLogin();
      }
      
      // Stop checking after max attempts
      if (attempts >= maxAttempts) {
        debug('Stopped looking for TinaCMS login form after max attempts');
        clearInterval(checkInterval);
      }
    }, 1000);
  }

  // Try to bypass the TinaCMS login form
  function bypassTinaCMSLogin() {
    // This function will simulate a successful login with the token we've already set
    try {
      // Check for our auth token in cookies
      const cookies = document.cookie.split('; ');
      debug('Checking cookies for tinaAuthToken', { cookieCount: cookies.length });
      
      const tinaTokenCookie = cookies.find(row => row.startsWith('tinaAuthToken='));
        
      if (!tinaTokenCookie) {
        debug('No tinaAuthToken cookie found - checking localStorage/sessionStorage');
        
        // Try to get from localStorage/sessionStorage
        const localAuth = localStorage.getItem('tinacms-auth');
        const sessionAuth = sessionStorage.getItem('tinacms-auth');
        
        if (localAuth || sessionAuth) {
          debug('Found existing auth in storage', { 
            hasLocalStorage: !!localAuth,
            hasSessionStorage: !!sessionAuth
          });
          
          // If we have auth data but the login form is still showing, reload the page
          setTimeout(() => {
            debug('Reloading page to apply auth...');
            window.location.reload();
          }, 500);
          return;
        }
        
        debug('No authentication data found anywhere');
        return;
      }
      
      const token = tinaTokenCookie.split('=')[1];
      debug('Found tinaAuthToken cookie', { hasToken: !!token });
      
      // Get TinaCMS client ID
      const getClientId = () => {
        // Check meta tag first
        const metaTag = document.querySelector('meta[name="tina-client-id"]');
        if (metaTag && metaTag.content) {
          debug('Found client ID in meta tag');
          return metaTag.content;
        }
        
        // Check for env var in window object
        if (window.ENV && window.ENV.NEXT_PUBLIC_TINA_CLIENT_ID) {
          debug('Found client ID in window.ENV');
          return window.ENV.NEXT_PUBLIC_TINA_CLIENT_ID;
        }
        
        // Try to extract from the URL or page content as fallback
        const htmlContent = document.documentElement.innerHTML;
        const clientIdMatch = htmlContent.match(/clientId["':]\s*["']([^"']+)["']/);
        
        if (clientIdMatch) {
          debug('Found client ID in HTML content');
          return clientIdMatch[1];
        }
        
        debug('Could not find client ID - using fallback');
        return null;
      };
      
      const clientId = getClientId();
      
      if (!clientId) {
        debug('Could not determine TinaCMS client ID');
        return;
      }
      
      debug(\`Setting up TinaCMS auth with clientId: ${clientId.substring(0, 5)}...\`);
      
      // Set up TinaCMS auth in localStorage
      const authObject = {
        token: token,
        clientId: clientId,
        expiresAtInMs: Date.now() + 7 * 24 * 60 * 60 * 1000 // 1 week
      };
      
      localStorage.setItem('tinacms-auth', JSON.stringify(authObject));
      sessionStorage.setItem('tinacms-auth', JSON.stringify(authObject));
      
      debug('TinaCMS auth object set in localStorage and sessionStorage');
      
      // Force reload the page to apply the auth
      setTimeout(() => {
        debug('Reloading page to apply auth...');
        window.location.reload();
      }, 500);
    } catch (error) {
      debug('Error bypassing TinaCMS login:', error);
    }
  }
})();
`

        }}
        onLoad={handleScriptLoad}
        onError={hanleScriptError}
      ></Script>
      
      <div className="w-full max-w-md bg-white p-8 shadow-md rounded-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Admin Authentication</h1>
        <div className="animate-pulse">
          <p className="text-gray-600">Configuring TinaCMS authentication...</p>
        </div>
        
        {/* Debug info panel */}
        {showDebug && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <h2 className="text-lg font-semibold mb-2 flex justify-between">
              Debug Info
              <button 
                onClick={() => navigator.clipboard.writeText(debugInfo.join('\n'))}
                className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
              >
                Copy
              </button>
            </h2>
            <div className="text-xs font-mono overflow-auto max-h-64">
              {debugInfo.map((msg, i) => (
                <div key={i} className="py-1 border-b border-gray-200">
                  {msg}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
