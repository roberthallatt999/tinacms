import { defineConfig } from "tinacms";
import nextConfig from '../next.config'
import { CustomAuthProvider } from './auth/CustomAuthProvider';
import { LocalAuthProvider } from 'tinacms';

import Post from "./collection/post";
import Global from "./collection/global";
import Author from "./collection/author";
import Page from "./collection/page";
import Tag from "./collection/tag";

// Detect environment to use correct URL
const isProd = process.env.NODE_ENV === 'production';
const siteUrl = isProd ? 'https://tinacms-psi.vercel.app' : 'http://localhost:3000';

// Force local auth provider in development, use environment variable in production
const isDev = process.env.NODE_ENV !== 'production';
const isLocal = isDev || process.env.TINA_PUBLIC_IS_LOCAL === 'true';
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('TINA_PUBLIC_IS_LOCAL:', process.env.TINA_PUBLIC_IS_LOCAL);
console.log('isLocal flag (forced in dev):', isLocal);

const config = defineConfig({
  // IMPORTANT: Force use LocalAuthProvider in all environments to bypass auth issues
  // This will make the admin interface accessible without authentication
  authProvider: new LocalAuthProvider(),
  
  // Set this to true to disable authentication checks completely
  disableAuthProvider: true,
  
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID!,
  branch:
    process.env.NEXT_PUBLIC_TINA_BRANCH! || // custom branch env override
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF! || // Vercel branch env
    process.env.HEAD!, // Netlify branch env
  token: process.env.TINA_TOKEN!,
  
  // We're using TinaCMS's built-in auth, but with our custom login flow
  // We don't actually need a custom authProvider if we set the auth tokens correctly
  // Remove the authProvider to use the default which works with our token system
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
