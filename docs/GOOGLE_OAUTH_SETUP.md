# Google OAuth Setup Guide

This guide will help you complete the Google OAuth implementation for Sign in with Google.

## Current Implementation Status

✅ Google OAuth is already integrated into the codebase:
- NextAuth is configured with GoogleProvider
- Login and Register pages have "Continue with Google" buttons
- OAuth flow is implemented in `/app/api/auth/[...nextauth]/route.js`

## Required: Google Cloud Console Configuration

### Step 1: Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. If prompted, configure the OAuth consent screen first:
   - User Type: **External** (unless you have a Google Workspace)
   - App name: **AA Companion** or **Daily Reflections**
   - User support email: Your email
   - Developer contact: Your email
   - Add scopes: `email`, `profile`, `openid` (these are usually pre-selected)

### Step 2: Configure OAuth Client

1. **Application type**: Select **Web application**
2. **Name**: Give it a name (e.g., "AA Companion Web Client")

### Step 3: Add Authorized Redirect URIs

Add these **exact** redirect URIs to your OAuth client:

#### Development (Local)
```
http://localhost:3001/api/auth/callback/google
```

#### Production
```
https://your-production-domain.com/api/auth/callback/google
```

**Important Notes:**
- Replace `your-production-domain.com` with your actual production domain
- The path `/api/auth/callback/google` is the NextAuth default callback route
- Do NOT include trailing slashes
- Each URI must be added separately
- Google is case-sensitive with these URIs

### Step 4: Get Your Credentials

After creating the OAuth client, you'll receive:
- **Client ID** (starts with something like `123456789-abcdefg.apps.googleusercontent.com`)
- **Client Secret** (a long string)

### Step 5: Add Environment Variables

Add these to your `.env.local` file (or production environment variables):

```bash
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here

# NextAuth Configuration (if not already set)
NEXTAUTH_URL=http://localhost:3001  # Development
# NEXTAUTH_URL=https://your-production-domain.com  # Production
NEXTAUTH_SECRET=your-secret-key-here
```

## How It Works

1. User clicks "Continue with Google" on login/register page
2. User is redirected to Google's OAuth consent screen
3. After consent, Google redirects to: `YOUR_DOMAIN/api/auth/callback/google`
4. NextAuth handles the callback and creates/updates the user session
5. User is redirected back to the app (default: home page)

## Testing

1. Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in your `.env.local`
2. Restart your development server: `npm run dev`
3. Navigate to `/login` or `/register`
4. Click "Continue with Google"
5. You should be redirected to Google's sign-in page
6. After signing in, you should be redirected back to your app

## Troubleshooting

### Error: "redirect_uri_mismatch"
- **Cause**: The redirect URI in Google Cloud Console doesn't match your app's URL
- **Fix**: Double-check that you've added the exact URI: `http://localhost:3001/api/auth/callback/google`
- **Note**: Port number must match (3001 in your case)

### Error: "invalid_client"
- **Cause**: Client ID or Client Secret is incorrect
- **Fix**: Verify your environment variables are set correctly

### Google Sign-In Button Not Showing
- **Cause**: `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` not set
- **Fix**: Add the environment variables and restart the server

### User Created But Session Not Working
- **Cause**: MongoDB adapter issue or NEXTAUTH_SECRET not set
- **Fix**: Ensure `NEXTAUTH_SECRET` is set and MongoDB connection is working

## Production Deployment

When deploying to production:

1. **Update Redirect URIs** in Google Cloud Console:
   - Add your production domain: `https://yourdomain.com/api/auth/callback/google`
   - Keep the development URI for local testing

2. **Set Production Environment Variables**:
   ```bash
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   NEXTAUTH_URL=https://yourdomain.com
   NEXTAUTH_SECRET=your-production-secret
   ```

3. **OAuth Consent Screen**:
   - For production, you may need to submit your app for verification if:
     - You're requesting sensitive scopes
     - Your app is used by users outside your organization
   - For basic scopes (email, profile), verification usually isn't required

## Security Best Practices

1. **Never commit** `.env.local` or environment variables to git
2. **Use different** OAuth credentials for development and production
3. **Rotate secrets** periodically in production
4. **Monitor** OAuth usage in Google Cloud Console
5. **Set up** OAuth consent screen properly with accurate app information

## Additional Resources

- [NextAuth.js Google Provider Docs](https://next-auth.js.org/providers/google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)

