/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable Turbopack for now to avoid module resolution issues
  // This forces Next.js to use Webpack
  experimental: {
    // This might be needed for older Next.js versions, but might be deprecated in newer ones.
    // If it causes an error, remove it.
    // webpack: true,
  },

  webpack: (config, { isServer }) => {
    // Add polyfills for Node.js modules if needed
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        path: require.resolve('path-browserify'),
        buffer: require.resolve('buffer'),
      };

    }
    return config;
  },
};

module.exports = nextConfig;
