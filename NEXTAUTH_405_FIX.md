# Fixing NextAuth 405 Method Not Allowed Error

## Issue

Getting `405 Method Not Allowed` on `/api/auth/error` endpoint.

## Root Causes

1. **NextAuth Handler Export**: Incorrect handler structure
2. **MongoDB Adapter**: Failing to initialize (causes cascading errors)
3. **Route Catching**: The catch-all route `[...nextauth]` must handle all methods

## Solution Applied

### 1. Fixed Handler Export

The handler now properly exports GET and POST:

```javascript
const handler = NextAuth(authOptions);
export const { GET, POST } = handler;
```

### 2. MongoDB Adapter Error Handling

Added try-catch around adapter initialization to prevent cascading failures.

### 3. Environment Variables

Ensure these are set in `.env.local`:

```env
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-here
MONGODB_URI=mongodb+srv://...
```

## Testing

1. **Check providers endpoint:**
   ```
   curl http://localhost:3001/api/auth/providers
   ```
   Should return JSON (not 405 or 500).

2. **Check session endpoint:**
   ```
   curl http://localhost:3001/api/auth/session
   ```
   Should return session data or empty object.

3. **Restart server:**
   - Stop: Ctrl+C
   - Start: `npm run dev`
   - Check terminal for warnings about missing env vars

## If Still Getting 405

1. **Clear browser cache and cookies**
2. **Check server terminal** for initialization errors
3. **Verify MongoDB connection** is working
4. **Check Next.js version compatibility** with NextAuth v5 beta

## Debug Steps

1. Add console.log to see what NextAuth returns:
   ```javascript
   const handler = NextAuth(authOptions);
   console.log('Handler structure:', Object.keys(handler));
   export const { GET, POST } = handler;
   ```

2. Check server logs for:
   - MongoDB connection errors
   - NextAuth initialization warnings
   - Missing environment variable warnings

3. Test without adapter (JWT-only):
   - Remove `adapter: MongoDBAdapter(clientPromise)`
   - See if error persists
   - If fixed, MongoDB connection is the issue

