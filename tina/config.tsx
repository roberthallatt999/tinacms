import { defineConfig } from "tinacms";
import nextConfig from '../next.config'

import Post from "./collection/post";
import Global from "./collection/global";
import Author from "./collection/author";
import Page from "./collection/page";
import Tag from "./collection/tag";

// Detect environment to use correct URL
const isProd = process.env.NODE_ENV === 'production';
const siteUrl = isProd ? 'https://tinacms-psi.vercel.app' : 'http://localhost:3000';

const config = defineConfig({
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID!,
  branch:
    process.env.NEXT_PUBLIC_TINA_BRANCH! || // custom branch env override
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF! || // Vercel branch env
    process.env.HEAD!, // Netlify branch env
  token: process.env.TINA_TOKEN!,
  
  // Custom auth provider to bypass TinaCMS Cloud login
  authProvider: {
    authenticate: async () => {
      // Check for our custom auth token from localStorage
      if (typeof window !== 'undefined') {
        // If we already have Tina auth setup from our custom login, return it
        const token = localStorage.getItem('tina.auth.token');
        const clientId = localStorage.getItem('tina.auth.clientId');
        
        if (token && clientId) {
          return {
            status: 'success',
            token,
            user: {
              name: 'Custom User',
              email: 'user@example.com'
            }
          };
        }
      }
      
      // If not authenticated, redirect to our custom login page
      window.location.href = '/admin-login';
      return { status: 'error', error: 'Not authenticated' };
    },
    // The logout function should clear our custom auth and redirect to login
    logout: async () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('tina.auth.token');
        localStorage.removeItem('tina.auth.clientId');
        localStorage.removeItem('tina.auth.expiresAt');
        localStorage.removeItem('tinaAuthToken');
        window.location.href = '/admin-login';
      }
    },
  },
  // Note: TinaCMS will use NEXT_PUBLIC_APP_URL in production when properly configured
  // This is handled by environment variables rather than direct config
  media: {
    // If you wanted cloudinary do this
    // loadCustomStore: async () => {
    //   const pack = await import("next-tinacms-cloudinary");
    //   return pack.TinaCloudCloudinaryMediaStore;
    // },
    // this is the config for the tina cloud media store
    tina: {
      publicFolder: "public",
      mediaRoot: "uploads",
    },
  },
  build: {
    publicFolder: "public", // The public asset folder for your framework
    outputFolder: "admin", // within the public folder
    basePath: nextConfig.basePath?.replace(/^\//, '') || '', // The base path of the app (could be /blog)
    // Note: We can't set host directly in build due to TypeScript constraints
  },
  schema: {
    collections: [Page, Post, Author, Tag, Global],
  },
});

export default config;
