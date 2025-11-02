# Authentication Setup Guide

## Overview

The Daily Reflections app now includes full authentication support using NextAuth.js with:
- **Email/Password** authentication
- **Google OAuth** authentication
- User profiles and session management

## Setup Instructions

### 1. Environment Variables

Add the following to your `.env.local` file:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000  # Production: https://your-domain.com
NEXTAUTH_SECRET=your-random-secret-here

# Google OAuth (Optional but recommended)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Existing variables
MONGODB_URI=mongodb+srv://...
OPENAI_API_KEY=sk-...
```

### 2. Generate NextAuth Secret

Generate a random secret for `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

Or use an online generator: https://generate-secret.vercel.app/32

### 3. Google OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-domain.com/api/auth/callback/google` (production)
7. Copy Client ID and Client Secret to `.env.local`

### 4. Database Setup

The MongoDB adapter will automatically create the necessary collections:
- `users` - User accounts
- `accounts` - OAuth account links
- `sessions` - Active sessions

No manual setup required!

### 5. Rate Limiting Indexes

Update rate limit indexes to support user-based limiting:

```bash
npm run setup-rate-limits
```

This creates indexes for both IP-based and user-based rate limiting.

## Features

### Authentication Methods

#### Email/Password
- User registration with email validation
- Secure password hashing (bcrypt)
- Minimum 8 character password requirement
- Automatic sign-in after registration

#### Google OAuth
- One-click authentication
- No password required
- Automatic account creation

### User Experience

#### Navigation
- **Not Authenticated**: Shows "Sign In" and "Sign Up" buttons
- **Authenticated**: Shows user avatar/initials with dropdown menu
  - Profile link
  - Sign out option

#### Commenting
- **Not Authenticated**: Must enter name manually
- **Authenticated**: Name is automatically filled from profile
- Comments are associated with user ID when authenticated

#### Rate Limiting
- **Authenticated**: Rate limits tracked by user ID (more accurate)
- **Not Authenticated**: Rate limits tracked by IP address

## Pages

### `/login`
- Email/password sign-in form
- Google OAuth button
- Link to registration page

### `/register`
- Registration form (name, email, password)
- Password confirmation
- Google OAuth option
- Link to login page

### `/profile`
- User profile information
- Displays name, email, user ID
- Profile picture (if available from Google)

## Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,
  email: String,          // Unique, lowercase
  password: String,       // Hashed (bcrypt) - only for email/password users
  name: String,
  image: String | null,   // Profile picture URL (from Google)
  emailVerified: Date | null,
  createdAt: Date
}
```

### Comments Collection (Updated)

```javascript
{
  // ... existing fields ...
  userId: String | null,  // User ID if authenticated, null otherwise
  author: String,         // Name/email (from session or manual entry)
}
```

### Rate Limits Collection (Updated)

```javascript
{
  // IP-based (anonymous)
  ipAddress: String,     // Unique when present
  // OR
  // User-based (authenticated)
  userId: String,         // Unique when present
  
  count: Number,
  windowStart: Date,     // TTL index (expires after 2h)
  lastRequest: Date
}
```

## Security Features

1. **Password Hashing**: Bcrypt with 12 rounds
2. **Session Management**: JWT-based sessions
3. **Rate Limiting**: Per-user when authenticated, per-IP when not
4. **Content Moderation**: Works with authenticated users
5. **Input Validation**: Email format, password strength

## Development Notes

### Testing Authentication

1. Start dev server: `npm run dev`
2. Navigate to `/login` or `/register`
3. Create an account or sign in
4. Check MongoDB `users` collection for new user

### Session Access

```javascript
// Server-side (API routes)
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const session = await getServerSession(authOptions);
const userId = session?.user?.id;

// Client-side (Components)
import { useSession } from 'next-auth/react';

const { data: session } = useSession();
const user = session?.user;
```

## Troubleshooting

### "NextAuth secret is missing"
- Add `NEXTAUTH_SECRET` to `.env.local`
- Generate using: `openssl rand -base64 32`

### "Google OAuth not working"
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- Check redirect URI matches exactly (including http vs https)
- Ensure Google+ API is enabled in Cloud Console

### "User not found in session"
- Check that `SessionProvider` wraps your app (see `providers.js`)
- Verify session cookies are being set (check browser DevTools)

### Rate limiting not working for users
- Run `npm run setup-rate-limits` to create indexes
- Verify `userId` is being stored in comments

## Production Deployment

### Vercel Deployment

1. Add environment variables in Vercel dashboard
2. Set `NEXTAUTH_URL` to your production domain
3. Update Google OAuth redirect URI to production URL

### Environment Variables Required

- `NEXTAUTH_URL` - Your production URL
- `NEXTAUTH_SECRET` - Random secret (different from dev)
- `GOOGLE_CLIENT_ID` - Production Google OAuth ID
- `GOOGLE_CLIENT_SECRET` - Production Google OAuth secret
- `MONGODB_URI` - Production MongoDB connection string

## Migration Notes

### Existing Comments

Existing comments will continue to work. The `userId` field will be `null` for pre-authentication comments.

### Anonymous Users

The app still supports anonymous commenting. If a user is not authenticated:
- They must provide a name manually
- Rate limiting uses IP address
- Comments are not linked to a user account

