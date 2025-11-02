# NextAuth Error Troubleshooting

## Error: "Failed to execute 'json' on 'Response': Unexpected end of JSON input"

This error typically occurs when NextAuth receives an empty or malformed response. Here's how to fix it:

### Common Causes & Solutions

#### 1. Missing Environment Variables

**Check your `.env.local` file:**

```env
NEXTAUTH_URL=http://localhost:3000  # Required!
NEXTAUTH_SECRET=your-secret-here    # Required!
```

**Solution:**
- Generate a secret: `openssl rand -base64 32`
- Set `NEXTAUTH_URL` to your exact domain (no trailing slash)

#### 2. Google OAuth Configuration

If Google OAuth is configured but credentials are missing/invalid:

**Solution:**
- The app now conditionally loads Google provider only if credentials exist
- Remove `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from `.env.local` if not using Google OAuth
- Or configure them properly in Google Cloud Console

#### 3. MongoDB Connection Issues

**Check:**
- `MONGODB_URI` is set correctly
- MongoDB Atlas network access allows your IP
- Database connection is working

**Solution:**
- Test connection: `npm run seed` (should work without errors)
- Check MongoDB Atlas dashboard for connection issues

#### 4. Development vs Production

**Development:**
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=development-secret-change-in-production
```

**Production:**
```env
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=strong-random-secret
```

### Quick Fix Checklist

1. ✅ `NEXTAUTH_SECRET` is set in `.env.local`
2. ✅ `NEXTAUTH_URL` matches your current domain exactly
3. ✅ Google OAuth credentials are valid (if using Google)
4. ✅ MongoDB connection is working
5. ✅ Restart dev server after changing `.env.local`

### Testing NextAuth

1. **Check if auth endpoint responds:**
   ```
   curl http://localhost:3000/api/auth/providers
   ```
   Should return JSON with available providers.

2. **Check browser console:**
   - Look for CORS errors
   - Check Network tab for `/api/auth/*` requests
   - Verify responses are JSON

3. **Check server logs:**
   - Look for NextAuth debug messages
   - Check for MongoDB connection errors

### Debug Mode

The app has debug mode enabled in development. Check your console for:
- NextAuth debug messages
- Session creation/validation logs
- Authentication flow errors

### If Error Persists

1. Clear browser cookies for localhost
2. Restart Next.js dev server
3. Check MongoDB collections exist:
   - `users`
   - `accounts`
   - `sessions`
4. Verify `.env.local` is in project root (not nested)

