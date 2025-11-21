# Course System - Next Steps & Roadmap

## ✅ What's Complete

The **"First 30 Days Path"** guided course system is now fully implemented and ready to use!

### Core Infrastructure
- ✅ Complete TypeScript type system
- ✅ MongoDB schemas with proper indexes
- ✅ 5 REST API endpoints
- ✅ Adaptive gating logic (sobriety, meetings, progress)
- ✅ Integration with existing user context

### Frontend Components
- ✅ 8 atomic block types (Hero, Text, Quote, etc.)
- ✅ Responsive course shell with sidebar
- ✅ Lesson player with completion flow
- ✅ Mobile-optimized layouts

### Content
- ✅ Seed script with 3 complete lessons
- ✅ All block types demonstrated
- ✅ AA-aligned, non-prescriptive language

---

## 🚀 Ready to Use

### Access the Course
1. **Sign in** to AA Companion (authentication required)
2. Visit: `http://localhost:3001/course`
3. You'll be redirected to `/course/first-30-days`
4. Click **"Continue Where You Left Off"**
5. Experience the first lesson!

### Test the Flow
1. Complete all 3 lessons:
   - "welcome" - Introduction with check-in
   - "what-this-is" - Sets expectations, daily reflection CTA
   - "first-step" - Meeting finder + journal prompt
2. Test interactive features:
   - Emotional check-ins (saves to MongoDB)
   - Feature intro buttons (tracks clicks)
   - Lesson completion (updates progress)
3. Navigate via sidebar (desktop) or drawer (mobile)

---

## 📋 Immediate Next Steps

### 1. Content Expansion
The system is ready for more content. You can:

**Add More Lessons to Module A**
```javascript
// Example: Add a 4th lesson to "you're safe here" module
// Edit: scripts/seed/seedFirstThirtyDaysCourse.js
const lesson4 = {
  _id: new ObjectId(),
  courseId: courseId,
  moduleId: moduleId,
  slug: 'keeping-it-simple',
  title: 'keeping it simple',
  subtitle: 'one day, one step at a time',
  order: 4,
  approximateDurationMinutes: 3,
  blocks: [
    {
      type: 'hero',
      props: {
        heading: 'keep it simple',
        body: 'recovery works best when we take it one small step at a time',
        mascotVariant: 'lantern-soft'
      }
    },
    // ... more blocks
  ],
  createdAt: now,
  updatedAt: now
};
```

**Create New Modules**
From the spec, consider adding:
- **Module B: "one day at a time"** (days 8-14)
  - Gating: `minSobrietyDays: 7, maxSobrietyDays: 14`
- **Module C: "finding your people"** (days 15-21)
  - Gating: `minSobrietyDays: 14, requireMeetingsAttended: 3`
- **Module D: "the program at a glance"** (days 22-30)
  - Gating: `minSobrietyDays: 21`

### 2. Visual Enhancements

**Replace Emoji Mascot with Real Art**
- Currently using 🏮 emoji placeholder
- Design Ghibli-inspired lantern/mascot illustrations
- Create variants: `lantern-soft`, `path`, `night-sky`
- Update `src/components/course/blocks/HeroBlock.js`

**Polish the UI**
- Add micro-animations for block transitions
- Enhance progress bar with milestones
- Add celebration effects on lesson completion
- Improve mobile touch interactions

### 3. Homepage Integration

**Add Entry Point for Newcomers**
Create a hero card on the homepage (per spec):

```javascript
// In your home page component
{sobrietyDays <= 30 && !userProgress?.completedLessons?.length && (
  <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(...)' }}>
    <Typography variant="h5">
      a gentle path for your first days sober
    </Typography>
    <Typography variant="body1" sx={{ mb: 2 }}>
      Short, simple steps you can take at your own pace.
    </Typography>
    <Button
      variant="contained"
      href="/course/first-30-days"
    >
      start the first 30 days path
    </Button>
  </Paper>
)}
```

**Add Navigation Item**
```javascript
// In your nav/sidebar component
{
  label: 'my recovery path',
  href: '/course',
  icon: <LanternIcon />
}
```

### 4. Analytics & Insights

**Track User Engagement**
The system already logs events, now surface them:

```javascript
// Query examples for analytics
db.userEvents.aggregate([
  { $match: { type: 'lesson_completed' } },
  { $group: {
      _id: '$payload.lessonId',
      completions: { $sum: 1 }
  }},
  { $sort: { completions: -1 } }
])

// Check-in mood trends
db.userEvents.aggregate([
  { $match: { type: 'lesson_checkin' } },
  { $group: {
      _id: '$payload.mood',
      count: { $sum: 1 }
  }}
])
```

**Create Admin Dashboard**
- Course completion funnel
- Lesson drop-off points
- Feature adoption from CTAs
- Check-in mood distribution

### 5. Feature Improvements

**Enhance Sidebar Data**
Currently the sidebar only shows the current module's lessons. Fix this:

```javascript
// Create new endpoint: /api/course/[slug]/structure
export async function GET(request, context) {
  const { courseSlug } = await context.params;

  // Fetch ALL modules and lessons for sidebar
  const modules = await db.collection('modules')
    .find({ courseId })
    .sort({ order: 1 })
    .toArray();

  const lessons = await db.collection('lessons')
    .find({ courseId })
    .sort({ order: 1 })
    .toArray();

  return NextResponse.json({ modules, lessons });
}
```

**Add Course Completion Ceremony**
When user completes all lessons:
- Show celebration modal/page
- Award "First 30 Days" badge
- Suggest next steps (sponsor, service, step work)
- Share progress option (optional)

**Contextual Nudges**
Surface course lessons at relevant moments:
```javascript
// After logging a meeting
if (meetingsLogged === 1) {
  showToast({
    message: "Great! There's a lesson in your path about meetings.",
    action: "View Lesson",
    href: "/course/first-30-days/learn/youre-safe-here/first-step"
  });
}
```

---

## 🛠️ Technical Debt & Known Issues

### 1. Sidebar Lesson Fetching
**Issue:** Lesson page only fetches current lesson, sidebar shows limited data
**Fix:** Create `/api/course/[slug]/structure` endpoint for full course tree
**Priority:** Medium

### 2. Progress Calculation
**Issue:** Progress percentage is estimated/hardcoded in lesson page
**Fix:** Calculate from course overview data, pass as prop
**Priority:** Low (cosmetic)

### 3. Mascot Images
**Issue:** Using emoji placeholder
**Fix:** Commission/create actual illustrations
**Priority:** Low (functional as-is)

### 4. Block Type Extensibility
**Issue:** Adding new block types requires code changes
**Fix:** Consider plugin system or dynamic imports
**Priority:** Low (current approach works fine)

---

## 🎨 Content Creation Workflow

### For Content Authors

**1. Plan Your Lesson**
- Title & subtitle
- Estimated duration
- Learning objectives
- Which blocks to use

**2. Write Block Content**
Use this template:
```json
{
  "type": "text",
  "props": {
    "body": "Your content here. Use 'many of us find...' language, avoid 'you must'."
  }
}
```

**3. Add to Seed Script or MongoDB**
- Edit `scripts/seed/seedFirstThirtyDaysCourse.js`, OR
- Insert directly via MongoDB Compass/Atlas

**4. Test the Lesson**
```bash
# If using seed script
npm run seed-course

# Then visit
http://localhost:3001/course/first-30-days/learn/[module-slug]/[lesson-slug]
```

### Block Type Cheatsheet

| Block Type | Use When | Props |
|------------|----------|-------|
| `hero` | Starting a lesson | `heading`, `body`, `mascotVariant` |
| `text` | Main content | `body` |
| `quote` | AA quotes, testimonials | `source`, `body` |
| `checkin` | Emotional check-in | `question`, `scale[]` |
| `journal-prompt` | Reflection prompts | `title`, `prompt`, `linkToJournalFeature` |
| `video` | Video content | `url`, `title`, `description` |
| `cta-feature-intro` | Introduce app features | `featureKey`, `title`, `description`, `buttonLabel` |
| `divider` | Visual separation | none |

---

## 📊 Success Metrics

Track these over time:
- **Course Start Rate:** % of new users who start course
- **Module Completion Rate:** % who finish each module
- **Lesson Drop-off:** Where users stop progressing
- **Feature Adoption:** CTA click-through rates
- **Time to Complete:** Average days to finish course
- **Check-in Sentiment:** Mood distribution over time

---

## 🔮 Future Enhancements

### Additional Courses
- **"90 in 90 Guide"** - Daily meeting encouragement
- **"Step Work Primer"** - Introduction to the 12 steps
- **"Living in the Solution"** - For those with 90+ days
- **"Service Journey"** - Getting involved in service

### Advanced Features
- **Personalized Recommendations:** AI-suggested lessons based on check-ins
- **Peer Progress:** See how others in your cohort are doing (anonymized)
- **Lesson Notes:** Let users add private notes to lessons
- **Bookmarks:** Save favorite lessons for quick access
- **Download for Offline:** Export lessons as PDF/EPUB
- **Multi-language Support:** Translate content

### Integration Opportunities
- **Sponsor Connection:** Share progress with sponsor
- **Meeting Sync:** Auto-unlock lessons after meetings
- **Journal Integration:** Link journal entries to lessons
- **Sobriety Milestones:** Unlock special lessons at 30/60/90 days

---

## 📞 Support & Questions

**Documentation:**
- Full spec: `docs/first_30_days_guided_course.md`
- Implementation: `docs/course_implementation_summary.md`
- Quick start: `docs/course_quick_start.md`

**Code Locations:**
- Backend: `src/lib/course/` + `src/app/api/course/`
- Frontend: `src/components/course/` + `src/app/course/`
- Seed: `scripts/seed/seedFirstThirtyDaysCourse.js`

**Common Tasks:**
```bash
# Seed course data
npm run seed-course

# Start dev server
npm run dev

# Check MongoDB data
mongosh "mongodb+srv://..." --eval "db.courses.find()"
```

---

## ✨ Final Notes

The course system is **production-ready** for the MVP. The architecture is:
- **Scalable:** Add courses/modules/lessons without code changes
- **Extensible:** New block types are easy to add
- **Maintainable:** Clear separation of concerns
- **AA-Aligned:** Non-prescriptive, safe, fellowship-focused

**Ship it when you're ready!** Start with the 3 existing lessons, gather user feedback, and expand from there.

The lantern is lit. The path is ready. 🏮
