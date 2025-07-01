'use client'

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
    addDebug('AdminAuthBridge: Page loaded')
    
    // Add environment info for debugging
    addDebug(`Environment: ${process.env.NODE_ENV}`)
    addDebug(`Origin: ${window.location.origin}`)
    addDebug(`Pathname: ${window.location.pathname}`)
    
    // Check for authentication status
    const isAuthenticated = document.cookie
      .split('; ')
      .some(row => row.startsWith('tinaAuthStatus=authenticated'))
    
    addDebug(`Authentication status: ${isAuthenticated}`)
    addDebug(`Cookie string: ${document.cookie.replace(/=([^;]+)/g, '=REDACTED')}`)

    if (!isAuthenticated) {
      // If not authenticated, redirect to login
      addDebug('Not authenticated, redirecting to login')
      router.replace('/admin-login')
      return
    }

    // Load Tina auth from cookie and set in localStorage
    addDebug('Setting up Tina auth')
    setupTinaAuth()
      .then((result) => {
        addDebug(`Tina auth setup complete: ${JSON.stringify(result)}`)
        
        // Verify localStorage content before redirect
        const lsAuth = localStorage.getItem('tinacms-auth')
        addDebug(`localStorage tinacms-auth exists: ${!!lsAuth}`)
        if (lsAuth) {
          try {
            const parsed = JSON.parse(lsAuth)
            addDebug(`Auth object has token: ${!!parsed.token}`)
            addDebug(`Auth object has clientId: ${!!parsed.clientId}`)
            addDebug(`Auth object has expiresAtInMs: ${!!parsed.expiresAtInMs}`)
          } catch (e) {
            addDebug(`Error parsing localStorage: ${e}`)
          }
        }
        
        // Wait a bit longer in production for scripts to load
        const timeout = process.env.NODE_ENV === 'production' ? 2000 : 1000
        addDebug(`Waiting ${timeout}ms before redirect`)
        
        // Wait a short moment to ensure script loads
        setTimeout(() => {
          // Redirect to actual admin page
          addDebug('Redirecting to /admin')
          try {
            window.location.href = '/admin?from=bridge&time=' + Date.now()
          } catch (err) {
            addDebug(`Error during redirect: ${err}`)
          }
        }, timeout)
      })
      .catch(error => {
        addDebug(`Error setting up Tina auth: ${error}`)
        router.replace('/admin-login?error=auth_setup_failed')
      })
  }, [router])

  // This function sets up the TinaCMS authentication in localStorage
  async function setupTinaAuth() {
    addDebug('setupTinaAuth: Starting')
    try {
      // Get client ID from meta tag or env
      const clientId = process.env.NEXT_PUBLIC_TINA_CLIENT_ID || ''
      addDebug(`Client ID available: ${!!clientId}`)
      
      // Get token from httpOnly cookie via a fetch to our API
      addDebug('Fetching token from API')
      const tokenResponse = await fetch('/api/auth/get-tina-token')
      
      addDebug(`Token response status: ${tokenResponse.status}`)
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        addDebug(`Error response: ${errorText}`)
        throw new Error(`Failed to retrieve token: ${tokenResponse.status} ${errorText}`)
      }
      
      const data = await tokenResponse.json()
      const token = data.token
      addDebug(`Token received: ${!!token}`)
      
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
      addDebug('Setting auth in localStorage and sessionStorage')
      localStorage.setItem('tinacms-auth', JSON.stringify(authObject))
      sessionStorage.setItem('tinacms-auth', JSON.stringify(authObject))
      
      // Verify it was set correctly
      const localStorageAuth = localStorage.getItem('tinacms-auth')
      addDebug(`Verification - localStorage auth exists: ${!!localStorageAuth}`)
      
      return {
        success: true,
        hasAuth: !!localStorageAuth
      }
    } catch (error) {
      addDebug(`Error in setupTinaAuth: ${error}`)
      return {
        success: false,
        error: String(error)
      }
    }
  }

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
      {/* Load the proxy interceptor script */}
      <Script 
        src="/admin/proxy-intercept.js" 
        onLoad={handleScriptLoad}
        onError={handleScriptError}
        strategy="beforeInteractive"
      />
      
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
