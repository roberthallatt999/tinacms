# GitHub Authentication Setup for TinaCMS Admin

This document provides instructions for setting up GitHub OAuth authentication with your TinaCMS admin login form.

## Required Environment Variables

Add the following environment variables to your `.env` file:

```
# TinaCMS Configuration
NEXT_PUBLIC_TINA_CLIENT_ID=your_tina_client_id
TINA_TOKEN=your_tina_token

# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Change in production
```

## Setting Up GitHub OAuth Application

1. Go to your GitHub account settings
2. Navigate to "Developer settings" > "OAuth Apps" > "New OAuth App"
3. Fill in the required information:
   - **Application name**: Your app name (e.g., "My TinaCMS Admin")
   - **Homepage URL**: Your application URL (e.g., `http://localhost:3000`)
   - **Application description**: Optional description
   - **Authorization callback URL**: `http://localhost:3000/api/auth/github/callback` (use your domain in production)
4. Click "Register application"
5. You will receive a Client ID
6. Generate a Client Secret
7. Copy both the Client ID and Client Secret to your `.env` file

## Authentication Flow

The GitHub authentication flow works as follows:

1. User clicks "Sign in with GitHub" on the login form
2. User is redirected to GitHub for authorization
3. After authorization, GitHub redirects back to your callback URL
4. The callback handler exchanges the code for an access token
5. The system verifies the user and creates a TinaCMS auth token
6. User is redirected to the TinaCMS admin area

## Security Considerations

- Store your GitHub Client Secret securely
- The OAuth state parameter is used to prevent CSRF attacks
- The system uses HTTP-only cookies for storing authentication tokens
- Validate GitHub users against your allowed users list
- Consider implementing additional authorization checks

## Customization Options

You can customize the GitHub authentication integration:

- Change the scope of access requested from GitHub
- Modify the UI of the GitHub login button
- Implement organization-based access control
- Add additional social login providers

## Troubleshooting

If you encounter issues:

1. Check that all environment variables are set correctly
2. Verify the callback URL matches exactly what's registered in GitHub
3. Check server logs for errors during authentication
4. Make sure you're using HTTPS in production environments
5. Clear cookies and browser cache if experiencing unexpected behavior
