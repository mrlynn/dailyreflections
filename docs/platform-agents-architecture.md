# Platform-Level Agentic AI Architecture

## Overview

This document outlines the architecture for expanding the agentic AI system beyond chat support to include platform-level intelligent agents that monitor, protect, and enhance the Daily Reflections platform.

## Current State

**Existing Agentic AI:**
- Volunteer Support Agent (chat-based, Ably-dependent)
- Multi-agent system using LangGraph
- Supervisor pattern with specialized agents
- State management with Zod schemas
- Real-time streaming with SSE

**Location:** `/src/lib/agents/volunteer/`

## Vision: Three Platform-Level Agent Systems

### 1. System Observation Agent 🔍

**Purpose:** Intelligent platform monitoring and analytics

**Capabilities:**
- Monitor volunteer load and availability
- Track meeting attendance patterns
- Identify "hot spots" needing more facilitators
- Analyze peak hours for chat support
- Generate recovery journey analytics (aggregate, non-identifiable)
- Detect relapse-risk trends (system-wide patterns only)

**Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                  System Observation Agent                    │
│                     (Scheduled Execution)                    │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
  ┌──────────┐      ┌──────────────┐    ┌──────────────┐
  │ Data     │      │  Analysis    │    │  Insights    │
  │ Collector│─────▶│  Engine      │───▶│  Generator   │
  │ Agent    │      │  Agent       │    │  Agent       │
  └──────────┘      └──────────────┘    └──────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
  ┌──────────┐      ┌──────────────┐    ┌──────────────┐
  │ MongoDB  │      │  Trend       │    │  Dashboard   │
  │ Queries  │      │  Detection   │    │  API         │
  └──────────┘      └──────────────┘    └──────────────┘
```

**Data Sources:**
- `VolunteerApplication` - volunteer pipeline
- `ChatSession` / `ChatMessage` - support activity
- `MeetingAttendance` - meeting engagement
- `User` - user activity patterns (anonymized)
- `ChatFeedback` - quality indicators

**Tools Needed:**
1. `aggregate_volunteer_metrics` - Compute volunteer load, response times, availability
2. `analyze_meeting_attendance` - Identify high/low attendance patterns by time/location
3. `detect_support_hotspots` - Find times/topics needing more coverage
4. `compute_journey_analytics` - Aggregate recovery journey patterns
5. `generate_system_health_report` - Overall platform health assessment

**Execution Schedule:**
- Real-time: Monitor critical metrics (volunteer availability, crisis alerts)
- Hourly: Update support load and hotspot detection
- Daily: Generate trend reports and analytics
- Weekly: Comprehensive system health reports

**Output:**
- Admin dashboard with actionable insights
- Automated alerts for resource needs
- Trend reports for strategic planning
- Anonymized recovery pattern insights

---

### 2. Abuse Shield Agent 🛡️

**Purpose:** Protect the platform from spam, trolls, and bots

**Capabilities:**
- Detect spam content in comments, chat, reflections
- Identify troll behavior patterns
- Distinguish bots from genuine users
- Auto-moderate low-confidence abuse
- Flag high-confidence abuse for human review
- Learn from moderation decisions

**Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                     Abuse Shield Agent                       │
│                  (Event-Driven + Scheduled)                  │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
  ┌──────────┐      ┌──────────────┐    ┌──────────────┐
  │ Content  │      │  Behavior    │    │  Bot         │
  │ Scanner  │      │  Analyzer    │    │  Detector    │
  │ Agent    │      │  Agent       │    │  Agent       │
  └──────────┘      └──────────────┘    └──────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
  ┌──────────┐      ┌──────────────┐    ┌──────────────┐
  │ LLM      │      │  Pattern     │    │  ML Model    │
  │ Analysis │      │  Matching    │    │  (Optional)  │
  └──────────┘      └──────────────┘    └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
                    ┌──────────────┐
                    │  Moderation  │
                    │  Supervisor  │
                    │  Agent       │
                    └──────────────┘
                            │
                ┌───────────┼───────────┐
                ▼                       ▼
        ┌──────────────┐        ┌──────────────┐
        │  Auto-Action │        │  Human       │
        │  (Low Risk)  │        │  Review      │
        └──────────────┘        │  Queue       │
                                └──────────────┘
```

**Trigger Points:**
- `POST /api/comments` - New comment submission
- `POST /api/chat/message` - Chat message sent
- `POST /api/reflections` - Journal entry created
- `POST /api/auth/register` - New user registration
- Scheduled: Periodic scan of existing content

**Data Sources:**
- `ModerationEvent` - Historical moderation decisions
- `ChatMessage` / Comments - Content to analyze
- `User` - User behavior patterns
- IP addresses, user agents (for bot detection)

**Tools Needed:**
1. `analyze_content_toxicity` - LLM-based content analysis for spam/abuse
2. `detect_spam_patterns` - Pattern matching for known spam
3. `analyze_user_behavior` - Behavioral signals (posting frequency, timing)
4. `check_bot_indicators` - Technical signals (user agent, IP, honeypot)
5. `get_moderation_history` - Learn from past decisions
6. `auto_moderate_content` - Take action (hide, flag, warn)

**Risk Levels:**
- **Low Risk (Auto-Action):** Hide content, shadowban, rate limit
- **Medium Risk (Flag + Notify):** Flag for review, notify moderators
- **High Risk (Immediate Action):** Block user, alert admin, preserve evidence

**Learning Loop:**
- Track moderation decisions (approve/reject)
- Feed back into pattern recognition
- Improve confidence thresholds over time

---

### 3. Ghibli Art Director Agent 🎨

**Purpose:** Automatically generate beautiful, consistent artwork across the platform

**Capabilities:**
- Generate daily reflection art
- Create step illustrations
- Design milestone badges
- Produce seasonal graphics
- Maintain consistent Ghibli-inspired style
- Optimize for different sizes/contexts

**Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                   Ghibli Art Director Agent                  │
│                     (Scheduled + On-Demand)                  │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
  ┌──────────┐      ┌──────────────┐    ┌──────────────┐
  │ Style    │      │  Prompt      │    │  Image       │
  │ Guide    │      │  Composer    │    │  Generator   │
  │ Agent    │      │  Agent       │    │  Agent       │
  └──────────┘      └──────────────┘    └──────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
  ┌──────────┐      ┌──────────────┐    ┌──────────────┐
  │ Style    │      │  GPT-4       │    │  DALL-E 3 /  │
  │ Rules DB │      │  (Creative)  │    │  Midjourney  │
  └──────────┘      └──────────────┘    └──────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │  Quality     │
                    │  Validator   │
                    │  Agent       │
                    └──────────────┘
                            │
                ┌───────────┼───────────┐
                ▼                       ▼
        ┌──────────────┐        ┌──────────────┐
        │  Approved    │        │  Needs       │
        │  → CDN       │        │  Revision    │
        └──────────────┘        └──────────────┘
```

**Use Cases:**

1. **Daily Reflection Art**
   - Input: Daily reflection text + date
   - Output: Serene illustration matching tone
   - Style: Soft watercolors, nature themes, hopeful
   - Schedule: Generated 1 day ahead

2. **Step Illustrations**
   - Input: Step number + description
   - Output: Symbolic representation
   - Style: Thoughtful, introspective, journey-focused
   - Trigger: On-demand or bulk generation

3. **Milestone Badges**
   - Input: Milestone type (30 days, 1 year, etc.)
   - Output: Celebratory badge design
   - Style: Joyful, accomplished, encouraging
   - Trigger: New milestone type needed

4. **Seasonal Graphics**
   - Input: Season + event (spring, holidays, etc.)
   - Output: Seasonal header/background art
   - Style: Nature, seasons, renewal themes
   - Schedule: Monthly or seasonal

**Tools Needed:**
1. `load_style_guidelines` - Retrieve style rules for consistency
2. `analyze_content_tone` - Understand content to match art mood
3. `compose_art_prompt` - Create detailed image generation prompt
4. `generate_image` - Call DALL-E 3 or Midjourney API
5. `validate_image_quality` - Check for consistency, appropriateness
6. `optimize_for_web` - Resize, compress, generate variants
7. `store_artwork` - Upload to CDN, save metadata

**Style Guidelines (Stored in DB):**
```json
{
  "overall_aesthetic": "Studio Ghibli inspired",
  "color_palette": ["soft pastels", "nature greens", "warm earth tones"],
  "mood": ["hopeful", "serene", "contemplative", "uplifting"],
  "avoid": ["dark themes", "aggressive imagery", "commercial style"],
  "elements": ["nature", "light", "journey imagery", "growth symbols"],
  "art_style": ["watercolor", "hand-drawn feel", "gentle lines", "organic shapes"]
}
```

**Quality Validation:**
- Check for consistent style
- Verify appropriate content (no triggers)
- Ensure text is readable (for badges)
- Validate dimensions and quality
- Human review for new categories

---

## Technical Architecture

### Shared Infrastructure

All three agent systems will share common infrastructure:

**1. Agent Framework**
```
/src/lib/agents/
├── volunteer/          # Existing chat agent
├── platform/           # NEW: Platform agents
│   ├── observation/    # System Observation Agent
│   │   ├── graph.js
│   │   ├── nodes/
│   │   ├── tools.js
│   │   └── state.js
│   ├── abuse-shield/   # Abuse Shield Agent
│   │   ├── graph.js
│   │   ├── nodes/
│   │   ├── tools.js
│   │   └── state.js
│   └── art-director/   # Ghibli Art Director Agent
│       ├── graph.js
│       ├── nodes/
│       ├── tools.js
│       └── state.js
└── shared/             # Shared utilities
    ├── schedulers/     # Cron job scheduling
    ├── storage/        # Result storage
    └── monitoring/     # Agent metrics
```

**2. Execution Models**

Each agent has different execution patterns:

| Agent | Execution Model | Trigger |
|-------|----------------|---------|
| Volunteer Support | Real-time, Event-driven | Chat message sent |
| System Observation | Scheduled (cron) | Hourly/Daily/Weekly |
| Abuse Shield | Event-driven + Scheduled | Content creation + periodic scans |
| Art Director | Scheduled + On-demand | Daily generation + admin requests |

**3. Storage**

MongoDB collections needed:

```javascript
// System Observation
agent_system_observations: {
  timestamp: Date,
  metrics: {
    volunteer_load: Object,
    meeting_attendance: Object,
    support_hotspots: Array,
    journey_analytics: Object
  },
  insights: Array,
  alerts: Array
}

// Abuse Shield
agent_moderation_decisions: {
  timestamp: Date,
  content_id: String,
  content_type: String,
  risk_level: String,
  action_taken: String,
  confidence: Number,
  signals: Object,
  human_reviewed: Boolean,
  human_decision: String
}

// Art Director
agent_generated_artwork: {
  timestamp: Date,
  artwork_type: String,
  prompt: String,
  style_version: String,
  image_url: String,
  metadata: Object,
  quality_score: Number,
  approved: Boolean
}
```

**4. API Endpoints**

```
# System Observation
GET  /api/admin/agents/observation/metrics
GET  /api/admin/agents/observation/insights
POST /api/admin/agents/observation/run-now

# Abuse Shield
POST /api/agents/abuse-shield/analyze
GET  /api/admin/agents/abuse-shield/queue
POST /api/admin/agents/abuse-shield/review/:id

# Art Director
POST /api/admin/agents/art-director/generate
GET  /api/admin/agents/art-director/gallery
POST /api/admin/agents/art-director/approve/:id
```

**5. Scheduling**

Use Vercel Cron or Node-cron for scheduled execution:

```javascript
// /src/lib/agents/platform/scheduler.js
import cron from 'node-cron';

// System Observation - Every hour
cron.schedule('0 * * * *', async () => {
  await runObservationAgent('hourly');
});

// System Observation - Daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  await runObservationAgent('daily');
});

// Art Director - Daily at 1 AM (prepare next day's art)
cron.schedule('0 1 * * *', async () => {
  await runArtDirector('daily-reflection');
});

// Abuse Shield - Every 30 minutes (scan recent content)
cron.schedule('*/30 * * * *', async () => {
  await runAbuseShield('periodic-scan');
});
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Create `/src/lib/agents/platform/` directory structure
- [ ] Set up shared utilities and monitoring
- [ ] Create MongoDB schemas for agent results
- [ ] Implement basic scheduler infrastructure
- [ ] Create admin UI skeleton for platform agents

### Phase 2: System Observation Agent (Week 2-3)
- [ ] Implement data collector tools
- [ ] Build analysis engine nodes
- [ ] Create insights generator
- [ ] Set up scheduled execution
- [ ] Build admin dashboard for insights
- [ ] Test with real platform data

### Phase 3: Abuse Shield Agent (Week 3-4)
- [ ] Implement content scanner tools
- [ ] Build behavior analyzer
- [ ] Create moderation supervisor logic
- [ ] Integrate with existing content creation flows
- [ ] Build human review queue UI
- [ ] Test with historical moderation data

### Phase 4: Ghibli Art Director Agent (Week 4-6)
- [ ] Define and store style guidelines
- [ ] Implement prompt composer
- [ ] Integrate with DALL-E 3 API
- [ ] Build quality validation
- [ ] Create admin gallery UI
- [ ] Generate initial artwork library
- [ ] Set up CDN storage and delivery

### Phase 5: Integration & Polish (Week 6-7)
- [ ] Integrate all agents into admin dashboard
- [ ] Add comprehensive metrics and monitoring
- [ ] Performance optimization
- [ ] Documentation and training materials
- [ ] User acceptance testing
- [ ] Deploy to production

---

## Key Benefits

### System Observation Agent
✅ **Proactive resource allocation** - Know where to deploy volunteers before issues arise
✅ **Data-driven decision making** - Insights based on actual platform patterns
✅ **Early warning system** - Detect problems before they impact users
✅ **Strategic planning** - Understand growth patterns and user needs

### Abuse Shield Agent
✅ **24/7 protection** - Never sleep, always vigilant
✅ **Faster response** - Auto-moderate obvious abuse instantly
✅ **Reduced admin burden** - Only review uncertain cases
✅ **Learning system** - Gets smarter over time from moderation decisions

### Ghibli Art Director Agent
✅ **Consistent aesthetics** - Every piece feels handcrafted and cohesive
✅ **Scalable creativity** - Generate unlimited artwork without designer bottleneck
✅ **Timely content** - Art ready before it's needed (daily reflections, seasonal)
✅ **Cost effective** - One-time setup vs ongoing design costs

---

## Success Metrics

**System Observation:**
- Reduction in volunteer burnout (more balanced load distribution)
- Increased meeting attendance (better facilitator allocation)
- Faster crisis response times (hotspot detection)
- Admin time saved on manual reporting

**Abuse Shield:**
- % of spam caught before human sees it
- False positive rate < 2%
- Average time to moderate: < 5 minutes
- User reports of abuse: decreased

**Art Director:**
- # of unique artworks generated per week
- Style consistency score (validated by human)
- Time from request to delivery: < 1 hour
- User engagement with illustrated content: increased

---

## Privacy & Ethics

**System Observation:**
- ✅ All analytics are AGGREGATE only
- ✅ No individual user tracking
- ✅ No personally identifiable information
- ✅ Data retention: 90 days max
- ✅ Anonymization before analysis

**Abuse Shield:**
- ✅ Human review for all account-level actions
- ✅ Appeals process for false positives
- ✅ Transparency about automated moderation
- ✅ Data used only for safety, never sold
- ✅ Preserve user dignity in all actions

**Art Director:**
- ✅ All artwork original (AI-generated)
- ✅ No copyrighted material in prompts
- ✅ Human review for sensitive content
- ✅ Credit given to AI assistance
- ✅ Appropriate for recovery context

---

## Next Steps

**Immediate:**
1. Review and approve architecture
2. Prioritize which agent to build first
3. Allocate resources and timeline
4. Set up development environment

**Recommended Order:**
1. **Start with System Observation** - Provides immediate value, low risk
2. **Then Abuse Shield** - Critical for community health as you grow
3. **Finally Art Director** - Enhances experience, less critical path

Would you like to proceed with implementation? Which agent should we start with?
