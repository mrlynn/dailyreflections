# Art Director Approval Workflow (Option C)

## Overview

The Art Director Agent uses a **post-processing approval workflow** to ensure quality control before deploying generated artwork to production. This prevents low-quality or inappropriate images from reaching end users.

## Workflow Steps

### 1. Generation Phase
```
Admin Dashboard → Generate Art → DALL-E 3 → generated_arts collection
```

- Admin triggers art generation from the dashboard
- Agent processes request through LangGraph workflow
- DALL-E 3 generates Ghibli-style artwork
- Images stored at temporary OpenAI CDN URLs
- Metadata saved to `generated_arts` MongoDB collection
- Status: `completed`, `quality_review.approved`: `undefined`

### 2. Review Phase
```
Gallery Tab → View Generated Art → Approve/Reject Decision
```

- Admin reviews generated artwork in the Gallery tab
- Each artwork shows:
  - Preview image
  - Art type (daily_reflection, step_illustration, etc.)
  - Reference value (date, step number, etc.)
  - Status chips (completed, deployed, rejected)
- Approve/Reject buttons available for completed artwork

### 3. Approval Action
```
Click "Approve & Deploy" → Download Image → Update Database → Deploy to Production
```

**What happens when approved:**

1. **Image Download**
   - Downloads image from OpenAI CDN (before it expires)
   - Saves to `public/reflections/[MM-DD].jpg`
   - Example: `public/reflections/12-02.jpg`

2. **Update GeneratedArt Document**
   ```javascript
   {
     image: {
       stored_url: "/reflections/12-02.jpg",  // Permanent storage
       url: "https://oaidalleapi..."          // Original CDN (for reference)
     },
     quality_review: {
       approved: true,
       approved_by: ObjectId("admin_user_id"),
       approved_at: ISODate("2025-12-02T...")
     },
     usage: {
       first_used_at: ISODate("..."),
       last_used_at: ISODate("..."),
       usage_count: 1
     }
   }
   ```

3. **Update Reflection Document**
   ```javascript
   db.reflections.updateOne(
     { month: 12, day: 2 },
     {
       $set: {
         "image.url": "/reflections/12-02.jpg",
         "image.path": "/full/path/to/public/reflections/12-02.jpg",
         "image.size": 251059,
         "image.dateKey": "12-02",
         "image.status": "completed",
         "image.generatedAt": ISODate("..."),
         "image.generated_art_id": "art_12_02_abc123"
       }
     }
   )
   ```

4. **Deploy to Production**
   - Image now served from `/reflections/12-02.jpg`
   - EnhancedReflectionCard displays new artwork
   - Users see the Ghibli-style image on the reflection page

### 4. Rejection Action
```
Click "Reject" → Confirm → Archive Artwork
```

**What happens when rejected:**

1. **Update GeneratedArt Document**
   ```javascript
   {
     status: "archived",
     quality_review: {
       approved: false,
       rejection_reason: "Does not meet quality standards",
       approved_by: ObjectId("admin_user_id"),
       approved_at: ISODate("...")
     },
     usage: {
       active: false
     }
   }
   ```

2. **No Reflection Update**
   - Reflection document unchanged
   - Old image (if any) remains in place
   - Artwork removed from active gallery view

## API Endpoints

### POST /api/admin/agents/art-director/approve
```json
{
  "art_id": "art_12_02_abc123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Art approved and deployed successfully",
  "art_id": "art_12_02_abc123",
  "public_url": "/reflections/12-02.jpg",
  "file_size": 251059,
  "approved_by": "admin@example.com"
}
```

### POST /api/admin/agents/art-director/reject
```json
{
  "art_id": "art_12_02_abc123",
  "reason": "Does not match reflection content"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Art rejected successfully",
  "art_id": "art_12_02_abc123",
  "reason": "Does not match reflection content"
}
```

## Data Flow Diagram

```
┌─────────────────┐
│  Admin Clicks   │
│ "Generate Art"  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│        Art Director Agent               │
│  1. Fetch reflection content from DB    │
│  2. Enhance prompt with Ghibli style    │
│  3. Call DALL-E 3 API                   │
│  4. Save metadata to generated_arts     │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│      generated_arts Collection          │
│  - image.url: OpenAI CDN (temporary)    │
│  - image.stored_url: null               │
│  - status: "completed"                  │
│  - quality_review.approved: undefined   │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│         Gallery Tab Display             │
│  - Show preview of generated art        │
│  - Show [Approve & Deploy] button       │
│  - Show [Reject] button                 │
└────────┬────────────────────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐  ┌────────┐
│Approve │  │Reject  │
└───┬────┘  └───┬────┘
    │           │
    ▼           ▼
┌───────────┐ ┌──────────┐
│ Download  │ │  Archive │
│  Image    │ │  Artwork │
│    ↓      │ └──────────┘
│  Save to  │
│  public/  │
│    ↓      │
│  Update   │
│ generated_│
│   arts    │
│    ↓      │
│  Update   │
│reflection │
│    ↓      │
│  Deploy!  │
└───────────┘
```

## Benefits of This Approach

1. **Quality Control**
   - Admin reviews before deployment
   - Prevents inappropriate content
   - Ensures alignment with reflection content

2. **Safe Rollout**
   - Gradual replacement of images
   - Can A/B test old vs new images
   - Easy rollback if issues arise

3. **Cost Management**
   - Generate multiple options
   - Only download approved images
   - Track API costs per artwork

4. **Audit Trail**
   - Track who approved/rejected
   - Record rejection reasons
   - Monitor approval rates

5. **Permanent Storage**
   - Images don't expire
   - Served from local CDN
   - Faster load times

## File Locations

### Source Code
- **Approval Logic**: `src/app/api/admin/agents/art-director/approve/route.js`
- **Rejection Logic**: `src/app/api/admin/agents/art-director/reject/route.js`
- **Image Storage**: `src/lib/utils/imageStorage.js`
- **Dashboard UI**: `src/components/Admin/ArtDirectorDashboard.js`

### Generated Images
- **Storage**: `public/reflections/[MM-DD].jpg`
- **URL**: `/reflections/[MM-DD].jpg`
- **Example**: `/reflections/12-02.jpg`

### Database Collections
- **Generated Art**: `generated_arts`
- **Reflections**: `reflections`
- **Generation History**: `art_generation_history`

## Future Enhancements

1. **Batch Approval**
   - Select multiple artworks
   - Approve all at once

2. **Comparison View**
   - Side-by-side old vs new
   - Visual diff highlighting

3. **Automated Quality Checks**
   - Image analysis API
   - Content moderation
   - Style consistency scoring

4. **Version History**
   - Keep multiple versions
   - Easy revert to previous
   - Track changes over time

5. **Preview Mode**
   - Show on reflection page
   - Only visible to admins
   - Gather feedback before deploy
