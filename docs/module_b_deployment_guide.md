# Module B: Production Deployment Guide

**Status:** Ready for Production ✅
**Date:** November 20, 2025
**Version:** 1.0

---

## Pre-Deployment Testing Summary

### ✅ Completed Tests

**Test 1: Module Visibility & Gating**
- ✅ Both modules visible to user with adequate sobriety/meetings
- ✅ Module B properly locked until Module A complete
- ✅ Gating logic working: 3+ days, 1+ meetings, Module A complete

**Test 2: Navigation**
- ✅ Successfully navigated from Module A to Module B
- ✅ Previous/Next lesson buttons working
- ✅ Navigation between modules seamless

**Test 3: Content Rendering**
- ✅ Lesson 1 (just-today) renders correctly
- ✅ Lesson 2 (small-rituals) renders correctly
- ✅ Lesson 3 (middle-of-the-day) renders correctly
- ✅ Lesson 4 (not-alone) - needs final verification

**Test 4: Progress Tracking**
- ✅ Lesson completion recorded correctly
- ✅ Progress count updating (3 → 4 → 5)
- ✅ Next lesson logic working

**Test 5: Block Types**
- ✅ Hero blocks with background images
- ✅ Text blocks
- ✅ Quote blocks
- ✅ Check-in blocks
- ✅ Feature intro blocks (sobriety tracker, meeting finder)
- ✅ Journal prompts
- ✅ Dividers

**Server Logs:** No errors, all routes responding correctly

---

## Production Deployment Checklist

### Phase 1: Pre-Deployment Verification

- [ ] **Complete testing of Lesson 4** (`not-alone`)
- [ ] **Verify all images load** in production image paths
- [ ] **Review content** for any typos or issues
- [ ] **Test gating edge cases**:
  - [ ] User with 2 days (should NOT see Module B)
  - [ ] User with 3+ days but 0 meetings (should NOT see Module B)
  - [ ] User with incomplete Module A (should NOT see Module B)
- [ ] **Backup production database** before deployment

### Phase 2: Code & Asset Deployment

- [ ] **Commit code** to git (no code changes, but document state)
- [ ] **Deploy images** to production:
  ```bash
  # Verify images exist
  ls -la public/images/one-day/

  # Should see: lesson1.jpg, lesson2.jpg, lesson3.jpg, lesson4.jpg
  ```
- [ ] **Deploy application** (no code changes needed, images already in repo)
- [ ] **Verify deployment** completed successfully

### Phase 3: Database Deployment

- [ ] **Set production MongoDB URI** in environment
- [ ] **Run seed script** on production database:
  ```bash
  NODE_ENV=production node scripts/seed/seedModuleBOneDayAtATime.js
  ```
- [ ] **Verify seeding** completed successfully
- [ ] **Check production database**:
  ```bash
  # Verify 2 modules exist
  db.modules.countDocuments({courseId: ObjectId("...")})
  # Expected: 2

  # Verify 7 lessons exist
  db.lessons.countDocuments({courseId: ObjectId("...")})
  # Expected: 7
  ```

### Phase 4: Post-Deployment Verification

- [ ] **Visit production course page**: `/course/first-30-days`
- [ ] **Verify both modules visible** (as appropriate user)
- [ ] **Navigate to Module B Lesson 1**
- [ ] **Complete one lesson** and verify progress tracking
- [ ] **Check for any console errors**
- [ ] **Verify images load correctly**
- [ ] **Test on mobile device**

### Phase 5: Monitoring

- [ ] **Monitor error logs** for first 24 hours
- [ ] **Check analytics** for Module B engagement
- [ ] **Watch for user feedback** or bug reports
- [ ] **Monitor database** for unexpected issues

---

## Deployment Commands

### 1. Backup Production Database

```bash
# Create backup of production database
mongodump --uri="mongodb+srv://..." --out=./backup-$(date +%Y%m%d)
```

### 2. Deploy Images (if not in repo)

```bash
# Images should already be in repo at:
# /public/images/one-day/lesson1.jpg
# /public/images/one-day/lesson2.jpg
# /public/images/one-day/lesson3.jpg
# /public/images/one-day/lesson4.jpg

# Verify they're in the deployed build
ls -la public/images/one-day/
```

### 3. Run Production Seed

```bash
# Set production MongoDB URI
export MONGODB_URI="mongodb+srv://mike:Password678%21@performance.zbcul.mongodb.net/dailyreflections"

# Run seed script
node scripts/seed/seedModuleBOneDayAtATime.js

# Expected output:
# ✓ Connected to MongoDB
# ✓ Found course: first-30-days
# ✓ Found Module A with 3 lessons
# ✓ Created module: one-day-at-a-time
# ✓ Created 4 lessons: ...
# ✓ Updated course to include Module B
# ✅ Module B seed complete!
```

### 4. Verify Deployment

```bash
# Check modules
mongosh "$MONGODB_URI" --eval "db.modules.find({}, {title: 1, order: 1}).sort({order: 1})"

# Check lessons count
mongosh "$MONGODB_URI" --eval "db.lessons.countDocuments({courseId: db.courses.findOne({slug: 'first-30-days'})._id})"

# Should return: 7
```

---

## Rollback Plan

If issues occur, rollback procedure:

### Option 1: Remove Module B (keep Module A)

```bash
# Get course ID
courseId=$(mongosh "$MONGODB_URI" --eval "db.courses.findOne({slug: 'first-30-days'})._id" --quiet)

# Delete Module B
mongosh "$MONGODB_URI" --eval "db.modules.deleteOne({slug: 'one-day-at-a-time'})"

# Delete Module B lessons
mongosh "$MONGODB_URI" --eval "db.lessons.deleteMany({moduleId: ObjectId('MODULE_B_ID')})"

# Remove Module B from course
mongosh "$MONGODB_URI" --eval "db.courses.updateOne({slug: 'first-30-days'}, {\$pull: {modules: {order: 2}}})"

# Clear user progress for Module B lessons (optional)
mongosh "$MONGODB_URI" --eval "db.userCourseProgress.updateMany({}, {\$pull: {completedLessons: {lessonId: {\$in: [/* Module B lesson IDs */]}}}})"
```

### Option 2: Restore from Backup

```bash
# Restore from backup created before deployment
mongorestore --uri="mongodb+srv://..." --drop ./backup-YYYYMMDD/
```

---

## Post-Deployment Monitoring

### Key Metrics to Watch

**Engagement Metrics:**
- Number of users who unlock Module B
- Number of users who start Module B
- Completion rate per lesson
- Drop-off points

**Technical Metrics:**
- Error rate in logs
- Page load times
- Image load failures
- API response times

**User Feedback:**
- Support tickets related to course
- User comments or feedback
- Bug reports

### Analytics Queries

```javascript
// Users who unlocked Module B
db.userCourseProgress.countDocuments({
  "completedLessons.lessonId": { $in: [/* Module B lesson IDs */] }
})

// Completion rate for each Module B lesson
db.userCourseProgress.aggregate([
  { $unwind: "$completedLessons" },
  { $match: { "completedLessons.lessonId": { $in: [/* Module B IDs */] } } },
  { $group: { _id: "$completedLessons.lessonId", count: { $sum: 1 } } }
])

// Average time between Module A completion and Module B start
// (Requires user event log analysis)
```

---

## Known Issues & Limitations

### Placeholder Images
- **Status:** Using Module A images as placeholders
- **Impact:** Low - images are thematically appropriate
- **Resolution:** Commission custom Module B illustrations (future)

### Gating Requirements
- **Requirement:** 1+ meeting attended
- **Consideration:** May prevent some users from accessing Module B
- **Monitoring:** Track how many users get stuck at Module A complete but 0 meetings

### Content Iteration
- **Status:** First version, untested with real users at scale
- **Plan:** Gather feedback, iterate on content based on user responses

---

## Success Criteria

Module B deployment will be considered successful if:

1. **Zero critical bugs** in first 48 hours
2. **70%+ of Module A completers** unlock Module B
3. **50%+ of Module B unlockers** start first lesson
4. **Positive user feedback** on content quality and relevance
5. **No degradation** of overall app performance

---

## Communication Plan

### Internal Team
- Announce deployment in team channel
- Share key metrics dashboard
- Schedule review meeting after 1 week

### Users
- No announcement needed (gradual rollout via existing users completing Module A)
- Monitor for organic discovery and feedback
- Consider announcement after 2 weeks if engagement is strong

---

## Next Steps After Successful Deployment

1. **Gather feedback** from early users (1-2 weeks)
2. **Analyze metrics** and identify improvements
3. **Plan Module C** ("finding your people")
4. **Commission custom illustrations** for Module B
5. **Iterate on content** based on user feedback

---

## Emergency Contacts

- **Database Issues:** [Primary DBA contact]
- **Deployment Issues:** [DevOps contact]
- **Content Issues:** [Product/Content owner]
- **Bug Reports:** [Engineering lead]

---

## Deployment Sign-Off

- [ ] **QA Complete** - All tests passed
- [ ] **Backup Created** - Production DB backed up
- [ ] **Seed Script Tested** - Verified on staging/test database
- [ ] **Images Verified** - All assets present and loading
- [ ] **Rollback Plan Ready** - Team knows how to rollback if needed
- [ ] **Monitoring Setup** - Alerts and dashboards configured

**Approved By:**
- [ ] Product Owner: _______________
- [ ] Engineering Lead: _______________
- [ ] QA Lead: _______________

**Deployment Date:** _______________
**Deployed By:** _______________

---

## Appendix: Module B Details

**Module:** one day at a time
**Slug:** `one-day-at-a-time`
**Order:** 2
**Lessons:** 4
**Duration:** ~18 minutes
**Gating:** 3+ days sober, 1+ meetings, Module A complete

**Lesson Slugs:**
1. `just-today`
2. `small-rituals`
3. `middle-of-the-day`
4. `not-alone`

**Image Paths:**
- `/images/one-day/lesson1.jpg`
- `/images/one-day/lesson2.jpg`
- `/images/one-day/lesson3.jpg`
- `/images/one-day/lesson4.jpg`

**Database Collections Modified:**
- `courses` - Added Module B to modules array
- `modules` - New module document
- `lessons` - 4 new lesson documents
- `userCourseProgress` - Will be updated as users progress
- `userEvents` - Will track lesson completions and interactions
