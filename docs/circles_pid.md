# PID.md — circles for aa companion

## 1. product overview

**Feature name:** circles  
**Product:** AA Companion  
**Owner:** [TBD]  
**Status:** v1 definition  
**Primary audience:** people in recovery using AA Companion for step work, inventories, and daily reflections.

circles introduces small, private, invitation-based groups inside AA Companion that enable members to share experience, strength, and hope (ESH) around recovery and the 12 steps, in a way that is spiritually aligned with AA principles and rigorously protective of anonymity and privacy.

it is the foundation for future features like:
- circle-based AA-style meetings (text/video/async)
- sponsor/sponsee workflows
- guided step studies done in safe micro-communities.

---

## 2. problem statement

right now AA Companion is strong for:
- personal step work (4th, 8th, 9th, 10th, reflections)
- learning and exploring the 12 steps
- optional threaded comments on daily reflections.

what’s missing:
- a safe, structured way to connect more deeply in small groups.
- support for sponsor/sponsee pairs or small pods to share around real step work.
- continuity between “I do my inventory alone on my phone” and “I grow by hearing others’ experience.”

users either:
- stay isolated in solo use, or
- take conversations off-platform into unstructured, less safe channels.

circles solves for:
- safe sharing
- structure
- permanence
- alignment with AA values.

---

## 3. goals & success metrics

### primary goals

1. **enable safe micro-communities**  
   users can create and join small, invitation-based groups centered on step work and ESH.

2. **support real recovery workflows**
   integrate circles with:
   - daily 10th step
   - 4th step inventory
   - amends & resentments
   - step learning content.

3. **protect anonymity & safety**
   enforce defaults and UX that reduce risk of:
   - outing members
   - cross-talk abuse
   - predatory behavior
   - data leakage.

4. **prepare for live “circle meetings”**
   design v1 so we can layer synchronous/async meeting features without rework.

### success metrics (initial hypothesis)

- % of active users who join or create at least one circle within 30/60/90 days.
- engagement:
  - posts per circle per week
  - comments per post
- retention uplift:
  - compare retention/return rate for users in circles vs not.
- safety:
  - low rate of abuse reports per 1,000 posts
  - fast moderation response time for serious issues (internal SLA).

---

## 4. guiding principles

1. **spiritual alignment**
   - focus on experience, strength, hope.
   - reflect AA Traditions in spirit (no endorsements, no promotions, no outside issues).

2. **anonymity by design**
   - no last names by default.
   - no public membership directories.
   - circles are invisible to non-members.

3. **consent & control**
   - explicit sharing flows.
   - no automatic exposure of private inventories or journals.
   - easy to leave circles, clear membership status.

4. **minimal friction, maximum clarity**
   - simple UX that feels like: “small home group / step pod / sponsor circle.”

5. **future-ready**
   - architecture supports:
     - AA-style meetings per circle,
     - SMS / push notifications,
     - AI-assisted guidance scoped to circle content (optional, careful).

---

## 5. scope for v1

### in scope

- create / manage circles
- invite flow (links + direct invites)
- join & approval flow
- circle feed (posts & comments)
- tagging posts by step / topic
- sharing redacted content into circles from step tools
- access control, moderation tooling (MVP)
- basic notifications (in-app, optional email)

### out of scope (future phases)

- real-time video or audio meetings
- full meeting scheduling & formats
- cross-circle discovery / recommendations
- complex AI summarization of circle data
- mobile push, SMS integration (beyond design notes)

---

## 6. user archetypes & use cases

### archetypes

1. **newcomer**
   - wants to feel less alone.
   - may join a newcomer-friendly circle or sponsor circle.

2. **sponsee**
   - working steps, wants to share drafts, get guidance.

3. **sponsor**
   - wants private space with sponsees to review step work and share ESH.

4. **home group / step group member**
   - wants a digital extension of existing relationships.

### core use cases

1. “I want a private group where we share about our 4th/5th/10th step work.”
2. “I want a sponsor/sponsee circle where we can keep our communication and step work together.”
3. “Our small group wants a safe place to reflect on the daily reading and our amends progress.”
4. “I want to share part of my 10th step with my circle without exposing my full journal.”
5. “I want to leave a circle easily if it no longer feels right.”

---

## 7. core concepts

### circle

- private micro-community.
- not discoverable publicly.
- can be:
  - general recovery circle
  - sponsor/sponsee circle
  - step-study circle.

### circle member

- user with a role in a circle:
  - `owner` — created the circle, manages settings.
  - `admin` — delegated permissions.
  - `member` — standard participant.

### circle post

- text-based share scoped to one circle.
- can be tagged:
  - by step: `step: 4`, `step: 9`, `step: 10`, etc.
  - by type: `experience`, `gratitude`, `inventory-insight`, etc.
- optional: snapshot of shared journal/entry.

### circle comment

- threaded replies under a circle post.

### invite / join request

- secure token or direct invite.
- requires approval (configurable: owner-only or owner+admins).

---

## 8. functional requirements

### 8.1 circle creation

- any authenticated user can create a circle, subject to:
  - max circles per user (configurable, e.g., 5–10 to avoid spam).
- required fields:
  - `name`
- optional:
  - `description` (visible to members/invitees).
  - `type`: `general`, `sponsor-circle`, `step-group`.
  - `maxMembers` (e.g., default 20, max 50).
- system generates:
  - `circleId`
  - timestamps.

### 8.2 invitations

must support two patterns:

1. **invite link**
   - `POST /api/circles/{id}/invites`
   - returns unique token: `circleJoinToken`
   - link: `/circles/join?token=...`
   - configurable:
     - one-time use or multi-use
     - expiration.

2. **direct invite**
   - search internal users by:
     - handle / display name / email (email display limited).
   - send invite:
     - receiver sees notification: “You’ve been invited to [Circle Name].”

### 8.3 join flow

- via link:
  - if not logged in: prompt to sign in / create account.
  - show limited circle info: name, description, member count.
  - user clicks “Request to join”.
- approval:
  - owner/admin sees “pending requests”.
  - can `approve` / `reject`.
- when approved:
  - entry created in `circle_members` with `status: active`.

### 8.4 circle feed

- authenticated + member-only.
- view posts sorted:
  - default: newest first.
  - filters:
    - by step (1–12, 10).
    - by type (ESH, gratitude, inventory, amends).
- actions:
  - create post.
  - edit/delete own post (soft delete).
  - comment on posts.
- no media uploads in v1 (optional later).
- no reactions required in v1 (`likes` optional later).

### 8.5 sharing from step tools

from existing features (4th, 8th, 9th, 10th step, reflections):

- add a `Share to circle` action.
- flow:
  1. user selects circle.
  2. app shows **preview**:
     - default: redacted version (no full names, no sensitive identifiers).
  3. user confirms / edits.
  4. system creates `circle_post` containing:
     - sanitized snapshot, not live-linked secret data.
- never auto-share without explicit action.

### 8.6 leaving & managing circles

- any member:
  - “Leave circle”:
    - `status: left`.
- owner/admin:
  - update circle settings.
  - remove members (`status: removed`).
  - transfer ownership.
  - archive/delete circle:
    - mark `isDeleted: true`, hide from UI
    - content retained or anonymized per retention policy (TBD).

### 8.7 moderation & safety

MVP:

- per circle:
  - owners/admins:
    - delete posts/comments that break guidelines.
- platform-level:
  - global admins can:
    - suspend user,
    - lock circle,
    - investigate abuse reports.
- every post/comment:
  - “Report” button with categories (harassment, 13th stepping, promotion, etc).

---

## 9. data model (proposed)

### `circles`

```js
{
  _id: ObjectId,
  name: String,
  description: String,
  type: "general" | "sponsor-circle" | "step-group",
  createdBy: ObjectId, // userId
  visibility: "private", // future: "invite-only", "link-join"
  maxMembers: Number,
  isDeleted: Boolean,
  createdAt: ISODate,
  updatedAt: ISODate
}

```
circle_members

```js
{
  _id: ObjectId,
  circleId: ObjectId,
  userId: ObjectId,
  role: "owner" | "admin" | "member",
  status: "active" | "pending" | "left" | "removed",
  joinedAt: ISODate,
  leftAt: ISODate
}
```

indexes:
	•	unique active membership: { circleId: 1, userId: 1, status: 1 }
	•	user lookup: { userId: 1, status: 1 }

circle_posts

```js
{
  _id: ObjectId,
  circleId: ObjectId,
  authorId: ObjectId,
  type: "share" | "step-experience" | "linked-entry",
  stepTag: Number, // 1-12 or 10; optional
  tags: [String], // "gratitude", "resentment", "amends", "fear"
  content: String, // sanitized text
  linkedSource: {
    sourceType: "tenth_step" | "step4_inventory" | "reflection" | null,
    entryId: ObjectId, // for traceability (optional)
    snapshot: String // optional: copy at time of sharing
  },
  createdAt: ISODate,
  updatedAt: ISODate,
  isDeleted: Boolean
}
```

indexes:
	•	{ circleId: 1, createdAt: -1 }
	•	{ circleId: 1, stepTag: 1, createdAt: -1 }

circle_comments

```js
{
  _id: ObjectId,
  postId: ObjectId,
  circleId: ObjectId,
  authorId: ObjectId,
  content: String,
  parentId: ObjectId | null,
  createdAt: ISODate,
  isDeleted: Boolean
}
```

indexes:
	•	{ postId: 1, createdAt: 1 }

circle_invites (if we want separate tracking)

```js
{
  _id: ObjectId,
  circleId: ObjectId,
  token: String,
  createdBy: ObjectId,
  expiresAt: ISODate,
  maxUses: Number,
  usedCount: Number,
  isRevoked: Boolean
}
```

10. access control & security

enforce at API and db query level:
	1.	any read/write on circle_posts / circle_comments:
	•	require circle_members.status == "active" for that circleId.
	2.	do not expose:
	•	underlying private step entries unless user is owner of that entry.
	3.	invite tokens:
	•	signed + time-bound.
	4.	logging:
	•	basic audit logs for moderation (who created/removed what).
	5.	all data encrypted in transit; follow existing infra for storage.

⸻

11. UX & UI notes (v1)
	•	entry point:
	•	global nav: “circles”
	•	My circles page listing:
	•	circle name
	•	unread count
	•	quick access.
	•	create circle:
	•	one simple form.
	•	circle page:
	•	header: name, short description, members count.
	•	tabs/filters:
	•	All, Step 1, Step 4, Step 9, Step 10, etc.
	•	composer:
	•	“Share experience, strength, and hope with your circle…”
	•	optional step tag dropdown.
	•	share from existing content:
	•	Share with a circle button on 10th step / inventories:
	•	always show confirmation / redaction step.
	•	in-line guidelines:
	•	one short line:
	•	“Please share from your own experience. Protect others’ anonymity. No last names.”

style:
	•	consistent with AA Companion brand.
	•	calm, safe, not noisy.
	•	no engagement bait.

⸻

12. non-functional requirements
	•	performance
	•	circle feed loads < 500ms p95 for typical circle sizes (< 50 members).
	•	scalability
	•	design assuming:
	•	thousands of circles
	•	small membership per circle.
	•	reliability
	•	no data loss for posts/comments.
	•	observability
	•	metrics:
	•	create/join flows
	•	posts/comments per circle
	•	abuse reports.
	•	compliance / risk
	•	avoid PHI / medical claims.
	•	keep ToS and privacy updated.

⸻

13. risks & mitigations
	1.	misuse / 13th stepping / predatory behavior
	•	mitigation:
	•	reporting tools
	•	moderation guidelines
	•	quick removal/blocking ability.
	2.	anonymity leakage
	•	mitigation:
	•	strict defaults (no surnames)
	•	educational copy
	•	no public listings.
	3.	feature bloat
	•	mitigation:
	•	keep v1 text-only, simple.
	•	no public discovery.
	4.	low adoption
	•	mitigation:
	•	soft onboarding nudges:
	•	“Create a circle with your sponsor”
	•	“Start a Step 4 circle for trusted friends”
	•	highlight circles after users complete certain actions (e.g., 3+ 10th steps).

⸻

14. implementation outline (for engineering)

stack assumption: Next.js (App Router), React, Material UI, MongoDB Atlas, existing auth.

api endpoints (suggested)
	•	POST /api/circles
	•	GET /api/circles (my circles)
	•	GET /api/circles/[id]
	•	PATCH /api/circles/[id]
	•	POST /api/circles/[id]/invite
	•	POST /api/circles/join (token)
	•	POST /api/circles/[id]/members/[userId]/approve
	•	POST /api/circles/[id]/members/[userId]/remove
	•	POST /api/circles/[id]/posts
	•	GET /api/circles/[id]/posts
	•	POST /api/circles/[id]/posts/[postId]/comments
	•	GET /api/circles/[id]/posts/[postId]/comments
	•	POST /api/circles/[id]/leave

integration points
	•	step tools (4, 8, 9, 10)
	•	add share modal calling /api/circles/[id]/posts with snapshot.
	•	auth
	•	reuse existing user session model and IDs.
	•	notification system
	•	hook events:
	•	new post in circle
	•	join request
	•	invite accepted.

⸻

15. future extensions

these are not v1, but v1 must not block them:
	1.	circle meetings
	•	scheduled meetings attached to a circle:
	•	meeting types: text-only, video (3rd-party), async.
	•	readings, formats, timer.
	2.	circle-specific step plans
	•	guided step series run as a circle program.
	3.	AI-assisted summaries (opt-in)
	•	private summaries for members:
	•	important: on-device or strict backend controls; never leak content.
	4.	mobile push + SMS
	•	reminders for meetings, 10th step check-ins, new posts.

⸻

16. decision log (initial)
	•	circles are invite-only private groups, no open/public groups.
	•	no global discovery of circles to avoid anonymity + safety issues.
	•	step work sharing uses snapshots, not direct binding to private journals.
	•	moderation is shared between circle owners/admins and platform admins.
	•	architecture anticipates meeting scheduling & facilitation as next layer.

