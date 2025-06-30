#!/usr/bin/env node

/**
 * This script patches the TinaCMS CLI output to replace placeholders
 * It uses environment variables from process.env
 */

const fs = require('fs');
const path = require('path');

// Base URL for dev server
const DEV_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Find TinaCMS CLI package
const tinaCLIPath = path.resolve(
  __dirname, 
  '../node_modules/@tinacms/cli'
);

// Paths to potential files containing the placeholder
const targetFiles = [
  path.join(tinaCLIPath, 'dist', 'index.js'),
  path.join(tinaCLIPath, 'dist', 'commands', 'dev', 'index.js'),
  path.join(tinaCLIPath, 'dist', 'server', 'index.js')
];

// Look for the placeholder "<your-dev-server-url>" and replace it
function replacePlaceholderInFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return false;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file contains the placeholder
    if (!content.includes('<your-dev-server-url>')) {
      return false;
    }
    
    // Replace the placeholder with the actual URL
    const updatedContent = content.replace(
      /<your-dev-server-url>/g, 
      DEV_URL
    );
    
    fs.writeFileSync(filePath, updatedContent);
    console.log(`✅ Updated ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

// Run the replacements
console.log(`🔍 Searching for placeholder in TinaCMS files...`);
let replacedCount = 0;

targetFiles.forEach(file => {
  if (replacePlaceholderInFile(file)) {
    replacedCount++;
  }
});

if (replacedCount > 0) {
  console.log(`\n✅ Successfully replaced ${replacedCount} instances of placeholder URLs`);
  console.log(`🚀 The dev server will now show ${DEV_URL} instead of <your-dev-server-url>\n`);
} else {
  console.log(`\n⚠️ Could not find placeholder in expected files. You may need to search manually.`);
}
