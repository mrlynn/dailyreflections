# Volunteer Support Agent System

## Overview

The Volunteer Support Agent is a sophisticated multi-agent AI system built with LangGraph that assists volunteer peer counselors during support conversations in the AA Companion application. The system provides real-time crisis detection, intelligent resource suggestions, response quality coaching, and conversation insights.

## Architecture

### Multi-Agent Graph System

The system uses a **supervisor pattern** with specialized sub-agents coordinated through a LangGraph StateGraph:

```
START → SUPERVISOR → [crisis_check, resource_search, coach_response, analyze_conversation, triage] → SUPERVISOR → END
```

### Key Components

1. **State Management** (`/src/lib/agents/volunteer/state.js`)
   - Zod schemas for type safety
   - Comprehensive state tracking across all agents
   - Helper functions for state creation and validation

2. **Specialized Tools** (`/src/lib/agents/volunteer/tools.js`)
   - 10 DynamicStructuredTools for LLM agents
   - Crisis assessment, semantic search, sentiment analysis, etc.

3. **Agent Nodes** (`/src/lib/agents/volunteer/nodes/`)
   - **Supervisor**: Coordinates workflow and routing
   - **Crisis Detection**: Safety-first crisis identification
   - **Resource Recommendation**: Semantic search in AA literature
   - **Response Coach**: Evaluates volunteer response quality
   - **Conversation Analyst**: Sentiment and topic analysis
   - **Triage**: Prioritizes incoming support requests

4. **Agent Graph** (`/src/lib/agents/volunteer/graph.js`)
   - LangGraph StateGraph implementation
   - Conditional routing logic
   - Streaming support for real-time updates

5. **API Endpoints**
   - `/api/volunteer/agent` - Main analysis endpoint
   - `/api/volunteer/agent/stream` - Server-Sent Events streaming
   - `/api/admin/agent-metrics` - Monitoring dashboard data
   - `/api/admin/setup-agent-database` - Database initialization

6. **UI Components**
   - `AgenticVolunteerChat.js` - Enhanced chat with AI panel
   - `AgentMetricsDashboard.js` - Admin monitoring dashboard

## Database Schema

### Collections

#### 1. `peer_support_conversations`
Stores peer support conversations between users and volunteers.

**Fields:**
```javascript
{
  _id: string,
  userId: string,
  volunteerId: string | null,
  status: 'waiting' | 'active' | 'completed',
  messages: [
    {
      from: string,
      content: string,
      timestamp: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `userId_idx`: { userId: 1 }
- `volunteerId_idx`: { volunteerId: 1 }
- `status_idx`: { status: 1 }
- `createdAt_desc_idx`: { createdAt: -1 }
- `userId_status_idx`: { userId: 1, status: 1 }
- `volunteerId_status_idx`: { volunteerId: 1, status: 1 }

#### 2. `agent_analyses`
Records of all agent workflow executions.

**Fields:**
```javascript
{
  conversationId: string,
  volunteerId: string,
  userId: string,
  timestamp: Date,
  action: string,
  analysis: {
    crisisDetection: {...},
    resourceSuggestions: [...],
    responseCoaching: {...},
    conversationAnalysis: {...},
    triageInfo: {...}
  },
  processingTimeMs: number,
  agentExecutionPath: string[]
}
```

**Indexes:**
- `conversationId_idx`: { conversationId: 1 }
- `volunteerId_idx`: { volunteerId: 1 }
- `userId_idx`: { userId: 1 }
- `timestamp_desc_idx`: { timestamp: -1 }
- `conversation_timestamp_idx`: { conversationId: 1, timestamp: -1 }
- `crisis_flag_idx`: { 'analysis.crisisDetection.isCrisis': 1 }

#### 3. `crisis_alerts`
Active and resolved crisis situations.

**Fields:**
```javascript
{
  conversationId: string,
  userId: string,
  volunteerId: string,
  detectedAt: Date,
  riskLevel: 'low' | 'medium' | 'high' | 'critical',
  indicators: string[],
  recommendedAction: string,
  resolved: boolean,
  resolvedAt: Date | null,
  resolvedBy: string | null
}
```

**Indexes:**
- `conversationId_idx`: { conversationId: 1 }
- `userId_idx`: { userId: 1 }
- `volunteerId_idx`: { volunteerId: 1 }
- `resolved_idx`: { resolved: 1 }
- `riskLevel_idx`: { riskLevel: 1 }
- `detectedAt_desc_idx`: { detectedAt: -1 }
- `unresolved_recent_idx`: { resolved: 1, detectedAt: -1 }
- `risk_resolution_idx`: { riskLevel: 1, resolved: 1 }

#### 4. `agent_performance_metrics`
Daily performance metrics for each agent.

**Fields:**
```javascript
{
  date: Date,
  agentName: string,
  executions: number,
  totalProcessingTime: number,
  lastUpdated: Date
}
```

**Indexes:**
- `date_desc_idx`: { date: -1 }
- `agentName_idx`: { agentName: 1 }
- `agent_date_idx`: { agentName: 1, date: -1 } (unique)

## Agent Workflow

### Standard Flow

1. **New User Message Received**
   - Supervisor routes to `crisis_check` (ALWAYS first for safety)

2. **Crisis Detection**
   - Analyzes message for crisis indicators
   - If critical/high risk → Complete immediately to alert
   - Otherwise → Route to `resource_search`

3. **Resource Search**
   - Semantic search across AA literature
   - Finds relevant Big Book passages, reflections
   - Routes to `coach_response` if volunteer has draft, else `analyze_conversation`

4. **Response Coaching** (if volunteer has draft)
   - Evaluates empathy and quality scores
   - Provides strengths and suggestions
   - Routes to `analyze_conversation`

5. **Conversation Analysis**
   - Sentiment analysis
   - Topic extraction
   - Conversation phase detection
   - Routes to `complete`

6. **Complete**
   - Returns all agent outputs to API

### Routing Rules

**Critical Safety Rules:**
- Crisis check MUST run first for new messages
- Critical/high risk crises complete immediately
- Cannot coach a response that doesn't exist

**Validation:**
The supervisor enforces routing rules even if the LLM suggests invalid paths.

## API Usage

### Analyze Incoming Message

```javascript
POST /api/volunteer/agent
Content-Type: application/json

{
  "conversationId": "conv-123",
  "action": "analyze_message",
  "userMessage": "I'm struggling with cravings today..."
}

Response:
{
  "success": true,
  "analysis": {
    "crisisDetection": {
      "isCrisis": false,
      "riskLevel": "low",
      "indicators": [],
      "recommendedAction": "Continue normal support"
    },
    "resourceSuggestions": [
      {
        "title": "Big Book - Page 24",
        "excerpt": "...",
        "citation": "Alcoholics Anonymous, p. 24",
        "relevanceScore": 0.89
      }
    ],
    "conversationAnalysis": {
      "sentiment": "distressed",
      "topics": ["cravings", "recovery"],
      "conversationPhase": "exploration",
      "conversationQuality": 8
    }
  },
  "metadata": {
    "processingTime": 2341,
    "agentExecutionPath": ["supervisor", "crisis_check", "supervisor", "resource_search", "supervisor", "analyze_conversation", "supervisor"],
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

### Coach Volunteer Response

```javascript
POST /api/volunteer/agent
Content-Type: application/json

{
  "conversationId": "conv-123",
  "action": "coach_response",
  "userMessage": "I'm struggling with cravings today...",
  "volunteerDraft": "That sounds really hard. Have you tried calling your sponsor?"
}

Response:
{
  "success": true,
  "analysis": {
    "responseCoaching": {
      "qualityScore": 7,
      "empathyScore": 8,
      "strengths": [
        "Shows empathy",
        "Provides actionable suggestion"
      ],
      "improvements": [
        "Could acknowledge the courage it takes to share",
        "Consider asking open-ended questions about their coping strategies"
      ],
      "suggestions": "Great start! You might also explore what they've already tried and validate their effort to reach out."
    }
  }
}
```

### Stream Agent Execution

```javascript
const eventSource = new EventSource('/api/volunteer/agent/stream');

eventSource.addEventListener('start', (event) => {
  const data = JSON.parse(event.data);
  console.log('Workflow starting...', data);
});

eventSource.addEventListener('agent_start', (event) => {
  const data = JSON.parse(event.data);
  console.log(`Agent: ${data.agent} - ${data.message}`);
});

eventSource.addEventListener('crisis_detection', (event) => {
  const data = JSON.parse(event.data);
  if (data.crisisDetection.isCrisis) {
    alert(`CRISIS: ${data.crisisDetection.riskLevel}`);
  }
});

eventSource.addEventListener('resources_found', (event) => {
  const data = JSON.parse(event.data);
  displayResources(data.resourceSuggestions);
});

eventSource.addEventListener('complete', (event) => {
  const data = JSON.parse(event.data);
  console.log('Workflow complete', data);
  eventSource.close();
});
```

## Setup & Installation

### 1. Install Dependencies

```bash
npm install @langchain/core @langchain/openai langchain @langchain/langgraph zod recharts
```

### 2. Environment Variables

Add to `.env.local`:

```bash
# OpenAI API Key (required for agents)
OPENAI_API_KEY=sk-...

# MongoDB Connection String (already configured)
MONGODB_URI=mongodb+srv://...
```

### 3. Initialize Database

Run the database setup via API:

```bash
curl -X POST http://localhost:3000/api/admin/setup-agent-database \
  -H "Cookie: your-admin-session-cookie"
```

Or check status:

```bash
curl http://localhost:3000/api/admin/setup-agent-database \
  -H "Cookie: your-admin-session-cookie"
```

### 4. Test the System

Create a test conversation and analyze it:

```javascript
// 1. Create test conversation
const conversation = await db.collection('peer_support_conversations').insertOne({
  _id: 'test-conv-001',
  userId: 'user-123',
  volunteerId: 'volunteer-456',
  status: 'active',
  messages: [
    {
      from: 'user-123',
      content: "I'm really struggling today. I almost relapsed.",
      timestamp: new Date()
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
});

// 2. Run agent analysis
const response = await fetch('/api/volunteer/agent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    conversationId: 'test-conv-001',
    action: 'analyze_message',
    userMessage: "I'm really struggling today. I almost relapsed."
  })
});

const result = await response.json();
console.log(result);
```

## Monitoring & Metrics

### Admin Dashboard

Access the metrics dashboard at:

```
/admin/agent-metrics
```

**Features:**
- Total executions
- Crisis alerts count
- Average processing time
- Success rate
- Execution timeline chart
- Agent distribution pie chart
- Processing times by agent
- Recent analyses table
- Unresolved crisis alerts

### Metrics API

```javascript
GET /api/admin/agent-metrics?range=7d

Response:
{
  "totalExecutions": 1245,
  "crisisAlertsCount": 12,
  "avgProcessingTime": 1823,
  "successRate": 0.987,
  "executionTimeline": [...],
  "agentDistribution": [...],
  "processingTimesByAgent": [...],
  "recentAnalyses": [...],
  "unresolvedCrises": [...]
}
```

## Performance Optimization

### Model Selection

- **Crisis Detection**: GPT-4o (accuracy critical)
- **Resource Search**: GPT-4o (semantic understanding)
- **Response Coaching**: GPT-4o (nuanced feedback)
- **Conversation Analysis**: GPT-4o-mini (cost-effective)
- **Triage**: Rule-based (no LLM needed)

### Caching Strategy

- Vector embeddings for AA literature cached in MongoDB
- Common resource queries cached
- Agent execution paths logged for optimization

### Processing Times

Expected processing times:
- Crisis check: 500-1000ms
- Resource search: 800-1500ms (with vector search)
- Response coaching: 1000-2000ms
- Conversation analysis: 400-800ms (GPT-4o-mini)
- **Total average**: 1800-2500ms

## Security & Privacy

### Authentication

- All API endpoints require authentication
- Volunteer role required for `/api/volunteer/agent`
- Admin role required for `/api/admin/*`

### Data Handling

- Conversation data encrypted at rest (MongoDB encryption)
- No conversation data stored in logs
- Crisis alerts stored separately with access controls
- Agent analyses include only anonymized metadata

### Crisis Protocol

When crisis detected:
1. Immediate alert to volunteer
2. Browser notification (if permitted)
3. Record stored in `crisis_alerts` collection
4. Workflow completes immediately (no further analysis)
5. Recommended action provided to volunteer

## Troubleshooting

### Agent Not Running

**Issue**: API returns 500 error

**Check:**
1. OpenAI API key configured: `echo $OPENAI_API_KEY`
2. MongoDB connection working
3. Check logs for specific error

### Slow Performance

**Issue**: Processing takes >5 seconds

**Solutions:**
1. Check OpenAI API status
2. Review agent execution path (should not cycle)
3. Check MongoDB vector index exists
4. Consider caching frequently requested resources

### Crisis Not Detected

**Issue**: Known crisis keywords not triggering alert

**Check:**
1. Crisis detection agent running (check execution path)
2. Review crisis indicators in agent output
3. Check temperature setting (should be 0 for deterministic)
4. Test with known crisis phrases

## Future Enhancements

### Phase 7: Testing & Optimization

- [ ] Unit tests for each agent node
- [ ] Integration tests for graph workflow
- [ ] Load testing for concurrent conversations
- [ ] A/B testing for different prompts
- [ ] Response quality metrics tracking

### Advanced Features

- [ ] Multi-language support
- [ ] Voice-to-text integration
- [ ] Proactive intervention suggestions
- [ ] Volunteer training recommendations
- [ ] Conversation outcome prediction
- [ ] Resource recommendation learning

## Support

For questions or issues:
- Review logs: Check browser console and server logs
- Database status: `GET /api/admin/setup-agent-database`
- Metrics dashboard: `/admin/agent-metrics`
- GitHub Issues: [Report a bug](https://github.com/your-repo/issues)

## License

Copyright © 2025 AA Companion. All rights reserved.
