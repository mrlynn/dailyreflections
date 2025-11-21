# Course CMS Design: Admin Content Management System

**Goal:** Enable administrators to create, edit, and publish rich article-style lessons without code changes.

---

## 1. Design Philosophy

### Current State (Block-Based)
- Lessons composed of discrete blocks (hero, text, quote, etc.)
- Content stored as JSON in database
- Requires database updates to change content
- Limited to predefined block types

### New Vision (Article-Based CMS)
- **Rich article content** with flexible formatting
- **WYSIWYG editor** for writing and editing
- **Admin UI** for managing all course content
- **Preview before publish** to review changes
- **Version history** to track changes (future)
- **Media library** for images and assets

---

## 2. Content Model Evolution

### Enhanced Lesson Structure

```typescript
interface Lesson {
  _id: ObjectId;
  courseId: ObjectId;
  moduleId: ObjectId;
  slug: string;
  title: string;
  subtitle?: string;
  order: number;
  approximateDurationMinutes?: number;

  // NEW: Rich content fields
  content: LessonContent;

  // Metadata
  author?: ObjectId;  // Admin who created/last edited
  status: 'draft' | 'published' | 'archived';
  publishedAt?: Date;

  // SEO
  metaDescription?: string;
  featuredImage?: string;

  createdAt: Date;
  updatedAt: Date;
}

interface LessonContent {
  // Article body (rich text/markdown/structured)
  body: string | StructuredContent;
  bodyFormat: 'markdown' | 'html' | 'structured';

  // Optional sections
  heroImage?: string;
  heroCaption?: string;

  // Interactive elements (preserved from block system)
  interactions?: Interaction[];

  // Sidebar/callout content
  callouts?: Callout[];
}

interface Interaction {
  type: 'checkin' | 'journal-prompt' | 'feature-intro';
  position: number; // Where in article to place it
  props: any; // Type-specific props
}

interface Callout {
  type: 'quote' | 'tip' | 'warning' | 'resource';
  content: string;
  source?: string;
  position: number;
}

interface StructuredContent {
  // Hybrid approach: structured + freeform
  sections: ContentSection[];
}

interface ContentSection {
  type: 'paragraph' | 'heading' | 'list' | 'quote' | 'image' | 'divider';
  content: string | any;
  level?: number; // for headings
  style?: 'ordered' | 'unordered'; // for lists
}
```

### Why This Approach?

**Flexibility:**
- Write long-form articles naturally
- Mix structured and freeform content
- Add interactive elements where needed

**Editor-Friendly:**
- Familiar article writing experience
- WYSIWYG for rich formatting
- Markdown support for power users

**Developer-Friendly:**
- Structured data for special elements
- Easy to render on frontend
- Extensible for new content types

---

## 3. Admin Interface Design

### Admin Routes

```
/admin/course                      # Course list
/admin/course/[courseSlug]         # Course overview with modules
/admin/course/[courseSlug]/edit    # Edit course metadata
/admin/course/[courseSlug]/module/[moduleSlug]/edit  # Edit module
/admin/course/[courseSlug]/lesson/[lessonSlug]/edit  # Edit lesson
/admin/course/[courseSlug]/lesson/new  # Create new lesson
```

### Admin UI Components

**1. Course Manager**
- List all courses
- Create/archive courses
- Reorder modules
- View analytics

**2. Module Editor**
- Edit title, description, gating rules
- Reorder lessons within module
- Add/remove lessons
- Preview module

**3. Lesson Editor** (Primary Interface)
- Rich text editor for body content
- Title and subtitle editing
- Image upload/selection
- Interactive element insertion
- Preview pane (split screen or toggle)
- Save as draft / Publish
- Metadata editing (duration, SEO)

---

## 4. Rich Text Editor Options

### Option 1: Tiptap (Recommended)
**Pros:**
- Modern, React-friendly
- Highly customizable
- Markdown support
- Collaborative editing ready
- Good TypeScript support

**Cons:**
- Requires learning curve
- Need to build custom extensions

**Example:**
```jsx
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

function LessonEditor({ initialContent, onChange }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  return <EditorContent editor={editor} />
}
```

### Option 2: Draft.js (Facebook)
**Pros:**
- Battle-tested (used in Facebook)
- Rich plugin ecosystem
- Full control over rendering

**Cons:**
- More complex API
- Less React-friendly
- Older technology

### Option 3: Slate.js
**Pros:**
- Fully customizable
- TypeScript first
- Modern architecture

**Cons:**
- Steep learning curve
- Need to build everything
- Smaller ecosystem

### Option 4: Markdown + Preview (Simplest)
**Pros:**
- Simple to implement
- Familiar to writers
- Easy to store
- No complex dependencies

**Cons:**
- Less intuitive for non-technical users
- Need to build preview
- Limited rich formatting

**Example:**
```jsx
import ReactMarkdown from 'react-markdown'

function MarkdownEditor({ content, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        className="font-mono"
      />
      <div className="prose">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  )
}
```

### Recommendation: Start with Option 4 (Markdown), Upgrade to Tiptap Later

**Phase 1:** Markdown editor (quick to implement, gets you 80% there)
**Phase 2:** Tiptap with markdown support (best of both worlds)

---

## 5. Content Format Examples

### Current Block Format (Before)

```javascript
{
  blocks: [
    { type: 'hero', props: { heading: '...', body: '...' } },
    { type: 'text', props: { body: '...' } },
    { type: 'quote', props: { source: '...', body: '...' } },
    { type: 'checkin', props: { question: '...', scale: [...] } }
  ]
}
```

### New Article Format (After)

```javascript
{
  // Rich article body
  body: `
# You don't have to do this forever

When people said "one day at a time," I thought it was a cliché. But when I tried to think about staying sober forever, I froze. So I stopped thinking about forever.

Today is all you have. Not tomorrow, not next week, not next year. Just the 24 hours in front of you. And most of us have found we can do almost anything for 24 hours.

> "We are not cured of alcoholism. What we really have is a daily reprieve contingent on the maintenance of our spiritual condition."
> — Big Book, page 85

This doesn't mean you'll never think about drinking. It means when you do, you can say: "Not today. I don't have to drink today."

## How This Looks in Practice

For many of us, breaking sobriety into 24-hour chunks made it manageable:

- Wake up, say "I won't drink today"
- When cravings hit: "I don't have to drink right now"
- At night: "I made it through today"
- Tomorrow morning: start again

The beauty of this approach is that you never have to think about next week, next month, or next year. You only have to get through today.
`,
  bodyFormat: 'markdown',

  // Interactive elements placed at specific positions
  interactions: [
    {
      type: 'checkin',
      position: 3, // After 3rd paragraph
      props: {
        question: 'When you think about staying sober, which feels more manageable?',
        scale: ['forever', 'one year', 'one month', 'just today']
      }
    }
  ],

  // Sidebar callouts
  callouts: [
    {
      type: 'resource',
      content: 'Related reading: Big Book pages 83-88',
      position: 2
    }
  ]
}
```

**Benefits:**
- Natural article flow
- Easy to read and edit
- Flexible formatting (headings, lists, emphasis)
- Interactive elements inserted contextually

---

## 6. Admin Authentication & Authorization

### User Roles

```typescript
enum UserRole {
  USER = 'user',           // Regular app user
  MODERATOR = 'moderator', // Can view admin, limited editing
  ADMIN = 'admin',         // Full course editing
  SUPER_ADMIN = 'superadmin' // All permissions + user management
}

interface User {
  _id: ObjectId;
  email: string;
  role: UserRole;
  permissions: Permission[];
}

enum Permission {
  VIEW_ADMIN = 'view_admin',
  EDIT_CONTENT = 'edit_content',
  PUBLISH_CONTENT = 'publish_content',
  DELETE_CONTENT = 'delete_content',
  MANAGE_USERS = 'manage_users',
  VIEW_ANALYTICS = 'view_analytics',
}
```

### Middleware for Admin Routes

```typescript
// middleware/adminAuth.ts
export async function requireAdmin(req, res, next) {
  const session = await getSession(req);

  if (!session?.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (!['admin', 'superadmin'].includes(session.user.role)) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  next();
}

// Usage in API route
export async function POST(req) {
  await requireAdmin(req);
  // ... admin logic
}
```

---

## 7. API Routes for Admin

### Course Management

```typescript
// GET /api/admin/courses
// List all courses (including drafts)
export async function GET() {
  const courses = await db.collection('courses')
    .find({})
    .sort({ order: 1 })
    .toArray();
  return Response.json(courses);
}

// PUT /api/admin/courses/[courseId]
// Update course
export async function PUT(req, { params }) {
  const updates = await req.json();
  await db.collection('courses').updateOne(
    { _id: new ObjectId(params.courseId) },
    { $set: { ...updates, updatedAt: new Date() } }
  );
  return Response.json({ success: true });
}

// POST /api/admin/courses
// Create new course
export async function POST(req) {
  const course = await req.json();
  const result = await db.collection('courses').insertOne({
    ...course,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return Response.json({ id: result.insertedId });
}
```

### Lesson Management

```typescript
// GET /api/admin/lessons/[lessonId]
// Get lesson for editing (including drafts)
export async function GET(req, { params }) {
  const lesson = await db.collection('lessons')
    .findOne({ _id: new ObjectId(params.lessonId) });
  return Response.json(lesson);
}

// PUT /api/admin/lessons/[lessonId]
// Update lesson
export async function PUT(req, { params }) {
  const session = await getSession(req);
  const updates = await req.json();

  await db.collection('lessons').updateOne(
    { _id: new ObjectId(params.lessonId) },
    {
      $set: {
        ...updates,
        updatedAt: new Date(),
        lastEditedBy: session.user.id,
      }
    }
  );

  // Log edit event
  await db.collection('admin_events').insertOne({
    type: 'lesson_updated',
    lessonId: params.lessonId,
    userId: session.user.id,
    changes: updates,
    createdAt: new Date(),
  });

  return Response.json({ success: true });
}

// POST /api/admin/lessons/[lessonId]/publish
// Publish lesson (move from draft to published)
export async function POST(req, { params }) {
  await db.collection('lessons').updateOne(
    { _id: new ObjectId(params.lessonId) },
    {
      $set: {
        status: 'published',
        publishedAt: new Date(),
        updatedAt: new Date(),
      }
    }
  );
  return Response.json({ success: true });
}

// DELETE /api/admin/lessons/[lessonId]
// Soft delete (archive)
export async function DELETE(req, { params }) {
  await db.collection('lessons').updateOne(
    { _id: new ObjectId(params.lessonId) },
    {
      $set: {
        status: 'archived',
        archivedAt: new Date(),
      }
    }
  );
  return Response.json({ success: true });
}
```

---

## 8. Implementation Phases

### Phase 1: Admin Foundation (Week 1)
- [ ] Add `role` field to user schema
- [ ] Create admin middleware for auth
- [ ] Build basic admin layout (sidebar, header)
- [ ] Create admin course list page
- [ ] Add "Edit" buttons for admins in regular UI

### Phase 2: Simple Lesson Editor (Week 1-2)
- [ ] Create lesson edit page
- [ ] Implement markdown editor with live preview
- [ ] Add title/subtitle editing
- [ ] Implement save functionality
- [ ] Add "Publish" button

### Phase 3: Enhanced Content Model (Week 2-3)
- [ ] Migrate existing lessons to new format
- [ ] Add `content.body` field to lessons
- [ ] Update frontend to render markdown/rich content
- [ ] Preserve backward compatibility with blocks

### Phase 4: Interactive Elements (Week 3-4)
- [ ] UI for inserting check-ins, quotes, etc.
- [ ] Position selector for interactions
- [ ] Update renderer to place interactions

### Phase 5: Advanced Features (Week 4+)
- [ ] Image upload and media library
- [ ] Version history
- [ ] Draft/publish workflow
- [ ] Preview mode
- [ ] SEO metadata editing

---

## 9. Migration Strategy

### Backward Compatibility

The system should support BOTH formats during transition:

```typescript
function renderLesson(lesson: Lesson) {
  // New format (article-based)
  if (lesson.content?.body) {
    return <ArticleRenderer content={lesson.content} />;
  }

  // Old format (block-based) - fallback
  if (lesson.blocks) {
    return <BlockRenderer blocks={lesson.blocks} />;
  }

  throw new Error('Invalid lesson format');
}
```

### Migration Script

```javascript
// scripts/migrate/migrateBlocksToArticles.js
async function migrateLesson(lesson) {
  // Convert blocks to markdown
  const markdown = blocksToMarkdown(lesson.blocks);

  // Extract interactions
  const interactions = extractInteractions(lesson.blocks);

  // Update lesson
  await db.collection('lessons').updateOne(
    { _id: lesson._id },
    {
      $set: {
        content: {
          body: markdown,
          bodyFormat: 'markdown',
          interactions: interactions,
        },
        // Preserve original for rollback
        _originalBlocks: lesson.blocks,
      }
    }
  );
}

function blocksToMarkdown(blocks) {
  return blocks.map(block => {
    switch (block.type) {
      case 'hero':
        return `# ${block.props.heading}\n\n${block.props.body || ''}`;
      case 'text':
        return block.props.body;
      case 'quote':
        return `> ${block.props.body}\n> — ${block.props.source}`;
      // ... other types
    }
  }).join('\n\n');
}
```

---

## 10. UI Mockups (Text-Based)

### Admin Dashboard
```
+--------------------------------------------------+
| AA Companion Admin                    [Profile ▼]|
+--------------------------------------------------+
| 📚 Courses | 📊 Analytics | 👥 Users             |
+--------------------------------------------------+
|                                                  |
| Courses                              [+ New]     |
|                                                  |
| ┌────────────────────────────────────────────┐  |
| │ ⬆⬇ First 30 Days Path             [Edit]  │  |
| │    2 modules • 7 lessons • Published       │  |
| │    Last edited: Nov 20, 2025               │  |
| └────────────────────────────────────────────┘  |
|                                                  |
| ┌────────────────────────────────────────────┐  |
| │ ⬆⬇ 90 Days Foundation           [Edit]    │  |
| │    0 modules • 0 lessons • Draft           │  |
| │    Last edited: Nov 15, 2025               │  |
| └────────────────────────────────────────────┘  |
|                                                  |
+--------------------------------------------------+
```

### Lesson Editor
```
+--------------------------------------------------+
| ← Back to Course       [Save Draft] [Publish]   |
+--------------------------------------------------+
| Module: one day at a time                        |
| Lesson 1 of 4                                    |
+--------------------------------------------------+
|                                                  |
| Title: *just today_________________________      |
|                                                  |
| Subtitle: you don't have to do this forever___  |
|                                                  |
| Duration: [4] minutes                            |
|                                                  |
+--------------------------------------------------+
| [Write] [Preview] [Interactions]                |
+--------------------------------------------------+
|                                                  |
| # You don't have to do this forever             |
|                                                  |
| When people said "one day at a time," I thought |
| it was a cliché. But when I tried to think about|
| staying sober forever, I froze...               |
|                                                  |
| [+ Insert Check-in] [+ Insert Quote] [+ Image]  |
|                                                  |
+--------------------------------------------------+
| Status: Draft • Last saved: 2 minutes ago        |
+--------------------------------------------------+
```

---

## 11. Key Benefits of This Approach

### For Content Writers
- **Natural writing flow** like a blog post
- **Rich formatting** (headings, lists, emphasis)
- **Immediate preview** to see changes
- **No code required** to update content
- **Flexible structure** for long-form articles

### For Users
- **Better reading experience** with natural article flow
- **More depth** with longer, thoughtful content
- **Same interactive elements** (check-ins, prompts)
- **Improved mobile reading** with responsive design

### For Developers
- **Easier maintenance** - content in database, not code
- **Flexible schema** - easy to add new content types
- **Version control** for content changes (future)
- **API-first** - can build mobile app, etc.

---

## 12. Next Steps

**Immediate (This Week):**
1. Add `role` field to your user document
2. Create `/admin` route with authentication
3. Build basic course list admin page
4. Create simple markdown lesson editor

**Short Term (Next 2 Weeks):**
1. Migrate 1-2 existing lessons to article format
2. Test editing workflow
3. Get feedback from content team
4. Iterate on editor UX

**Medium Term (Next Month):**
1. Complete migration of all lessons
2. Add media library for images
3. Build preview system
4. Add version history

---

## Questions to Answer

1. **Who will be the primary editors?**
   - Just you?
   - Content team?
   - Multiple admins?

2. **How often will content change?**
   - Daily?
   - Weekly?
   - Only during content development?

3. **Do you need approval workflows?**
   - Draft → Review → Publish?
   - Or direct editing?

4. **Media storage?**
   - Keep images in `/public`?
   - Use cloud storage (S3, Cloudinary)?
   - Need compression/optimization?

5. **Migration timeline?**
   - Migrate all at once?
   - Gradual rollout?
   - Keep both systems?

---

**Ready to build this? Let me know which phase to start with!**
