# Daily Reflections App - Complete Setup Guide

This comprehensive guide will help you get the Daily Reflections app up and running.

## Quick Start (5 Minutes)

```bash
# 1. Install dependencies
npm install

# 2. Set up MongoDB Atlas (free tier works!)
# See detailed instructions below

# 3. Configure environment
cp .env.local.example .env.local
# Edit .env.local with your MongoDB URI

# 4. Seed database
npm run seed

# 5. Run app
npm run dev
```

## Detailed Setup

### Step 1: MongoDB Atlas Setup

#### Option A: New MongoDB Atlas Cluster

1. **Create Account**: Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. **Create Free Cluster**: Click "Build a Database" → Select FREE tier (M0)
3. **Choose Provider**: AWS recommended, select region close to you
4. **Wait for Creation**: Takes 1-3 minutes

#### Connection Setup

1. **Create Database User**:
   - Go to "Database Access" in left sidebar
   - Click "Add New Database User"
   - Username: `admin` (or your choice)
   - Password: Generate or create your own
   - **SAVE PASSWORD** (you'll need it!)
   - Privileges: "Atlas Admin"

2. **Set Network Access**:
   - Go to "Network Access" in left sidebar
   - Click "Add IP Address"
   - For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Use specific IPs

3. **Get Connection String**:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `dailyreflections`

Example:
```
mongodb+srv://admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/dailyreflections?retryWrites=true&w=majority
```

#### Option B: Existing Cluster

If you already have a MongoDB Atlas cluster, just get your connection string and add the database name.

### Step 2: Environment Configuration

```bash
# Copy example file
cp .env.local.example .env.local

# Edit with your favorite editor
nano .env.local  # or code, vim, etc.
```

**Required Variables:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dailyreflections?retryWrites=true&w=majority
```

**Optional:**
```env
NEXT_PUBLIC_TIMEZONE=America/New_York
NODE_ENV=development
```

### Step 3: Database Seeding

The seed script will:
- Create collections (`reflections` and `comments`)
- Add indexes for optimal performance
- Insert sample data (5 reflections, 3 comments)

```bash
npm run seed
```

**Expected Output:**
```
Connecting to MongoDB...
Creating collections...
Creating indexes...
Inserting sample reflections...
Inserted 5 reflections
Inserting sample comments...
Inserted 3 comments

✅ Seed completed successfully!

To verify:
  Reflections: 5 documents
  Comments: 3 documents
```

### Step 4: Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

You should see:
- Today's reflection (or January 8 if no data exists for today)
- Working date navigation
- Comment section
- Clean MongoDB-inspired UI

## Verifying Everything Works

### Test Reflections API

```bash
curl http://localhost:3000/api/reflections/01-08
```

Should return the reflection data.

### Test Comments API

```bash
curl http://localhost:3000/api/comments?dateKey=01-08
```

Should return the comments array.

### Test UI Features

1. **Navigate Dates**: Click prev/next buttons
2. **Input Date**: Type a date in MM-DD format
3. **Post Comment**: Enter name and comment, click "Post Comment"
4. **Reply to Comment**: Click "Reply" on a comment
5. **Expand/Collapse**: Click "Show/Hide X replies" for nested comments

## Common Issues

### "Cannot connect to MongoDB"

**Solutions:**
1. Check `.env.local` has correct MONGODB_URI
2. Verify password is correct (no special characters if not URL-encoded)
3. Check network access in Atlas dashboard
4. Try `ping cluster.mongodb.net` to test connectivity

### "Module not found" Errors

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### "Collection already exists" Error

**Solution:** The seed script won't overwrite existing data. To start fresh:
```bash
# Manually delete collections in MongoDB Atlas dashboard
# Or use MongoDB Compass or mongosh
```

### Port 3000 Already in Use

**Solution:**
```bash
# Use different port
PORT=3001 npm run dev

# Or kill process on port 3000
lsof -ti:3000 | xargs kill -9  # macOS/Linux
```

### Seed Script Fails

**Common Causes:**
1. Missing `.env.local` file
2. Incorrect MONGODB_URI
3. Network/Authentication issues

**Debug:**
```bash
# Check if dotenv is loading correctly
node -e "require('dotenv').config({ path: '.env.local' }); console.log(process.env.MONGODB_URI);"

# Run seed with more verbose output
DEBUG=* npm run seed
```

## Production Deployment

### Deploy to Vercel

1. **Push to GitHub**:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variable: `MONGODB_URI`
   - Deploy!

3. **Domain Setup**: Vercel automatically provides a domain

### Deploy to Other Platforms

**Heroku, Railway, Render, etc.**:
- Add `MONGODB_URI` as environment variable
- Ensure Node.js 18+ is available
- Build command: `npm run build`
- Start command: `npm start`

## Next Steps

### Adding More Data

To add more reflections beyond the seed data:

1. **Using MongoDB Atlas Dashboard**:
   - Go to your cluster → "Browse Collections"
   - Click "Insert Document"
   - Follow the schema (see README.md)

2. **Using a Script**:
   - Extend `scripts/seed.js`
   - Add more entries to `sampleReflections` array
   - Run `npm run seed` (won't duplicate existing)

### Customization

**Change Theme Colors**: Edit `src/theme.js`

**Modify Layout**: Edit `src/app/page.js`

**Update Styling**: Edit component files in `src/components/`

### Performance Optimization

Already implemented:
- ✅ MongoDB indexes
- ✅ Connection pooling
- ✅ Incremental Static Regeneration (ISR)
- ✅ Efficient comment tree building

Consider adding:
- Server-side caching (Redis)
- CDN for static assets
- Rate limiting for API
- Pagination for large comment threads

## Getting Help

1. **Check README.md** for API documentation
2. **Review Memory Bank** in `memory-bank/` folder
3. **Examine Code** in `src/` directory
4. **Test Endpoints** with curl or Postman
5. **Check Logs**: Look at terminal output for errors

## Architecture Reference

See `memory-bank/systemPatterns.md` for detailed architecture documentation.

---

**Ready to build?** Start by running `npm run dev` and exploring the app! 🚀

