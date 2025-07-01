'use client'

import { useEffect } from 'react'
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

  useEffect(() => {
    console.log('AdminAuthBridge: Page loaded')
    
    // Check for authentication status
    const isAuthenticated = document.cookie
      .split('; ')
      .some(row => row.startsWith('tinaAuthStatus=authenticated'))
    
    console.log('AdminAuthBridge: Authentication status:', isAuthenticated)

    if (!isAuthenticated) {
      // If not authenticated, redirect to login
      console.log('AdminAuthBridge: Not authenticated, redirecting to login')
      router.replace('/admin-login')
      return
    }

    // Load Tina auth from cookie and set in localStorage
    console.log('AdminAuthBridge: Setting up Tina auth')
    setupTinaAuth()
      .then((result) => {
        console.log('AdminAuthBridge: Tina auth setup complete', result)
        // Wait a short moment to ensure script loads
        setTimeout(() => {
          // Redirect to actual admin page
          console.log('AdminAuthBridge: Redirecting to /admin')
          try {
            window.location.href = '/admin?from=bridge'
          } catch (err) {
            console.error('AdminAuthBridge: Error during redirect:', err)
          }
        }, 1000) // Increased timeout for safety
      })
      .catch(error => {
        console.error('AdminAuthBridge: Error setting up Tina auth:', error)
        router.replace('/admin-login?error=auth_setup_failed')
      })
  }, [router])

  // This function sets up the TinaCMS authentication in localStorage
  async function setupTinaAuth() {
    console.log('setupTinaAuth: Starting')
    try {
      // Get client ID from meta tag or env
      const clientId = process.env.NEXT_PUBLIC_TINA_CLIENT_ID || ''
      console.log('setupTinaAuth: Client ID available:', !!clientId)
      
      // Get token from httpOnly cookie via a fetch to our API
      console.log('setupTinaAuth: Fetching token from API')
      const tokenResponse = await fetch('/api/auth/get-tina-token')
      
      console.log('setupTinaAuth: Token response status:', tokenResponse.status)
      if (!tokenResponse.ok) {
        console.error('setupTinaAuth: Failed to retrieve token, status:', tokenResponse.status)
        const errorText = await tokenResponse.text()
        console.error('setupTinaAuth: Error response:', errorText)
        throw new Error(`Failed to retrieve token: ${tokenResponse.status} ${errorText}`)
      }
      
      const data = await tokenResponse.json()
      const token = data.token
      console.log('setupTinaAuth: Token received:', !!token)
      
      if (!token) {
        throw new Error('No token available')
      }
      
      // Format and set the TinaCMS auth object in localStorage
      const authObject = {
        token,
        clientId,
        expiresAtInMs: Date.now() + 7 * 24 * 60 * 60 * 1000 // 1 week
      }
      
      // Set in both localStorage and sessionStorage for redundancy
      console.log('setupTinaAuth: Setting auth in localStorage and sessionStorage')
      localStorage.setItem('tinacms-auth', JSON.stringify(authObject))
      sessionStorage.setItem('tinacms-auth', JSON.stringify(authObject))
      
      // Verify it was set correctly
      const localStorageAuth = localStorage.getItem('tinacms-auth')
      console.log('setupTinaAuth: Verification - localStorage auth exists:', !!localStorageAuth)
      
      return true
    } catch (error) {
      console.error('setupTinaAuth: Error:', error)
      throw error
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1>Authenticating with TinaCMS...</h1>
      <p>Please wait, you'll be redirected automatically.</p>
      <p>If you are not redirected within a few seconds, <a href="/admin" style={{color: 'blue', textDecoration: 'underline'}}>click here</a>.</p>

      {/* Load our proxy intercept script */}
      <Script 
        id="tina-proxy-intercept" 
        src="/admin/proxy-intercept.js" 
        strategy="beforeInteractive" 
        onLoad={() => console.log('Proxy intercept script loaded')}
        onError={(e) => console.error('Error loading proxy script:', e)}
      />
    </div>
  )
}
