// TinaCMS auth bridge
// This script injects authentication directly into TinaCMS admin
(function() {
  console.log('TinaCMS Auth Bridge initialized');
  
  // Function to check if we have valid auth from our GitHub flow
  function checkAndInjectAuth() {
    try {
      // Check for our custom auth token
      const authToken = localStorage.getItem('tinaAuthToken');
      const clientId = localStorage.getItem('NEXT_PUBLIC_TINA_CLIENT_ID') || 
                        window.NEXT_PUBLIC_TINA_CLIENT_ID;
      
      if (!authToken) {
        console.log('No auth token found, not injecting auth');
        return;
      }
      
      console.log('Auth token found, injecting into TinaCMS');
      
      // Create the TinaCMS auth object
      const tinaAuthState = {
        clientId: clientId,
        token: authToken,
        expiresAtInMs: Date.now() + 7 * 24 * 60 * 60 * 1000, // 1 week
      };
      
      // Set the TinaCMS auth in localStorage
      localStorage.setItem('tinacms-auth', JSON.stringify(tinaAuthState));
      
      console.log('TinaCMS auth injected successfully');
      
      // Watch for TinaCMS login form and handle it
      handleTinaCMSLoginForm();
    } catch (error) {
      console.error('Error in TinaCMS Auth Bridge:', error);
    }
  }
  
  // Function to handle TinaCMS login form if it appears
  function handleTinaCMSLoginForm() {
    // Use a mutation observer to watch for the login form
    const observer = new MutationObserver((mutations) => {
      // Check if there's a login form
      const loginForm = document.querySelector('.tina-form--login');
      if (loginForm) {
        console.log('TinaCMS login form detected, attempting auto-login');
        
        // Check if auth token exists
        const authObject = localStorage.getItem('tinacms-auth');
        if (authObject) {
          console.log('Auth exists, refreshing page to apply auth');
          // Refresh the page to apply the auth
          window.location.reload();
        }
      }
    });
    
    // Start observing for login form
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  // Run auth injection on page load
  checkAndInjectAuth();
  
  // Also check again after a delay to ensure TinaCMS has initialized
  setTimeout(checkAndInjectAuth, 1000);
})();
