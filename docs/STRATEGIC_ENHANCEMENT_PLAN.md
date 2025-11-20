# AA Companion — Usability & Capability Enhancement Plan
**Version:** 1.0  
**Author:** Michael Lynn  
**Date:** November 2025  
**Project URL:** [https://aacompanion.com](https://aacompanion.com)

---

## 1. Purpose
To evolve **AA Companion** into a deeply useful, respectful, and compelling digital recovery resource that supports daily sobriety practices, fosters connection, and honors AA traditions of anonymity and mutual support.

---

## 2. Guiding Principles
- **Simplicity** – Prioritize ease of use and reduce friction for daily use.  
- **Privacy & Trust** – Protect user anonymity and data integrity.  
- **Spiritual & Emotional Utility** – Encourage daily reflection and inventory through gentle prompts.  
- **Accessibility** – Comply with WCAG 2.2 AA standards.  
- **Non-commercial Ethos** – No ads, sponsorships, or public metrics.

---

## 3. Core Experience Improvements

### 3.1 Morning → Midday → Night Flow
Establish a simple, consistent daily loop:
- **Morning:**  
  - Auto-load *Today’s Reflection* upon login.  
  - One-tap journaling (“What resonates with me today?”).  
  - Optional share to sponsor/home group.
- **Midday:**  
  - Short check-in with mood and craving slider.  
  - “Call or text a friend” quick action.  
- **Night:**  
  - 10th Step Inventory: “What did I do well?” and “What can I improve?”  
  - Securely shareable with sponsor.

**UI Element:**  
Add a persistent “Daily Progress Panel” showing:
- Days sober streak  
- Next milestone  
- Open Step 4 or Step 10 items  
- “Start Nightly Inventory” button

---

## 4. Homepage Redesign

### 4.1 Simplify Above-the-Fold
- Replace “Loading…” state with a pre-rendered skeleton screen.  
- Present **two primary buttons** only:  
  - 🟢 “Read Today’s Reflection”  
  - 🟢 “Open Journal”  

### 4.2 First-Time Onboarding
- 90-second setup:
  1. Enter sobriety date and time zone  
  2. Select AM/PM reminder times  
  3. Add optional accountability contact(s)

---

## 5. Personalization & Reminders

### 5.1 Sobriety-Aware Interface
- Display milestones (e.g., “90 days this Friday”)  
- Gentle prompts and encouragement messages  

### 5.2 Topic-Aware Suggestions
- If a user journals about “fear,” surface related Big Book topics or Step 4 worksheets.  
- Use vector search (existing MongoDB integration) for semantic matching.

### 5.3 Reminder System
- Configurable AM/PM notifications via **email or SMS**  
- Reminder types:
  - Morning reflection
  - Midday check-in
  - Evening inventory

---

## 6. Meeting Finder Integration

### 6.1 Data Source
Integrate **Code for Recovery TSML UI** and **Meeting Guide API**.

### 6.2 Core Features
- “Meetings Near Me” using location permission  
- Meeting search by format, time, and accessibility  
- “Add to Calendar” or “Notify Me” feature  
- “Running late?” one-tap text to home group contact

### 6.3 Implementation Steps
1. Embed `tsml-ui` React component or iframe integration.  
2. Configure `meetings` collection in MongoDB to cache results.  
3. Schedule nightly sync with the official feed.

---

## 7. Step Tools Enhancement

### 7.1 Step 4 (Moral Inventory)
- Add guided templates (resentments, fears, harms).  
- Mobile-friendly entry interface.  
- Export to secure PDF (user-owned, not stored after download).  
- Local encryption or passcode-protection options.

### 7.2 Step 10 (Ongoing Inventory)
- Streak and trend visualization: recurring character defects or patterns.  
- Optional sponsor sharing toggle.  
- Encouraging feedback (“Progress, not perfection” summary).

---

## 8. Social & Community Features

### 8.1 Private Circles
- Small, invitation-only groups (sponsor/sponsee/home group).  
- Share reflections, milestones, or meeting notes privately.  
- No public likes, follows, or metrics.

### 8.2 Prompt-Based Sharing
- “What’s helping me today?”  
- “A moment of gratitude…”  
- Include meme/image sharing (humor in recovery) — optional and anonymous.

### 8.3 Moderation Framework
- Automated filters for trigger or crisis keywords.  
- Permanent “Get Help Now” banner linking to hotline numbers.

---

## 9. Messaging & Notifications

### 9.1 SMS Integration
- Daily reflection snippet with link.  
- “Text to Journal” (reply-to-entry feature).  
- Meeting reminders and milestone alerts.  

### 9.2 Secure Sponsor Sharing
- One-tap link to share nightly inventory via expiring private URL.

---

## 10. Accessibility, Speed & Trust

### 10.1 Accessibility
- WCAG 2.2 AA compliance  
- Keyboard and screen reader navigation  
- Reduced motion and high-contrast modes  

### 10.2 Performance
- Pre-render reflection page  
- Lazy-load non-critical scripts  
- Optimize images  

### 10.3 Privacy & Security
- Encryption at rest and in transit  
- Simple “Export My Data” and “Delete My Data” options  
- “Not Affiliated with Alcoholics Anonymous” disclaimer maintained  

---

## 11. AI Assistant Guardrails

### 11.1 Scope
- Provide spiritual guidance, step explanations, and AA literature summaries.  
- **No** medical, diagnostic, or therapeutic advice.

### 11.2 Behavior
- Offer contextual support with citations to AA-approved literature.  
- Detect and redirect crisis language to resources immediately.  

### 11.3 Technical Enhancements
- Use MongoDB Vector Search for retrieval-augmented Q&A.  
- Maintain a safe response template library.

---

## 12. Metrics & Reporting

| Metric | Description | Goal |
|--------|--------------|------|
| **Activation Rate** | % of new users completing onboarding | ≥ 75% |
| **Daily Reflection Completion** | Morning reflections logged per day | +20% MoM |
| **Inventory Completion** | Nightly Step 10 inventories | +25% MoM |
| **Meeting Engagement** | Users searching or attending meetings | +15% MoM |
| **Retention (D30)** | Active users after 30 days | ≥ 50% |
| **Sponsor Connections** | % with accountability contacts | ≥ 60% |

---

## 13. Implementation Roadmap

### Phase 1 — (0–30 Days)
- Redesign homepage and daily loop  
- Implement onboarding + reminder setup  
- Integrate meeting finder (TSML UI)  
- Add crisis banner and privacy options  

### Phase 2 — (31–60 Days)
- Add Step 4 templates + Step 10 trends  
- Enable email/SMS reminders  
- Launch text-to-journal feature  
- Roll out private circle prototype  

### Phase 3 — (61–90 Days)
- Launch streak celebration flows  
- Enable weekly planner (“Plan My Week”)  
- Implement sponsor sharing links  
- Publish retention dashboard  

---

## 14. UI / UX Enhancements

### Design Guidelines
- **Tone:** Supportive, humble, and human  
- **Color Scheme:** Calm green/blue palette aligned with serenity theme  
- **Typography:** Large sans-serif, easy to read  
- **Microcopy:** Replace “Submit” with “Continue the journey” or similar empathetic phrasing  
- **Dark Mode:** Default to system preference  

---

## 15. Deliverables

| Deliverable | Owner | Due |
|--------------|--------|-----|
| Homepage redesign | UX/UI | Day 30 |
| Meeting finder integration | Frontend | Day 30 |
| Reminder scheduler | Backend | Day 45 |
| Step 4 & 10 enhancements | Backend + UI | Day 60 |
| SMS journaling | API Engineer | Day 75 |
| Private circles | Full stack | Day 90 |
| Dashboard metrics | Data engineer | Day 90 |

---

## 16. Future Exploration
- **Voice journaling** (speech-to-text integration)  
- **Offline reflection mode**  
- **Language localization** (Spanish, French)  
- **Sponsor verification badges** (opt-in trust marker)  
- **Community events feed** tied to local intergroup data  

---

## 17. Closing Notes
AA Companion is designed to be **a gentle daily companion** — not a replacement for meetings or sponsors, but a digital ally that helps people stay connected to the spiritual path of recovery. Every enhancement should reflect humility, usefulness, and service.

---