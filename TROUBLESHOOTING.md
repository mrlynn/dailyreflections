# Troubleshooting Guide

## Common Issues & Solutions

### 400 Bad Request Error

**Symptom**: `Failed to load resource: the server responded with a status of 400 (Bad Request)`

**Cause**: Database name not specified in API routes

**Solution**: ✅ **FIXED** - Added explicit database name:
```javascript
// In API routes
const db = client.db('dailyreflections');
```

**Before** (broken):
```javascript
const db = client.db(); // Uses default database
```

**After** (fixed):
```javascript
const db = client.db('dailyreflections'); // Explicit database name
```

---

### Build Errors: Functions cannot be passed to Client Components

**Symptom**: Build fails with serialization error about functions in theme

**Cause**: MUI theme contains functions that can't be serialized in server components

**Solution**: ✅ **FIXED** - Split into server/client components

**Files**:
- `src/app/layout.js` (server component)
- `src/app/providers.js` (client component with 'use client')

---

### MongoDB Connection Issues

#### Connection timeout

**Symptoms**:
- `ServerSelectionTimeoutError`
- `Connection refused`

**Solutions**:
1. Check your `.env.local` file has `MONGODB_URI`
2. Verify connection string format:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/dailyreflections?retryWrites=true&w=majority
   ```
3. Check network access in MongoDB Atlas:
   - Add your IP address (or `0.0.0.0/0` for development)
4. Verify database user credentials

#### Wrong Database

**Symptom**: Queries return no results despite data existing

**Cause**: Default database instead of `dailyreflections`

**Solution**: Always specify database name:
```javascript
const db = client.db('dailyreflections');
```

#### Authentication Failed

**Symptoms**:
- `Authentication failed`
- `bad auth`

**Solutions**:
1. Check username/password in connection string
2. Verify user has correct permissions in Atlas
3. Replace special characters in password with URL encoding:
   - `@` → `%40`
   - `#` → `%23`
   - `%` → `%25`

---

### Data Not Loading

#### Empty Collections

**Symptoms**:
- No reflections display
- "No data" messages
- Comments don't appear

**Solutions**:
1. Run seed script: `npm run seed`
2. Verify data in MongoDB Compass
3. Check collection names match exactly:
   - `reflections` (not `reflection`)
   - `comments` (not `comment`)
4. Check date format in database matches expectations

#### Date Key Mismatch

**Symptom**: Query returns no results for a known date

**Cause**: Database has different format than expected

**Check**:
```javascript
// Expected format in database
{
  month: 1,    // Number 1-12
  day: 8       // Number 1-31
}
```

**Fix**: Ensure seed script uses numbers:
```javascript
const reflection = {
  month: 1,  // ✅ Number
  day: 8     // ✅ Number
  // Not: month: "01" ❌
  // Not: day: "08" ❌
};
```

---

### Development Server Issues

#### Port Already in Use

**Error**: `Port 3000 is already in use`

**Solution**:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

#### Hot Reload Not Working

**Symptoms**: Changes not reflected in browser

**Solutions**:
1. Restart dev server: `Ctrl+C` then `npm run dev`
2. Clear `.next` folder: `rm -rf .next && npm run dev`
3. Clear browser cache: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

#### Module Not Found

**Error**: `Cannot find module '@/...'`

**Solution**: 
1. Restart dev server
2. Check `jsconfig.json` has correct paths:
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./src/*"]
       }
     }
   }
   ```

---

### Build Issues

#### Workspace Warning

**Warning**: `Next.js inferred your workspace root, but it may not be correct`

**Solution**: ✅ **FIXED** - Added to `next.config.mjs`:
```javascript
outputFileTracingRoot: path.join(__dirname, '../..')
```

#### Build Fails During Prerendering

**Error**: Pre-rendering errors on static pages

**Cause**: Server-side code accessing client-only APIs

**Solution**: Mark components with 'use client' directive

---

### Component Errors

#### MUI Theme Not Working

**Symptoms**: Default MUI styles, wrong colors

**Solutions**:
1. Verify `ThemeProvider` wraps app in `providers.js`
2. Check theme imports in `src/theme.js`
3. Restart dev server after theme changes

#### HTML Not Rendering

**Symptoms**: Comment/reflection shows raw HTML

**Solution**: Ensure DOMPurify is installed and imported:
```bash
npm install dompurify jsdom
```

---

### API Route Errors

#### 500 Internal Server Error

**Symptoms**: Server errors in API responses

**Debug**:
1. Check terminal/console for error logs
2. Look for MongoDB connection issues
3. Verify environment variables
4. Check database indexes are created

#### 404 Not Found

**Symptoms**: Reflection or comment not found

**Check**:
1. Date key format: "MM-DD" (e.g., "01-08")
2. Data exists in database for that date
3. Case-sensitive collection names

---

### Performance Issues

#### Slow Queries

**Symptoms**: API takes 5+ seconds

**Solutions**:
1. Check indexes exist:
   ```javascript
   // In MongoDB Compass or mongosh
   db.reflections.getIndexes();
   db.comments.getIndexes();
   ```

2. Add missing indexes:
   ```javascript
   // reflections
   db.reflections.createIndex({ month: 1, day: 1 });
   
   // comments
   db.comments.createIndex({ dateKey: 1, createdAt: -1 });
   db.comments.createIndex({ parentId: 1 });
   ```

---

## Quick Debug Checklist

- [ ] MongoDB Atlas cluster running
- [ ] Network access configured in Atlas
- [ ] `.env.local` file exists with `MONGODB_URI`
- [ ] Connection string includes `dailyreflections` database
- [ ] Collections named correctly: `reflections`, `comments`
- [ ] Data exists in collections (run `npm run seed`)
- [ ] Indexes created
- [ ] Database name specified in API routes
- [ ] Dev server restarted after changes

## Getting More Help

1. Check terminal output for detailed errors
2. Review MongoDB Atlas logs
3. Use MongoDB Compass to verify data
4. Check Network tab in browser DevTools
5. Review console logs in browser

## Still Stuck?

Try a clean reset:

```bash
# Remove build artifacts
rm -rf .next

# Clear node modules (if needed)
rm -rf node_modules package-lock.json
npm install

# Restart dev server
npm run dev
```

---

**Last Updated**: Database name specification fix applied
**Version**: 1.0.0

