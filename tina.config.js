// TinaCMS CLI root configuration file
require('dotenv').config();

module.exports = {
  // Explicitly set the base URL for TinaCMS output
  basePath: 'http://localhost:3000',
  
  // Alternatively, try these variations
  baseUrl: 'http://localhost:3000',
  base_url: 'http://localhost:3000',
  
  // Other configs
  contentApiUrlOverride: 'http://localhost:4001/graphql',
  mediaRoot: 'uploads'
};
