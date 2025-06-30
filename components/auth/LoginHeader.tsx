'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function LoginHeader() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Wait for component to mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-16"></div>;

  return (
    <div className="mb-10 text-center">
      <div className="flex justify-center mb-4">
        {/* Logo image - you can replace with your actual logo */}
        {resolvedTheme === 'dark' ? (
          <Image
            src="/logo-light.svg"
            alt="TinaCMS Logo"
            width={150}
            height={40}
            className="h-12 w-auto"
            priority
            onError={(e) => {
              // Fallback if image doesn't exist
              const target = e.target as HTMLImageElement;
              target.src = "/logo.svg";
            }}
          />
        ) : (
          <Image
            src="/logo.svg"
            alt="TinaCMS Logo"
            width={150}
            height={40}
            className="h-12 w-auto"
            priority
            onError={(e) => {
              // Fallback to text if image doesn't exist
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                const textLogo = document.createElement('div');
                textLogo.textContent = 'TinaCMS Admin';
                textLogo.className = 'text-2xl font-bold';
                parent.appendChild(textLogo);
              }
            }}
          />
        )}
      </div>
      <h2 className="text-3xl font-bold tracking-tight">
        Welcome back
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
        Sign in to access your content management dashboard
      </p>
    </div>
  );
}
