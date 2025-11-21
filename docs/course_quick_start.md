# Course System - Quick Start Guide

## Getting Started in 5 Minutes

### 1. Seed the Course Data
```bash
npm run seed-course
```

This creates:
- ✅ 1 course: "first 30 days path"
- ✅ 1 module: "you're safe here"
- ✅ 3 lessons: welcome, what-this-is, first-step

### 2. Start the Dev Server
```bash
npm run dev
```

### 3. Navigate to the Course
Open your browser and visit:
```
http://localhost:3000/course
```

You'll be redirected to `/course/first-30-days` (since there's only one course).

### 4. Start the First Lesson
Click "Continue Where You Left Off" to begin:
```
/course/first-30-days/learn/youre-safe-here/welcome
```

---

## Key URLs

| Page | URL | Description |
|------|-----|-------------|
| Course List | `/course` | Lists all courses |
| Course Overview | `/course/first-30-days` | Shows modules & progress |
| Lesson 1 | `/course/first-30-days/learn/youre-safe-here/welcome` | First lesson |
| Lesson 2 | `/course/first-30-days/learn/youre-safe-here/what-this-is` | Second lesson |
| Lesson 3 | `/course/first-30-days/learn/youre-safe-here/first-step` | Third lesson |

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/course` | Get all courses |
| GET | `/api/course/[slug]` | Get course overview |
| GET | `/api/course/[slug]/lesson?moduleSlug=...&lessonSlug=...` | Get lesson data |
| POST | `/api/course/[slug]/lesson` | Mark lesson complete |
| POST | `/api/course/checkin` | Record check-in |
| POST | `/api/course/feature-click` | Track feature click |

---

## Testing Block Types

The seed data includes examples of all block types:

### Lesson 1: "welcome"
- ✅ `hero` block
- ✅ `text` block
- ✅ `checkin` block

### Lesson 2: "what-this-is"
- ✅ `hero` block
- ✅ `text` block
- ✅ `quote` block
- ✅ `divider` block
- ✅ `cta-feature-intro` block (daily reflection)

### Lesson 3: "first-step"
- ✅ `hero` block
- ✅ `text` block
- ✅ `cta-feature-intro` block (meeting finder)
- ✅ `divider` block
- ✅ `journal-prompt` block

---

## User Flow

1. **Course List** → Auto-redirects to first course
2. **Course Overview** → Shows modules, progress, "Continue" button
3. **Lesson Page** → Renders all blocks, completion button
4. **Complete Lesson** → Redirects to next lesson or course overview
5. **Course Sidebar** → Navigate between lessons

---

## MongoDB Collections

Check MongoDB Atlas to verify data:

```javascript
// courses
db.courses.findOne({ slug: 'first-30-days' })

// modules
db.modules.find({ courseId: ObjectId('...') })

// lessons
db.lessons.find({ moduleId: ObjectId('...') })

// userCourseProgress (created when user completes first lesson)
db.userCourseProgress.find({ userId: ObjectId('...') })

// userEvents (created on check-ins, completions, feature clicks)
db.userEvents.find({ userId: ObjectId('...'), type: 'lesson_completed' })
```

---

## Adding More Content

### Option 1: Extend the Seed Script
Edit `scripts/seed/seedFirstThirtyDaysCourse.js`:
1. Add more lessons to the `youre-safe-here` module
2. Create new modules with gating rules
3. Re-run `npm run seed-course` (after deleting existing data)

### Option 2: Manually Insert via MongoDB
```javascript
db.lessons.insertOne({
  courseId: ObjectId('...'),
  moduleId: ObjectId('...'),
  slug: 'my-new-lesson',
  title: 'My New Lesson',
  subtitle: 'Subtitle here',
  order: 4,
  approximateDurationMinutes: 5,
  blocks: [
    {
      type: 'hero',
      props: {
        heading: 'Lesson heading',
        body: 'Introduction text',
        mascotVariant: 'lantern-soft'
      }
    },
    {
      type: 'text',
      props: {
        body: 'Main content here...'
      }
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
})
```

---

## Troubleshooting

### "Course not found"
- Verify seed script ran successfully
- Check MongoDB for `courses` collection
- Ensure `slug` matches URL parameter

### "Lesson not found or you do not have access yet"
- Check user's sobriety days
- Check meeting attendance count
- Verify module gating rules in MongoDB

### Sidebar not showing lessons
- Known limitation: Currently only fetches current lesson
- Future fix: Create `/api/course/[slug]/structure` endpoint

### Check-in not saving
- Check browser console for API errors
- Verify `/api/course/checkin` route is working
- Check `lessonId` is being passed correctly

---

## Next Steps

1. **Test the full flow** - Complete all 3 lessons
2. **Review the code** - Understand block rendering
3. **Add more lessons** - Extend the seed script
4. **Customize styling** - Modify block components
5. **Add mascot images** - Replace emoji placeholders

---

## Resources

- **Full Spec:** `docs/first_30_days_guided_course.md`
- **Implementation Summary:** `docs/course_implementation_summary.md`
- **API Code:** `src/app/api/course/`
- **Components:** `src/components/course/`
- **Backend Logic:** `src/lib/course/`

---

**Happy building! 🏮**
