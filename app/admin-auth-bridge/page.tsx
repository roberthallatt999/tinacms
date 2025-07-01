"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

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
    
    // Load the proxy interceptor script directly
    const loadProxyScript = () => {
      try {
        // Create script element
        const script = document.createElement('script');
        script.src = `${window.location.origin}/admin/proxy-intercept-inline.js`;
        script.async = true;
        script.onload = () => addDebug('Proxy intercept script loaded successfully');
        script.onerror = () => addDebug('ERROR: Failed to load proxy intercept script');
        
        // Append to head
        document.head.appendChild(script);
        
        addDebug(`Loading proxy script from: ${script.src}`);
      } catch (error) {
        addDebug(`ERROR loading script: ${error instanceof Error ? error.message : String(error)}`);
      }
    };
    
    // Execute after a short delay to ensure DOM is ready
    setTimeout(loadProxyScript, 500);
    
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      
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
