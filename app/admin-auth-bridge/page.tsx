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
  
  // Simplified debug logging that only works in development
  const addDebug = (message: string) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`DEBUG: ${message}`)
    }
  }

  useEffect(() => {
    // Define environment variables for conditional logic
    const isDev = process.env.NODE_ENV !== 'production'
    const isLocal = process.env.NEXT_PUBLIC_TINA_PUBLIC_IS_LOCAL === 'true'
    
    // Only log details in development mode
    if (isDev) {
      addDebug('Admin auth bridge loading')
    }

    // Check if we have a token in the cookies
    const checkAuthStatus = async () => {
      try {
        // Fetch token from API
        const res = await fetch('/api/auth/get-tina-token')

        if (!res.ok) {
          addDebug(`Failed to authenticate: ${res.status} ${res.statusText}`)
          return
        }

        const data = await res.json()

        if (!data.token) {
          addDebug('Authentication error: No token received')
          return
        }
        
        // Only log token details in development mode
        if (isDev) {
          addDebug(`Authentication successful`)
        }

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

        if (isDev) {
          addDebug('Authentication data stored successfully')
          addDebug('Redirecting to TinaCMS admin interface')
        }
        
        // IMPORTANT: Always force redirect to /admin/index.html in all environments
        // This bypasses any potential routing issues in production
        const adminPath = '/admin/index.html';
        
        // Set a specific authorization header cookie that TinaCMS might be looking for
        // This is in addition to localStorage and sessionStorage
        document.cookie = `tinacms-auth=${encodeURIComponent(JSON.stringify(authObject))}; path=/; max-age=604800`;
        
        // Force a delay to ensure storage is set before redirect
        addDebug(`Preparing redirect to ${adminPath} in 500ms...`);
        setTimeout(() => {
          addDebug(`Redirecting now to ${adminPath}`);
          window.location.href = adminPath;
        }, 500);
        // Don't use router.push as it might be caught by TinaCMS's client-side routing
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
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      {/* Conditionally embed proxy interceptor script */}
      {/* Always include our auth hook script regardless of environment */}
      <Script
        id="tina-auth-hook"
        strategy="beforeInteractive"
        src="/scripts/tina-auth-hook.js"
        onLoad={() => addDebug('Tina auth hook script loaded')}
        onError={() => addDebug('ERROR: Failed to load Tina auth hook script')}
      />
      
      {/* Legacy scripts - keep for compatibility */}
      {process.env.NEXT_PUBLIC_TINA_PUBLIC_IS_LOCAL !== 'true' && (
        <>
          <Script
            id="proxy-intercept-script"
            strategy="beforeInteractive"
            src="/scripts/proxy-intercept.js"
            onLoad={handleScriptLoad}
            onError={handleScriptError}
          />
          
          <Script
            id="tina-api-interceptor"
            strategy="beforeInteractive"
            src="/scripts/tina-api-interceptor.js"
            onLoad={() => addDebug('Tina API interceptor script loaded')}
            onError={() => addDebug('ERROR: Failed to load Tina API interceptor script')}
          />
        </>
      )}
      <div className="w-full max-w-md bg-white p-8 shadow-md rounded-lg border border-gray-100">
        <div className="flex items-center justify-center mb-6">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 3.33331C10.8 3.33331 3.33337 10.8 3.33337 20C3.33337 29.2 10.8 36.6666 20 36.6666C29.2 36.6666 36.6667 29.2 36.6667 20C36.6667 10.8 29.2 3.33331 20 3.33331Z" fill="#2296F3"/>
            <path d="M16.6666 28.3333L8.33331 20L10.6666 17.6667L16.6666 23.6667L29.3333 11L31.6666 13.3333L16.6666 28.3333Z" fill="white"/>
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-center text-gray-800 mb-4">Accessing TinaCMS Admin</h1>
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    </div>
  )
}
