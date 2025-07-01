'use client'

import React, { useEffect } from 'react'
import { useTinaProxy } from '../../lib/hooks/use-tina-proxy'
import Script from 'next/script'

interface TinaAdminWrapperProps {
  children: React.ReactNode
}

/**
 * Wrapper component for TinaCMS admin interface
 * This ensures our proxy intercept script is loaded
 * and authentication is properly set up
 */
export default function TinaAdminWrapper({ children }: TinaAdminWrapperProps) {
  const { isProxyLoaded, isAuthenticated } = useTinaProxy()
  
  useEffect(() => {
    // Apply any additional TinaCMS configuration or setup here
    if (isAuthenticated && isProxyLoaded) {
      console.log('TinaAdminWrapper: Proxy loaded and authenticated')
    }
  }, [isAuthenticated, isProxyLoaded])

  return (
    <>
      {/* Load proxy script directly */}
      <Script
        id="tina-proxy-intercept"
        src="/admin/proxy-intercept.js"
        strategy="beforeInteractive"
      />
      
      {/* Pass children through */}
      {children}
    </>
  )
}
