# AA Companion — Feature Discovery Plan

## Purpose

AA Companion has evolved into a rich, multi-faceted platform supporting recovery through reflection, connection, and daily practice.  
This plan outlines a cohesive strategy to help new and returning users discover, understand, and meaningfully engage with the app’s features — without overwhelming them.

---

## Objectives

1. **Reduce cognitive load** for new users by guiding them through the app’s core features.
2. **Increase engagement and retention** by helping users uncover underutilized features.
3. **Strengthen emotional connection** through narrative design and consistent use of the mascot as a trusted guide.
4. **Foster discovery through curiosity** rather than instruction — “find, not read about.”

---

## Feature Landscape

| Category | Feature | Purpose |
|-----------|----------|---------|
| Daily Practice | Daily Reflections | Center users in spiritual reflection and gratitude |
| Spiritual Growth | 12 Steps Explorer | Interactive, visual exploration of each step |
| Connection | Circles (social feature) | Share progress, reflections, and mutual support |
| Meetings | Meeting Finder (TSML integration) | Discover local or virtual AA meetings |
| Accountability | SMS Reminders | Stay consistent with daily practice |
| Milestones | Sobriety Coins | Celebrate and visualize recovery progress |
| Education | Big Book Reader | Read and search the Big Book with annotations |
| Guidance | Recovery Assistant (Chatbot) | Personalized support and spiritual prompts |
| Engagement | Blog, Stories, Posts | Share experience, strength, and hope |

---

## Phase 1 — Onboarding & Orientation (0–30 Days)

### 1. Guided First Experience
**Goal:** Create a warm, story-driven onboarding journey that introduces the app’s value and main features.

**Implementation:**
- 5-card welcome carousel after first sign-in:
  1. *“Welcome, friend — this is your daily companion.”*
  2. *“Start each day with reflection.”*
  3. *“Explore the Steps and find meaning.”*
  4. *“Stay connected and celebrate progress.”*
  5. *“Let your companion guide you.”* (CTA → “Start my daily journey”)

**UX Notes:**
- Soft fade transitions, Ghibli-style illustration backgrounds.
- Progress indicator dots.
- “Skip intro” option for returning users.

---

### 2. Quick Start Button
On first launch, show a centered button:
> **Start your daily reflection →**

After completion, suggest:
> “Would you like to explore the next feature?” (12 Steps Explorer)

**Goal:** Gradual exposure to features.

---

### 3. Welcome Email Sequence
**Timing:**
- **Day 1:** “Welcome to your journey” — reflection + app overview.
- **Day 3:** “How to track your progress.”
- **Day 7:** “Celebrate your first milestone.”

**Tone:** Calm, encouraging, no push marketing.

---

## Phase 2 — In-App Feature Education (30–90 Days)

### 4. Companion Guide Overlay
**Access:** Floating lantern icon bottom-right corner.

**Function:**
Interactive guide offering quick actions:
- “Read today’s reflection”
- “Find a meeting”
- “See my coins”
- “Explore the steps”
- “Ask the companion” (Chatbot)

**Tech Note:** Can leverage chatbot backend + context prompts.

---

### 5. Discover Page (Feature Hub)
**Location:** `/discover` or “Explore” tab in bottom nav.

**Layout:**
Grid or scrollable cards with short blurbs:
> 🌅 *Start your day*: Daily Reflection  
> 🔦 *Explore the path*: The 12 Steps  
> 💬 *Find connection*: Circles  
> 🪙 *Celebrate progress*: Coins  
> 📖 *Read deeply*: Big Book Reader  
> 💭 *Stay consistent*: SMS reminders  

Each card links directly to its feature or tutorial.

---

### 6. Mascot Guidance System
**Concept:** The Ghibli-style lantern character becomes a subtle in-app narrator.

**Examples:**
- Tooltip: “Did you know you can highlight passages in the Big Book?”
- On milestone: “You’ve reached 30 days — want to view your coin?”
- On reflection streak: “Seven days of reflection — that’s progress worth noticing.”

**Goal:** Emotional reinforcement + gentle education.

---

### 7. Feature of the Week
Rotating spotlight banner on the home screen.

**Examples:**
- “✨ New: Big Book Reader now supports highlighting.”
- “🔔 Set daily text reminders for your reflections.”
- “🪙 Celebrate 30 days of sobriety with your milestone coin.”

**Analytics:** Track CTR to measure feature engagement.

---

## Phase 3 — Ongoing Engagement (90+ Days)

### 8. “I Didn’t Know It Could Do That” Campaign
Periodic in-app messages or email snippets that uncover hidden or advanced features.

Examples:
- “Try searching by phrase in the Big Book Reader.”
- “You can now create or join Circles for mutual support.”
- “Explore your Step Journey visually.”

**Tone:** Light, curious, discovery-oriented.

---

### 9. Analytics-Driven Prompts
Detect unused features via user activity.

**Examples:**
- If user never opened “Coins”: prompt “Track your milestones.”
- If user reads daily but hasn’t explored “Steps”: prompt “Want to understand what the Steps mean?”

**Implementation:**  
- Store usage flags in MongoDB user profiles.
- Serve personalized prompts via chatbot or modal overlay.

---

### 10. QR & Shortlink Integration
For physical meeting cards, pamphlets, or sponsor sharing:
- Create short branded domain (`aac.pm`, `goaac.com`, or `aacon.me`).
- Landing page: `goaac.com/start` → “Welcome to your companion.”
- Buttons: **Daily Reflection**, **Steps**, **Find Meetings**, **Learn More**

**Goal:** Bridge in-person recovery with digital engagement.

---

### 11. Blog & Learn Hub
Location: `/learn` or `/stories`.

**Content Types:**
- “How to use Circles for Connection”
- “How to Celebrate Your First Year”
- “Big Book Reader: Searching by Theme”
- “Finding Strength Through Reflection”

Short-form articles, video clips, and community stories.

---

## Phase 4 — Continuous Discovery Loop

1. **New Feature Announcements**
   - In-app banners, push notifications, or email teasers.
2. **Seasonal Themes**
   - Example: December = “Gratitude Month,” surfacing related features.
3. **Feedback Loops**
   - “What feature helped you most this month?”
   - Integrate feedback into feature prioritization.

---

## UX and Design Guidelines

| Element | Recommendation |
|----------|----------------|
| **Tone** | Gentle, hopeful, guiding |
| **Color palette** | MongoDB Spring Green + watercolor-inspired pastels |
| **Mascot use** | Always guiding, never idolized |
| **Typography** | Rounded, approachable sans-serif |
| **Motion** | Subtle fades, light parallax |
| **Accessibility** | WCAG 2.1 AA compliance; larger touch targets; voice accessibility support |

---

## Measurement & Success Metrics

| Metric | Target |
|--------|--------|
| % of users completing onboarding | ≥ 75% |
| Feature engagement increase (30 days) | +40% |
| Return visits (weekly) | ≥ 60% |
| SMS reminder opt-ins | +25% |
| Circles participation | +30% |
| Big Book Reader sessions | +20% |
| Feedback submissions | +15% |

---

## Next Steps

1. Implement onboarding carousel and discover page (Phase 1).
2. Add Companion Guide overlay with basic chatbot integration.
3. Configure analytics triggers for feature awareness.
4. Prepare physical QR card designs linking to short URL landing page.
5. Launch “Feature of the Week” program alongside email onboarding.

---

### Notes

AA Companion’s mission is sacred — to help people find connection and purpose in recovery.  
Feature discovery is not just about increasing engagement metrics — it’s about guiding users toward *spiritual and emotional growth*, one gentle nudge at a time.

---