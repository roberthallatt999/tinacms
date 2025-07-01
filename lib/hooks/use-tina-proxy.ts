import { useEffect, useState } from 'react';

/**
 * Custom hook to ensure TinaCMS proxy intercept script is loaded
 * This can be used in any admin-related components to guarantee
 * the proxy script is available
 */
export function useTinaProxy() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication status from cookie
    const checkAuthStatus = () => {
      const hasAuthStatus = document.cookie
        .split('; ')
        .some(row => row.startsWith('tinaAuthStatus=authenticated'));
      
      setIsAuthenticated(hasAuthStatus);
    };
    
    // Check if proxy script is already loaded
    const isScriptLoaded = () => {
      return !!document.getElementById('tina-proxy-intercept-script');
    };
    
    // Load the proxy script if not already loaded
    const loadProxyScript = () => {
      if (isScriptLoaded()) {
        setIsLoaded(true);
        return;
      }
      
      const script = document.createElement('script');
      script.id = 'tina-proxy-intercept-script';
      script.src = '/admin/proxy-intercept.js';
      script.async = true;
      script.onload = () => {
        setIsLoaded(true);
      };
      
      document.head.appendChild(script);
    };
    
    checkAuthStatus();
    
    // Only load the script if authenticated
    if (isAuthenticated && !isLoaded && typeof window !== 'undefined') {
      loadProxyScript();
    }
  }, [isAuthenticated, isLoaded]);

  return { isProxyLoaded: isLoaded, isAuthenticated };
}
