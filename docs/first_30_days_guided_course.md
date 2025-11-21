# AA Companion – “First 30 Days Path” Guided Course System

> Document type: Product + Technical Implementation Plan  
> Audience: AA Companion engineering team (Cursor + Claude + human devs)  
> Stack assumptions: Next.js (App Router), React, MongoDB Atlas, TypeScript (preferred but not required)

---

## 1. purpose

Create a **guided, adaptive “First 30 Days” course experience** for newcomers that:

- Gently introduces AA concepts and AA Companion features.
- Adapts to user context (sobriety length, engagement, behavior).
- Feels emotionally safe, non-prescriptive, and consistent with AA culture.
- Lives **inside** the AA Companion app (custom components), not as an external docs or YouTube-based curriculum.

The experience should feel like a **lantern-guided path**, not a traditional “online course” or checklist.

---

## 2. goals and non-goals

### 2.1 Goals

- Provide a **structured yet gentle on-ramp** for newcomers during their first 30 days.
- Introduce app features gradually (meeting finder, reflections, 90 in 90, journaling, sobriety tracker, etc.).
- Track user **course progress** and **feature adoption**.
- Support **adaptive surfacing** of modules/lessons based on:
  - Sobriety days
  - Meeting attendance
  - Journaling/check-ins
  - Milestones
- Maintain a strong **Ghibli-style visual identity** and mascot/lantern metaphor.

### 2.2 Non-goals

- This is **not** a replacement for:
  - Meetings
  - Sponsors
  - The Big Book
  - Professional therapy or medical advice
- This is **not** a traditional “e-learning” platform with quizzes and grades.
- No direct “this is what you must do” instructions; we describe patterns and tools, not prescriptions.

---

## 3. user experience overview

### 3.1 Primary user

- **Newcomer** or early recovery user (0–90 days sober).
- Emotionally overwhelmed, ambivalent, frightened, or hopeful.
- Limited cognitive bandwidth; prefers small, safe, guided steps.

### 3.2 Entry points

1. **Homepage hero card (early days)**  
   - Visible when:
     - User sobriety_days <= configurable threshold (e.g. 30–60), and
     - `userCourseProgress` indicates not completed.
   - Card copy (example):
     - Title: “a gentle path for your first days sober”
     - Body: “Short, simple steps you can take at your own pace.”
     - CTA: “start the first 30 days path”

2. **Persistent nav item**  
   - Label: “my recovery path”
   - Always available, regardless of sobriety days.
   - Opens the course shell at the user’s current lesson.

3. **Contextual nudges (later phases)**  
   - After meetings, journals, or streaks, soft prompts:
     - “There’s a short step in your path connected to what you just did.”

### 3.3 Core experience: course shell

- URL structure (App Router):

  - Course list: `/course`
  - Course overview: `/course/[courseSlug]`
  - Course player: `/course/[courseSlug]/learn/[moduleSlug]/[lessonSlug]`

- Layout:

  - Desktop:
    - Left: Course sidebar (modules + lessons)
    - Top: Progress bar with mascot/lantern
    - Center: Lesson content (blocks)
  - Mobile:
    - Top: Progress bar
    - Content: Lesson blocks
    - Modules via drawer/bottom sheet

### 3.4 Lesson composition

Lessons are built from **atomic content blocks**:

- `hero` – Ghibli-style hero section with mascot/lantern + text.
- `text` – body copy paragraphs.
- `quote` – Big Book or AA-related quotes.
- `checkin` – emotional state check-in (“overwhelmed”, “scared”, etc.).
- `journal-prompt` – short reflection prompt.
- `video` – embedded YouTube or local video (optional).
- `cta-feature-intro` – introduces app features (meeting finder, 90-in-90, sobriety tracker).
- `divider` – visual separation between conceptual units.
- (Extensible) e.g., `bigbook-snippet`, `audio`, `link-list`.

---

## 4. functional requirements

### 4.1 Course & content

1. Support at least one course at launch:
   - `first-30-days` (working title: “First 30 Days Path”).
2. Course is divided into **modules**, each module composed of **lessons**.
3. Lessons are composed of **blocks**, which define content and UI behavior.
4. Modules can be:
   - Gated by sobriety days.
   - Gated by prior module/lesson completions.
   - Gated by minimal engagement patterns (e.g. 1 meeting attended).

### 4.2 User progress

1. Track:
   - Course started/updated timestamps.
   - Current module & lesson.
   - Completed lessons (with timestamps).
2. Ability to **resume** directly from last active lesson.
3. Support multiple courses later (e.g. “Building Your Foundation”, “Living in the Solution”).

### 4.3 Adaptive behavior

1. Determine **visibility and ordering** of modules for each user based on:
   - Sobriety days.
   - Meetings attended.
   - Completed lessons.
2. Simple gating logic:
   - Example: Module “finding your people” unlocks after:
     - `sobrietyDays >= 5` AND
     - at least 1 meeting joined AND
     - Module A completed.
3. Throttling:
   - Avoid surfacing more than N new modules/features per day.

### 4.4 Safety

1. Language non-prescriptive; system **never** tells user what to do.
2. Include clear references to:
   - Meetings.
   - Sponsors.
   - Fellowship.
   - Crisis resources (links, phone numbers) where appropriate.
3. Crisis-related expressions in check-ins/journals are handled via **existing safety and escalation patterns** (out of scope for this document but must integrate).

### 4.5 Analytics & insights (later phase)

1. Track progression funnel:
   - Course started → Module A completed → Course completed.
2. Track feature adoption triggered by course:
   - Meeting finder opened from course.
   - Journal created after journal-prompt block.
3. All potentially used to:
   - Improve content.
   - Adjust gating rules.

---

## 5. non-functional requirements

- **Performance:** Fast load for lesson pages; content fetched from MongoDB with efficient indexes.
- **Resilience:** If course content fails to load, user still has access to the rest of the app.
- **Extensibility:** Content schema should support adding new block types without major refactors.
- **Internationalization (future):** Course text should be structured in a way that can later support translation.

---

## 6. data model (MongoDB)

This is a **logical model**; actual schema may be implemented via Mongoose, raw driver, or other ORM/ODM.

### 6.1 `courses` collection

Represents a high-level course (e.g., “First 30 Days Path”).

```js
{
  _id: ObjectId("..."),
  slug: "first-30-days",
  title: "First 30 Days Path",
  description: "A gentle path through your first month in sobriety.",
  isActive: true,
  order: 1,
  // ordered references to modules for fallback ordering
  modules: [
    { moduleId: ObjectId("..."), order: 1 },
    { moduleId: ObjectId("..."), order: 2 }
  ],
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

Indexes
	•	{ slug: 1 } unique.

⸻

6.2 modules collection

Represents a thematic chunk within a course.

```js
{
  _id: ObjectId("..."),
  courseId: ObjectId("..."),
  slug: "youre-safe-here",
  title: "you’re safe here",
  description: "Short, simple steps for your first days.",
  order: 1,

  // gating by sobriety days (inclusive)
  minSobrietyDays: 0,        // nullable
  maxSobrietyDays: 7,        // nullable

  // additional gating rules
  gatingRules: {
    requireMeetingsAttended: 0,        // integer, default 0
    requireCompletedLessonIds: [/* lesson ObjectIds */]
  },

  lessonIds: [ObjectId("..."), ObjectId("...")],

  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}```

Indexes
	•	{ courseId: 1, order: 1 }
	•	{ slug: 1, courseId: 1 } unique.

⸻

6.3 lessons collection

Represents an individual step in a module.

```js
{
  _id: ObjectId("..."),
  courseId: ObjectId("..."),
  moduleId: ObjectId("..."),
  slug: "welcome",
  title: "welcome",
  subtitle: "you’re not alone anymore.",
  order: 1,
  approximateDurationMinutes: 3,

  blocks: [
    {
      type: "hero",
      props: {
        heading: "we’re glad you’re here.",
        body: "whatever brought you here, this space is for you.",
        mascotVariant: "lantern-soft"
      }
    },
    {
      type: "text",
      props: {
        body: "for many of us, the first days were confusing, scary, and full of ‘what now?’..."
      }
    },
    {
      type: "checkin",
      props: {
        question: "how are you feeling right now?",
        scale: ["overwhelmed", "scared", "numb", "hopeful"]
      }
    },
    {
      type: "cta-feature-intro",
      props: {
        featureKey: "meeting-finder",
        title: "find a meeting near you",
        description: "this is usually the first concrete step most of us take.",
        buttonLabel: "open meeting finder"
      }
    }
  ],

  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

Indexes
	•	{ courseId: 1, moduleId: 1, order: 1 }
	•	{ courseId: 1, slug: 1 } unique.

⸻

6.4 userCourseProgress collection

Tracks a user’s progress in a particular course.

```js
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  courseId: ObjectId("..."),

  currentModuleId: ObjectId("..."),
  currentLessonId: ObjectId("..."),

  completedLessons: [
    {
      lessonId: ObjectId("..."),
      completedAt: ISODate("...")
    }
  ],

  startedAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

Indexes
	•	{ userId: 1, courseId: 1 } unique.

⸻

6.5 userEvents collection (shared telemetry)

Lightweight event log for adaptive logic and analytics.

```js
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  type: "lesson_completed", // e.g. lesson_completed | meeting_joined | journal_entry | course_started
  payload: {
    lessonId: ObjectId("..."),
    courseId: ObjectId("...")
    // or other event-specific properties
  },
  createdAt: ISODate("...")
}
```


Indexes
	•	{ userId: 1, createdAt: -1 }
	•	{ type: 1, createdAt: -1 }

⸻

7. backend / API design (Next.js route handlers)

We’ll use Next.js App Router route handlers under /app/api/course.

7.1 Endpoints (initial)
	1.	GET /api/course
	•	Returns list of active courses, with optional user-specific metadata.
	2.	GET /api/course/[courseSlug]
	•	Returns a course summary with modules visible to this user (gating applied).
	3.	GET /api/course/[courseSlug]/lesson with query params:
	•	moduleSlug
	•	lessonSlug
	•	Returns lesson content for this user (or 403 if gated).
	4.	POST /api/course/[courseSlug]/lesson/complete
	•	Body:
	•	moduleId
	•	lessonId
	•	Behavior:
	•	Add to completedLessons.
	•	Update currentLessonId/currentModuleId.
	•	Append userEvents entry lesson_completed.
	5.	POST /api/course/checkin
	•	Body:
	•	lessonId
	•	mood string (one of scale options).
	•	Behavior:
	•	Log userEvents entry lesson_checkin.
	•	(Future) Influence gating/suggestions.
	6.	POST /api/course/offer-feature
	•	When user taps a cta-feature-intro button:
	•	Log userEvents entry feature_offer_clicked.

7.2 Example handler (pseudo-code)

/app/api/course/[courseSlug]/lesson/route.ts

```js
import { NextRequest, NextResponse } from "next/server";
import { getLessonForUser } from "@/lib/course/courseApi"; // to be implemented

export async function GET(
  req: NextRequest,
  { params }: { params: { courseSlug: string } }
) {
  const user = await getCurrentUserOrThrow(req);
  const { searchParams } = new URL(req.url);
  const moduleSlug = searchParams.get("moduleSlug");
  const lessonSlug = searchParams.get("lessonSlug");

  if (!moduleSlug || !lessonSlug) {
    return NextResponse.json({ error: "missing params" }, { status: 400 });
  }

  const lesson = await getLessonForUser({
    userId: user._id,
    courseSlug: params.courseSlug,
    moduleSlug,
    lessonSlug
  });

  if (!lesson) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json(lesson);
}
```

8. frontend implementation (Next.js + React)

8.1 Suggested directory structure

```
/src
  /components
    /course
      CourseLayout.tsx
      CourseSidebar.tsx
      CourseProgressBar.tsx
      ModuleList.tsx
      LessonList.tsx
      LessonPlayer.tsx
      LessonBlockRenderer.tsx
      blocks/
        HeroBlock.tsx
        TextBlock.tsx
        QuoteBlock.tsx
        CheckinBlock.tsx
        JournalPromptBlock.tsx
        VideoBlock.tsx
        FeatureIntroBlock.tsx
        DividerBlock.tsx
  /lib
    /course
      courseApi.ts        // calls to /api/course
      courseState.ts      // utility to compute next lesson/module
      gating.ts           // gating logic based on user context
      types.ts            // TS interfaces for Course/Module/Lesson/Blocks
/app
  /course
    page.tsx              // list of courses / entry point
    /[courseSlug]
      page.tsx            // course overview (modules listing)
      /learn
        /[moduleSlug]
          /[lessonSlug]
            page.tsx      // main lesson player page
```

8.2 CourseLayout (shell)

High-level layout used by course pages.

Key behaviors:
	•	Receives course and userProgress as props (SSR).
	•	Renders CourseSidebar + CourseProgressBar + children.

8.3 LessonPlayer
	•	Receives lesson and onComplete.
	•	Renders LessonBlockRenderer for each block.
	•	Shows “mark this step as done” button.

8.4 LessonBlockRenderer
	•	Switch on block.type.
	•	Map to atomic block components in blocks/.

Example types:
```
export type LessonBlock =
  | { type: "hero"; props: HeroProps }
  | { type: "text"; props: TextProps }
  | { type: "quote"; props: QuoteProps }
  | { type: "checkin"; props: CheckinProps }
  | { type: "journal-prompt"; props: JournalPromptProps }
  | { type: "video"; props: VideoProps }
  | { type: "cta-feature-intro"; props: FeatureIntroProps }
  | { type: "divider"; props: {} };
```

8.5 Block examples (high level)

HeroBlock
	•	Visual anchor.
	•	Shows mascot art (variant passed via props).
	•	Typically first block in lesson.

Props:
type HeroProps = {
  heading: string;
  body?: string;
  mascotVariant?: "lantern-soft" | "path" | "night-sky";
};

CheckinBlock
	•	Question + discrete answer options.
	•	POST to /api/course/checkin.
	•	Shows “saved” state on completion.

Props:
type CheckinProps = {
  question: string;
  scale: string[]; // e.g. ["overwhelmed", "scared", "numb", "hopeful"]
};

FeatureIntroBlock
	•	Introduces an app feature and routes user to it (e.g. meeting finder).
	•	Logs feature offer click.

Props:
type FeatureIntroProps = {
  featureKey: "meeting-finder" | "sobriety-tracker" | "ninety-in-ninety" | string;
  title: string;
  description?: string;
  buttonLabel: string;
};

9. adaptive logic & gating

9.1 User context

Input to gating logic:

```
type UserContext = {
  sobrietyDays: number | null;
  meetingsAttended: number;
  completedLessonIds: string[]; // or ObjectId strings
  // future: journaling frequency, etc.
};
```

9.2 Module gating function

/src/lib/course/gating.ts
```
export function canAccessModule(module, userContext: UserContext) {
  const { sobrietyDays, meetingsAttended, completedLessonIds } = userContext;

  // sobriety days gating
  if (typeof module.minSobrietyDays === "number" && sobrietyDays !== null) {
    if (sobrietyDays < module.minSobrietyDays) return false;
  }

  if (typeof module.maxSobrietyDays === "number" && sobrietyDays !== null) {
    if (sobrietyDays > module.maxSobrietyDays) return false;
  }

  // meetings gating
  if (module.gatingRules?.requireMeetingsAttended) {
    if (meetingsAttended < module.gatingRules.requireMeetingsAttended) return false;
  }

  // prior lessons gating
  if (module.gatingRules?.requireCompletedLessonIds?.length) {
    const completedSet = new Set(completedLessonIds.map(String));
    for (const required of module.gatingRules.requireCompletedLessonIds) {
      if (!completedSet.has(String(required))) return false;
    }
  }

  return true;
}
```

9.3 “what’s next” logic

Given:
	•	course
	•	modules (visible to user)
	•	lessons (with completedLessons)

Compute next lesson:
	1.	Find the first module in order where:
	•	canAccessModule(module, userContext) === true, and
	•	It has uncompleted lessons.
	2.	Within that module, find the lowest-order lesson not in completedLessons.
	3.	This becomes the next lesson.

If none found (course complete), show a completion page (e.g. lantern ceremony).

⸻

10. safety & recovery-specific considerations

10.1 Language & tone
	•	Copy must:
	•	Avoid advice like “you should”, “you must”, “do this now”.
	•	Favor phrases like:
	•	“many people find…”
	•	“you might explore…”
	•	“here’s one way some of us…”
	•	All content must align with AA principles and traditions; no cross-talk, no outside issues.

10.2 Crisis edges

Check-in answers or journal content are not deeply analyzed by the course system, but:
	•	If crisis-related patterns are detected by other safety tooling, we:
	•	Surface crisis resource messaging.
	•	Encourage talking to someone (sponsor, meeting, hotline).
	•	The course should never:
	•	Attempt to diagnose.
	•	Offer medical or psychiatric advice.

10.3 Feature introductions

When the course introduces features (e.g. 10th step journal, Big Book reader, sobriety tracker):
	•	It must frame them as optional tools.
	•	Encourage using them in addition to, not instead of, meetings and sponsors.

⸻

11. implementation phases

Phase 0 – groundwork
	•	Confirm stack details (Next.js version, TS vs JS, current Mongo client patterns).
	•	Create courses, modules, lessons, userCourseProgress, userEvents collections.
	•	Implement minimal seed script or JSON data for:
	•	Course: first-30-days
	•	Module A: youre-safe-here
	•	2–3 lessons in Module A (MVP flow).

Phase 1 – core plumbing
	•	Implement core types in /src/lib/course/types.ts.
	•	Implement /app/api/course endpoints:
	•	GET /api/course
	•	GET /api/course/[courseSlug]
	•	GET /api/course/[courseSlug]/lesson
	•	POST /api/course/[courseSlug]/lesson/complete
	•	POST /api/course/checkin
	•	Implement /src/lib/course/courseApi.ts client wrappers.

Phase 2 – front-end shell
	•	Create CourseLayout, CourseSidebar, CourseProgressBar.
	•	Implement /app/course/page.tsx listing available courses.
	•	Implement /app/course/[courseSlug]/page.tsx showing modules with gating applied.
	•	Implement /app/course/[courseSlug]/learn/[moduleSlug]/[lessonSlug]/page.tsx:
	•	Server-side load of user, course, lesson, and progress.
	•	Render CourseLayout + LessonPlayer.

Phase 3 – block system
	•	Implement LessonBlockRenderer with base blocks:
	•	hero
	•	text
	•	quote
	•	divider
	•	Add interactive blocks:
	•	checkin
	•	journal-prompt (can integrate existing journal feature or stub).
	•	cta-feature-intro (hook into existing features).

Phase 4 – adaptive gating + entry points
	•	Implement gating.ts + canAccessModule.
	•	Connect to real UserContext (sobriety days, meeting count, etc.).
	•	Add homepage hero card:
	•	Visible for early sobriety + incomplete course.
	•	CTA: start or continue.
	•	Add nav item “my recovery path”.

Phase 5 – polish & expansion
	•	Ghibli-style visual integration:
	•	Mascot variants for HeroBlock.
	•	Soft color palette + micro-animations.
	•	Expand course content:
	•	Additional modules:
	•	“one day at a time”
	•	“finding your people”
	•	“the program at a glance”
	•	“building your foundation”
	•	Each with 2–5 lessons initially.
	•	Analytics:
	•	userEvents instrumentation.
	•	Basic reporting queries or dashboards.

⸻

12. open questions (for product/content)
	1.	Exact naming:
	•	“First 30 Days Path” vs “your first days sober” vs other.
	2.	Do we want a hard cap on how far someone can jump ahead in modules?
	3.	Should certain modules only be available after a specific milestone (e.g. 7 days sober)?
	4.	Content authorship:
	•	Who will write the actual text/lessons?
	•	Where will drafts live (Notion, markdown repo, in-app admin)?
	5.	Should we expose a content admin UI to edit modules/lessons later?
	6.	What is the minimum viable content (in lessons/modules) required to ship v1?

⸻

13. immediate next steps for engineers
	1.	Create a new feature branch:
feature/first-30-days-course
	2.	Scaffold course data model:
	•	Add MongoDB collections & indexes.
	•	Implement TypeScript interfaces (Course, Module, Lesson, LessonBlock, UserCourseProgress).
	3.	Create a minimal seed for:
	•	1 course.
	•	1 module (youre-safe-here).
	•	2–3 lessons, using:
	•	hero, text, checkin, cta-feature-intro.
	4.	Implement the core Course Shell:
	•	/course listing.
	•	/course/[courseSlug]/learn/[moduleSlug]/[lessonSlug] with hardcoded user for first pass.
	5.	Once this skeleton is working end-to-end, we can:
	•	Involve content authors for lesson copy.
	•	Iterate on visual styling (Ghibli-inspired).
	•	Hook into real user context (sobriety start date, meetings, etc.).


---

## 14. sample seed data (MVP course content)

This section gives concrete examples you can drop into a seed script or JSON file to bootstrap the first course.

You can either:

- Store this in `seed/first-30-days.json` and write a seed script, or
- Hard-code temporarily in your API and migrate to Mongo later.

### 14.1 Course: first-30-days

```json
{
  "slug": "first-30-days",
  "title": "first 30 days path",
  "description": "short, gentle steps to help you through your first month sober.",
  "isActive": true,
  "order": 1
}
```

14.2 Modules (MVP: one full module)

Module A – “you’re safe here”
Target: day 0–7.

```
{
  "courseSlug": "first-30-days",
  "slug": "youre-safe-here",
  "title": "you’re safe here",
  "description": "short, simple steps for your first days.",
  "order": 1,
  "minSobrietyDays": 0,
  "maxSobrietyDays": 7,
  "gatingRules": {
    "requireMeetingsAttended": 0,
    "requireCompletedLessonIds": []
  }
}
```

You can add follow-on modules later, e.g.:
	•	one-day-at-a-time
	•	finding-your-people
	•	the-program-at-a-glance
	•	building-your-foundation

But for v1, focus on one complete module with 3–5 lessons.

14.3 Lessons (example: 3 lessons for Module A)

Lesson 1 – welcome
```
{
  "courseSlug": "first-30-days",
  "moduleSlug": "youre-safe-here",
  "slug": "welcome",
  "title": "welcome",
  "subtitle": "you’re not alone anymore.",
  "order": 1,
  "approximateDurationMinutes": 3,
  "blocks": [
    {
      "type": "hero",
      "props": {
        "heading": "we’re glad you’re here.",
        "body": "whatever brought you here, this space is for you. many of us arrived scared, confused, or not sure if we belonged.",
        "mascotVariant": "lantern-soft"
      }
    },
    {
      "type": "text",
      "props": {
        "body": "you don’t have to figure everything out today. this path is made of small, simple steps you can take at your own pace. you can stop any time. you can come back any time."
      }
    },
    {
      "type": "checkin",
      "props": {
        "question": "how are you feeling right now?",
        "scale": ["overwhelmed", "scared", "numb", "hopeful"]
      }
    },
    {
      "type": "text",
      "props": {
        "body": "there are no right answers here. this isn’t a test. it’s just a way to notice where you are, one moment at a time."
      }
    }
  ]
}
```

Lesson 2 – what this path is (and isn’t)
```

{
  "courseSlug": "first-30-days",
  "moduleSlug": "youre-safe-here",
  "slug": "what-this-is",
  "title": "what this path is (and isn’t)",
  "subtitle": "a companion, not a commander.",
  "order": 2,
  "approximateDurationMinutes": 4,
  "blocks": [
    {
      "type": "hero",
      "props": {
        "heading": "this is a companion, not a set of rules.",
        "body": "we’ll show you patterns that helped many of us. you decide what to do with them.",
        "mascotVariant": "path"
      }
    },
    {
      "type": "text",
      "props": {
        "body": "this path doesn’t replace meetings, sponsors, or the big book. it’s here to help you find and use those things more easily."
      }
    },
    {
      "type": "quote",
      "props": {
        "source": "aa member",
        "body": "“when i was new, i couldn’t absorb much at once. i just needed to know i wasn’t crazy and i wasn’t alone.”"
      }
    },
    {
      "type": "text",
      "props": {
        "body": "you can move forward, pause, or come back later. there’s no ‘behind’ here. just the next right step when you’re ready."
      }
    },
    {
      "type": "divider",
      "props": {}
    },
    {
      "type": "cta-feature-intro",
      "props": {
        "featureKey": "daily-reflection",
        "title": "see today’s reflection",
        "description": "many of us like to start the day with a short reading. this feature shows you a fresh reflection each day.",
        "buttonLabel": "open daily reflection"
      }
    }
  ]
}
```

Lesson 3 – your first concrete step
```
{
  "courseSlug": "first-30-days",
  "moduleSlug": "youre-safe-here",
  "slug": "first-step",
  "title": "your first concrete step",
  "subtitle": "finding a meeting — if and when you’re ready.",
  "order": 3,
  "approximateDurationMinutes": 4,
  "blocks": [
    {
      "type": "hero",
      "props": {
        "heading": "most of us started by finding a meeting.",
        "body": "for a lot of us, just sitting in a meeting and listening was enough at first.",
        "mascotVariant": "lantern-soft"
      }
    },
    {
      "type": "text",
      "props": {
        "body": "you don’t have to talk. you don’t have to share. you can just show up, sit down, and listen. that alone has helped countless alcoholics."
      }
    },
    {
      "type": "cta-feature-intro",
      "props": {
        "featureKey": "meeting-finder",
        "title": "find a meeting near you",
        "description": "this tool can help you find an aa meeting online or nearby. many of us use it daily.",
        "buttonLabel": "open meeting finder"
      }
    },
    {
      "type": "divider",
      "props": {}
    },
    {
      "type": "journal-prompt",
      "props": {
        "title": "if you want, write a line or two",
        "prompt": "what’s one small thing you’re willing to try in the next 24 hours? it could be as simple as ‘i’ll read a page’ or ‘i’ll look at meetings.’",
        "linkToJournalFeature": true
      }
    }
  ]
}
```

You can adapt tone, wording, and structure, but this gives Cursor/Claude concrete patterns.

⸻

15. Next.js wiring – minimal end-to-end flow

This section outlines how to wire the basic flow using the App Router. Exact syntax may vary based on your version and TypeScript setup.

15.1 Routing overview

```
/app
  /course
    page.tsx                        // list of courses / entry
    /[courseSlug]
      page.tsx                      // overview: modules for this course
      /learn
        /[moduleSlug]
          /[lessonSlug]
            page.tsx                // lesson player
```

15.2 /app/course/page.tsx – course chooser / entry

MVP: if there’s only one course, you can redirect straight into it.

```
// app/course/page.tsx
import { redirect } from "next/navigation";
import { getCoursesForUser } from "@/lib/course/courseApi";

export default async function CourseIndexPage() {
  const user = await getCurrentUserOrRedirect();
  const courses = await getCoursesForUser(user._id);

  if (courses.length === 1) {
    return redirect(`/course/${courses[0].slug}`);
  }

  return (
    <div className="px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">your recovery paths</h1>
      <div className="space-y-4">
        {courses.map((course) => (
          <a
            key={course.slug}
            href={`/course/${course.slug}`}
            className="block rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
          >
            <h2 className="text-lg font-semibold">{course.title}</h2>
            {course.description && (
              <p className="text-sm text-slate-300 mt-1">
                {course.description}
              </p>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}

```


15.3 /app/course/[courseSlug]/page.tsx – course overview

Shows modules, indicates which are locked/unlocked, and provides a “continue where you left off” button.

```
// app/course/[courseSlug]/page.tsx
import { notFound, redirect } from "next/navigation";
import { CourseLayout } from "@/components/course/CourseLayout";
import { getCourseOverviewForUser } from "@/lib/course/courseApi";

export default async function CourseOverviewPage({
  params
}: {
  params: { courseSlug: string };
}) {
  const user = await getCurrentUserOrRedirect();
  const data = await getCourseOverviewForUser({
    userId: user._id,
    courseSlug: params.courseSlug
  });

  if (!data) return notFound();

  const { course, modules, userProgress, nextLesson } = data;

  if (!userProgress && nextLesson) {
    // Optionally autostart
    return redirect(
      `/course/${course.slug}/learn/${nextLesson.moduleSlug}/${nextLesson.lessonSlug}`
    );
  }

  return (
    <CourseLayout course={course} userProgress={userProgress}>
      <section className="max-w-2xl mx-auto space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            guided path
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold">
            {course.title}
          </h1>
          {course.description && (
            <p className="text-sm text-slate-300">{course.description}</p>
          )}
        </header>

        {nextLesson && (
          <div className="rounded-2xl border border-emerald-600/60 bg-emerald-950/40 p-4">
            <p className="text-xs uppercase tracking-wide text-emerald-300 mb-1">
              up next
            </p>
            <p className="text-sm font-medium">{nextLesson.title}</p>
            <button
              className="mt-3 inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500 text-slate-950 hover:bg-emerald-400"
              onClick={() =>
                redirect(
                  `/course/${course.slug}/learn/${nextLesson.moduleSlug}/${nextLesson.lessonSlug}`
                )
              }
            >
              continue where you left off
            </button>
          </div>
        )}

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-200">
            modules in this path
          </h2>
          <ul className="space-y-2">
            {modules.map((mod) => (
              <li
                key={mod.slug}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium">{mod.title}</p>
                  {mod.description && (
                    <p className="text-xs text-slate-300">
                      {mod.description}
                    </p>
                  )}
                </div>
                <div className="text-xs text-slate-400">
                  {mod.locked ? "locked" : "unlocked"}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </section>
    </CourseLayout>
  );
}
```

(Cursor/Claude can refactor this into more idiomatic patterns once integrated with your real auth/user context.)

15.4 /app/course/[courseSlug]/learn/[moduleSlug]/[lessonSlug]/page.tsx – lesson player

Core page that uses LessonPlayer and LessonBlockRenderer.
```
// app/course/[courseSlug]/learn/[moduleSlug]/[lessonSlug]/page.tsx
import { notFound, redirect } from "next/navigation";
import { CourseLayout } from "@/components/course/CourseLayout";
import { LessonPlayer } from "@/components/course/LessonPlayer";
import { getLessonPageData } from "@/lib/course/courseApi";
import { completeLesson } from "@/lib/course/courseApi";

export default async function LessonPage({
  params
}: {
  params: { courseSlug: string; moduleSlug: string; lessonSlug: string };
}) {
  const user = await getCurrentUserOrRedirect();

  const data = await getLessonPageData({
    userId: user._id,
    courseSlug: params.courseSlug,
    moduleSlug: params.moduleSlug,
    lessonSlug: params.lessonSlug
  });

  if (!data) return notFound();

  const { course, lesson, userProgress, nextLesson } = data;

  async function handleComplete() {
    "use server";
    await completeLesson({
      userId: user._id,
      courseSlug: params.courseSlug,
      lessonId: lesson._id
    });

    if (nextLesson) {
      redirect(
        `/course/${course.slug}/learn/${nextLesson.moduleSlug}/${nextLesson.lessonSlug}`
      );
    } else {
      redirect(`/course/${course.slug}`);
    }
  }

  return (
    <CourseLayout course={course} userProgress={userProgress}>
      <LessonPlayer lesson={lesson} onComplete={handleComplete} />
    </CourseLayout>
  );
}
```

This uses a Server Action ("use server") for handleComplete — Cursor and Claude can adjust based on your existing patterns.

⸻

16. working with Cursor & Claude – prompt scaffolding

You’ll be leaning on Cursor + Claude as your implementation engine. Here’s how to give them precise instructions keyed to this plan.

16.1 Prompt template: backend implementation
```
You are helping me implement the "First 30 Days Path" guided course system for AA Companion.

Here is the spec document snippet (trim down to relevant sections before pasting):
[PASTE sections 6, 7, 9, 14 HERE]

We are using:
- Next.js (App Router)
- TypeScript
- MongoDB Atlas with the official driver
- File structure roughly matching the spec

Tasks:
1. Create TypeScript types/interfaces for Course, Module, Lesson, LessonBlock, UserCourseProgress, and UserContext in `src/lib/course/types.ts`.
2. Implement `src/lib/course/courseApi.ts` with the following functions:
   - `getCoursesForUser(userId)`
   - `getCourseOverviewForUser({ userId, courseSlug })`
   - `getLessonPageData({ userId, courseSlug, moduleSlug, lessonSlug })`
   - `completeLesson({ userId, courseSlug, lessonId })`
3. Assume mongodb client utility from our existing code (e.g. `getDb()`).

Constraints:
- Follow the schemas and shapes described in the spec.
- Keep the logic for gating/next-lesson in dedicated helpers in `gating.ts` and `courseState.ts`.
- Do NOT invent new fields or shapes unless necessary; ask me if you need to diverge.

Produce the code for:
- `src/lib/course/types.ts`
- `src/lib/course/gating.ts`
- `src/lib/course/courseState.ts`
- `src/lib/course/courseApi.ts`
```

16.2 Prompt template: frontend implementation
```
We already have the backend for the "First 30 Days Path" guided course system wired up, exposing:

- `getCoursesForUser(userId)`
- `getCourseOverviewForUser({ userId, courseSlug })`
- `getLessonPageData({ userId, courseSlug, moduleSlug, lessonSlug })`
- `completeLesson({ userId, courseSlug, lessonId })`

Here is the spec for the frontend:
[PASTE sections 3, 8, 15 HERE]

We’re using:
- Next.js App Router
- TypeScript + React
- Tailwind CSS

Tasks:
1. Implement the following components:
   - `src/components/course/CourseLayout.tsx`
   - `src/components/course/CourseSidebar.tsx` (minimal for now)
   - `src/components/course/CourseProgressBar.tsx` (basic progress bar)
   - `src/components/course/LessonPlayer.tsx`
   - `src/components/course/LessonBlockRenderer.tsx`
   - Block components in `src/components/course/blocks/*`:
     - `HeroBlock`
     - `TextBlock`
     - `QuoteBlock`
     - `CheckinBlock`
     - `JournalPromptBlock`
     - `FeatureIntroBlock`
2. Implement the Next.js pages:
   - `app/course/page.tsx`
   - `app/course/[courseSlug]/page.tsx`
   - `app/course/[courseSlug]/learn/[moduleSlug]/[lessonSlug]/page.tsx`
   using the patterns in the spec.

Constraints:
- Respect the tone and UX described (gentle, non-prescriptive).
- Use Tailwind utility classes, but keep styling relatively minimal; we will polish later.
- Use the `LessonBlock` discriminated unions from `types.ts`.

Provide the code for all of the above in separate blocks.
```

17. testing & validation

17.1 Unit tests (if you’re using Jest / Vitest)
	•	Test gating logic:
	•	canAccessModule with different sobrietyDays, meetingsAttended, and completedLessonIds.
	•	Test getNextLesson logic:
	•	Partially completed modules.
	•	Completed modules, remaining course.
	•	Completed entire course.

17.2 Integration tests
	•	End-to-end flow:
	1.	Seed DB with course → module → lessons.
	2.	Create test user with sobriety start date.
	3.	Hit:
	•	/course
	•	/course/first-30-days
	•	/course/first-30-days/learn/youre-safe-here/welcome
	4.	Simulate lesson completion.
	5.	Verify redirect to next lesson and userCourseProgress updates.

17.3 Manual QA scenarios
	1.	Brand new user, day 0, no meetings
	•	Should see hero “start your first 30 days path” card.
	•	Can start Module A, Lesson 1.
	•	Later modules locked.
	2.	User with 5 days sober, 1 meeting attended
	•	Module A unlocked, progressing.
	•	If you later add Module B with gating (sobrietyDays >= X, meeting count >= 1), ensure it unlocks as expected.
	3.	User completes all lessons in Module A
	•	Should be marked complete in sidebar.
	•	Next module either:
	•	shows as “up next” (if unlocked), or
	•	stays “locked” with a gentle explanation (if gating not met).
	4.	User attempts to deep-link into locked lesson
	•	Should fail gracefully (redirect to overview with subtle locked state), not crash.

⸻

18. summary for the engineering team
	•	You now have:
	•	A clear data model.
	•	A route layout and React component hierarchy.
	•	Seed content for an MVP module.
	•	Concrete prompts tailored for Cursor and Claude.
	•	A phased implementation plan from schema → backend → frontend → polish.

Next move is pretty straightforward:
	1.	Implement the schemas and seed script.
	2.	Wire the backend helpers and route handlers.
	3.	Stand up the course shell and lesson player.
	4.	Validate the first 2–3 lessons end-to-end.
	5.	Then start handing content over to this framework instead of hardcoding copy elsewhere.

From there, this becomes the backbone for all future “paths” and “courses” (90-in-90 guide, step-work primer, service journey, etc.) using the exact same system.