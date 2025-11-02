# Quick Fix: NextAuth 500 Error

## Immediate Steps

### 1. Add Missing Environment Variables

Add to `.env.local`:

```env
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=generate-a-secret-here
```

### 2. Generate Secret

Run this command:

```bash
openssl rand -base64 32
```

Copy the output and paste it as `NEXTAUTH_SECRET` in `.env.local`

### 3. Restart Dev Server

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

## Common Causes

1. **Missing NEXTAUTH_SECRET** - Required for JWT signing
2. **Wrong NEXTAUTH_URL** - Must match your dev server port (3001 in your case)
3. **MongoDB Connection** - Adapter needs working MongoDB connection

## Verify Fix

1. Check terminal for warnings about missing env vars
2. Visit: `http://localhost:3001/api/auth/providers`
3. Should return JSON with available providers (no 500 error)

## If Still Failing

Check server terminal output for specific error messages - they'll point to the exact issue.

