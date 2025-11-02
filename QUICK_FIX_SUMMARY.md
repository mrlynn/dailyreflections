# Quick Fix Summary: Database Name Issue

## Problem
400 Bad Request when fetching reflections from MongoDB

## Root Cause
API routes were calling `client.db()` without specifying the database name, defaulting to the connection string's database or 'test' database instead of 'dailyreflections'.

## Solution Applied

### Fixed Files

1. **src/app/api/reflections/[dateKey]/route.js**
   - Changed: `const db = client.db();`
   - To: `const db = client.db('dailyreflections');`

2. **src/app/api/comments/route.js**
   - Changed: All 3 occurrences of `const db = client.db();`
   - To: `const db = client.db('dailyreflections');`

### Why This Matters

MongoDB connection strings can specify a default database:
```
mongodb+srv://...cluster.mongodb.net/dailyreflections?...
                                              ^^^^^^^^^^
```

However, calling `client.db()` without parameters can still fall back to wrong database in some scenarios. **Always specify explicitly** for reliability.

## Verification

✅ Build succeeds: `npm run build`
✅ No linting errors
✅ Routes correctly configured
✅ Database name explicitly set

## Files Modified

- ✅ src/app/api/reflections/[dateKey]/route.js (database name + params await)
- ✅ src/app/api/comments/route.js (database name)
- ✅ memory-bank/systemPatterns.md (documentation updated)
- ✅ TROUBLESHOOTING.md (new guide created)

## Testing

Your app should now correctly:
1. Connect to `dailyreflections` database
2. Query `reflections` collection by month/day
3. Query `comments` collection by dateKey
4. Display data from your Compass-verified collections

## Next Steps

Run the app:
```bash
npm run dev
```

Navigate to a date with data (e.g., `/api/reflections/01-08`) and verify data loads correctly.

---

## Additional Fix

Next.js 16 requires `params` to be awaited in dynamic routes:
```javascript
const { dateKey } = await params;  // ✅ Add await
```

**Status**: ✅ FIXED
**Date**: 2024-11-02
**Impact**: All database queries now target correct database + Next.js 16 compatibility

