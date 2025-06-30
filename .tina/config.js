// .tina/config.js - TinaCMS CLI configuration
// This is different from tina/config.tsx which is for the React components

// Import dotenv to load environment variables in the CLI context
require('dotenv').config();

// TinaCMS CLI config
export default {
  // Base URL for the admin panel
  admin: {
    // This is the correct property for replacing <your-dev-server-url>
    basePath: 'http://localhost:3000'
  },

  // For the local GraphQL server
  localGraphqlURL: 'http://localhost:4001/graphql',

  // Other TinaCMS CLI settings
  build: {
    // Makes the TinaCMS admin UI available at /admin instead of /.tina/
    outputFolder: 'admin',
    publicFolder: 'public'
  }
};
