# Production Deployment Guide: Art Director Agent

## Overview

The Art Director Agent is designed to work seamlessly in both **development** (local filesystem) and **production** (Vercel + S3/R2) environments.

## Environment Detection

The system automatically detects the environment:

```javascript
function isProduction() {
  return process.env.VERCEL || process.env.NODE_ENV === 'production';
}
```

## Storage Strategy by Environment

### Development (Local)
```
Generate → Approve → Save to public/reflections/ → Serve from /reflections/
```

- **Storage**: Local filesystem (`public/reflections/`)
- **URL**: `/reflections/12-02.jpg`
- **Commits**: Images can be committed to git if desired
- **Fast**: No network calls for storage

### Production (Vercel)
```
Generate → Approve → Upload to S3/R2 → Serve from CDN → Update reflection
```

- **Storage**: Cloudflare R2 or AWS S3
- **URL**: `https://cdn.example.com/reflections/12-02.jpg`
- **CDN**: Automatic via S3/R2
- **Scalable**: No filesystem limits

## Required Environment Variables

Add these to your Vercel project:

```bash
# S3/R2 Configuration
S3_REGION=auto                                    # 'auto' for R2, 'us-east-1' for AWS
S3_ENDPOINT=https://xxx.r2.cloudflarestorage.com  # Your R2/S3 endpoint
S3_ACCESS_KEY_ID=your_access_key                  # R2/S3 access key
S3_SECRET_ACCESS_KEY=your_secret_key              # R2/S3 secret key
S3_BUCKET=dailyreflections                        # Your bucket name
S3_FORCE_PATH_STYLE=true                          # For R2/MinIO compatibility

# Optional: Custom CDN URL
CDN_BASE_URL=https://cdn.yourdomain.com           # If using custom domain
```

## How It Works in Production

### 1. Admin Generates Art
```
POST /api/admin/agents/art-director/generate
```
- Agent fetches reflection content
- Calls DALL-E 3 API
- Stores metadata in `generated_arts` collection
- Image URL: OpenAI CDN (temporary, expires ~1 hour)

### 2. Admin Reviews in Dashboard
```
GET /admin/art-director → Gallery Tab
```
- Shows preview from OpenAI CDN
- Admin sees "Approve & Deploy" button
- Image still temporary

### 3. Admin Approves
```
POST /api/admin/agents/art-director/approve
```

**What happens:**

```javascript
// 1. Download from OpenAI CDN
const response = await fetch(generatedArt.image.url);
const buffer = Buffer.from(await response.arrayBuffer());

// 2. Upload to S3/R2
const cdnUrl = await uploadToS3({
  key: 'reflections/12-02.jpg',
  buffer,
  contentType: 'image/jpeg',
});
// Returns: https://dailyreflections.xxx.r2.cloudflarestorage.com/reflections/12-02.jpg

// 3. Update database
await Reflection.updateOne(
  { month: 12, day: 2 },
  { $set: { 'image.url': cdnUrl } }
);

// 4. Image now live!
```

### 4. Users See New Image
```
https://yourdomain.com/12-02
```
- `EnhancedReflectionCard` loads reflection
- Displays `reflection.image.url`
- Image served from S3/R2 CDN
- Fast, cached, permanent

## Vercel Deployment Considerations

### ✅ What Works on Vercel

1. **API Routes** - Serverless functions work perfectly
2. **S3 Uploads** - No filesystem needed
3. **MongoDB** - Connects via Atlas
4. **Agent Logic** - All LangGraph code runs fine
5. **DALL-E API** - No issues calling OpenAI

### ❌ What Doesn't Work on Vercel

1. **Writing to `public/`** - Filesystem is read-only
2. **Persistent `/tmp`** - Cleared after function execution
3. **Long-running processes** - 10-second function timeout (Pro: 60s)

## S3/R2 Setup

### Cloudflare R2 (Recommended - Cheaper)

**Why R2?**
- $0/GB for egress (bandwidth)
- $0.015/GB storage
- S3-compatible API
- Free tier: 10GB storage, 1M requests/month

**Setup:**

1. **Create R2 Bucket:**
   ```bash
   # In Cloudflare Dashboard
   R2 → Create Bucket → "dailyreflections"
   ```

2. **Generate API Token:**
   ```bash
   R2 → Manage R2 API Tokens → Create API Token
   # Scope: Read & Write for "dailyreflections"
   ```

3. **Get Endpoint:**
   ```
   Format: https://<account-id>.r2.cloudflarestorage.com
   Found in: R2 bucket details page
   ```

4. **Set Public Access (Optional):**
   ```bash
   # If you want images publicly accessible
   R2 Bucket Settings → Public Access → Allow
   ```

5. **Custom Domain (Optional):**
   ```bash
   # Map cdn.yourdomain.com → R2 bucket
   R2 → Connect Domain → cdn.yourdomain.com
   # Then set CDN_BASE_URL=https://cdn.yourdomain.com
   ```

### AWS S3 (Alternative)

**Setup:**

1. **Create Bucket:**
   ```bash
   aws s3 mb s3://dailyreflections --region us-east-1
   ```

2. **Set Public Access:**
   ```bash
   aws s3api put-bucket-acl --bucket dailyreflections --acl public-read
   ```

3. **Create IAM User:**
   ```bash
   # Create user with S3 write permissions
   # Save access key and secret
   ```

4. **Environment Variables:**
   ```bash
   S3_REGION=us-east-1
   S3_BUCKET=dailyreflections
   S3_ACCESS_KEY_ID=AKIA...
   S3_SECRET_ACCESS_KEY=...
   ```

## Testing Production Behavior Locally

You can test the S3 upload flow locally:

```bash
# Set environment variables in .env.local
VERCEL=1  # Tricks system into "production" mode
S3_ENDPOINT=https://xxx.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=your_key
S3_SECRET_ACCESS_KEY=your_secret
S3_BUCKET=dailyreflections

# Run dev server
npm run dev

# Now approvals will upload to S3 instead of local filesystem
```

## Deployment Checklist

Before deploying to Vercel:

- [ ] S3/R2 bucket created
- [ ] API credentials generated
- [ ] Environment variables added to Vercel project
- [ ] Test upload with `VERCEL=1` locally
- [ ] Verify images accessible at CDN URL
- [ ] Check CORS settings if serving from different domain
- [ ] Monitor costs in S3/R2 dashboard

## Monitoring & Costs

### Cost Estimates (R2)

**Storage:**
- 365 images × 250KB = ~91MB
- Cost: $0.015/GB × 0.091GB = **$0.001/month**

**Bandwidth:**
- 10,000 views/month × 250KB = 2.5GB
- Cost: **$0** (R2 has free egress)

**Requests:**
- 10,000 requests
- Cost: **$0** (under 1M free tier)

**Total: ~$0.01/month**

### Cost Estimates (S3)

**Storage:**
- 365 images × 250KB = ~91MB
- Cost: $0.023/GB × 0.091GB = **$0.002/month**

**Bandwidth:**
- 10,000 views/month × 250KB = 2.5GB
- Cost: $0.09/GB × 2.5GB = **$0.23/month**

**Requests:**
- 10,000 GET requests
- Cost: $0.0004/1000 × 10 = **$0.004/month**

**Total: ~$0.24/month**

### Monitoring

```javascript
// Track storage usage
const stats = await GeneratedArt.aggregate([
  { $group: {
    _id: null,
    total_images: { $sum: 1 },
    total_size: { $sum: '$image.size_bytes' },
    total_cost: { $sum: '$generation.cost_usd' }
  }}
]);

console.log(`Storage: ${stats.total_size / 1024 / 1024}MB`);
console.log(`Generation cost: $${stats.total_cost}`);
```

## Troubleshooting

### Images Not Appearing After Approval

**Check:**
1. Vercel function logs: `vercel logs --follow`
2. S3 bucket contents: `aws s3 ls s3://dailyreflections/reflections/`
3. Database: `db.reflections.findOne({ month: 12, day: 2 })`
4. CDN URL accessible: `curl <cdn-url>`

### 403 Forbidden on Image URLs

**Fix:** Ensure bucket has public-read ACL:
```bash
aws s3api put-object-acl --bucket dailyreflections --key reflections/12-02.jpg --acl public-read
```

### Approval Takes Too Long / Times Out

**Issue:** Vercel free tier has 10-second timeout.

**Solutions:**
1. Upgrade to Pro ($20/month, 60s timeout)
2. Move approval to background job
3. Pre-download during generation

### Environment Variables Not Working

**Check:**
1. Variables set in Vercel dashboard (Settings → Environment Variables)
2. Redeployed after adding variables
3. Variables not in `.env.local` on Vercel

## Future Enhancements

1. **Background Jobs**
   - Use Vercel Cron or Inngest
   - Queue approvals for async processing

2. **Image Optimization**
   - Resize/compress before upload
   - Generate multiple sizes (thumbnail, full)
   - WebP conversion

3. **CDN Invalidation**
   - Clear cache when image updated
   - Integrate with Cloudflare API

4. **Batch Operations**
   - Approve multiple images at once
   - Bulk upload to S3

5. **Analytics**
   - Track view counts per image
   - Monitor bandwidth usage
   - Cost per image breakdown
