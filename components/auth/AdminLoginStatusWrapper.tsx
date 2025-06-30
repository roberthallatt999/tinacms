'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import AdminLoginStatus to avoid server-side rendering
const AdminLoginStatus = dynamic(() => import('./AdminLoginStatus'), {
  ssr: false,
});

export default function AdminLoginStatusWrapper() {
  const [isMounted, setIsMounted] = useState(false);

  // Wait until after hydration to render
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return <AdminLoginStatus />;
}
