# System Observation Agent 🔍

A scheduled agentic AI system that monitors platform health, analyzes trends, and generates actionable insights for administrators.

## Overview

The System Observation Agent is the first of three platform-level agents designed to enhance Daily Reflections. Unlike the real-time volunteer support agent, this agent:

- **Runs on a schedule** (hourly, daily, weekly, or on-demand)
- **Analyzes aggregate data** across the entire platform
- **Generates strategic insights** for resource allocation
- **Maintains privacy** through anonymization and aggregation

## Architecture

```
    START
      │
      ▼
 ┌──────────┐
 │Supervisor│◄─────┐
 └────┬─────┘      │
      │            │
 ┌────┴────────────┴─────┐
 │ Conditional Routing   │
 └────┬────────────┬─────┘
      │            │
      ▼            ▼
 ┌─────────┐  ┌─────────────┐
 │Volunteer│  │  Meeting    │
 │ Metrics │  │ Attendance  │
 └────┬────┘  └──────┬──────┘
      │              │
      │     ┌────────┴────────┐
      │     │                 │
      ▼     ▼                 ▼
 ┌─────────┐  ┌──────────────┐
 │Support  │  │   Journey    │
 │Hotspots │  │  Analytics   │
 └────┬────┘  └──────┬───────┘
      │              │
      └──────┬───────┘
             ▼
     ┌───────────────┐
     │   Insights    │
     │   Generator   │
     └───────┬───────┘
             │
             ▼
         Supervisor
             │
             ▼
            END
```

## Components

### State Schema (`state.js`)

Defines the type-safe state that flows through the agent graph:

- **Metadata**: Observation ID, type, time period
- **Collected Metrics**: Volunteer metrics, meeting attendance, support hotspots, journey analytics
- **Analysis Results**: AI-generated insights, alerts, trends
- **Routing**: Supervisor decisions
- **Output**: Summary reports

### Tools (`tools.js`)

Specialized tools for data collection and analysis:

1. **collectVolunteerMetricsTool** - Gathers volunteer availability, load distribution, response times
2. **analyzeMeetingAttendanceTool** - Identifies hotspots (high demand) and cold spots (low attendance)
3. **detectSupportHotspotsTool** - Finds coverage gaps by time/topic
4. **collectJourneyAnalyticsTool** - Aggregates user engagement metrics (privacy-safe)
5. **generateInsightsTool** - Uses GPT-4 to create actionable recommendations

### Nodes

#### Supervisor Node (`nodes/supervisor.js`)
- Orchestrates data collection sequence
- Routes to appropriate collection nodes
- Triggers analysis when all data is gathered

#### Data Collector Nodes (`nodes/dataCollector.js`)
- `collectVolunteerMetricsNode` - Volunteer program metrics
- `collectMeetingDataNode` - Meeting attendance patterns
- `collectSupportDataNode` - Support coverage analysis
- `collectJourneyDataNode` - User engagement metrics

#### Insights Generator Node (`nodes/insightsGenerator.js`)
- Analyzes collected metrics using GPT-4
- Generates prioritized insights
- Creates alerts for urgent issues
- Produces human-readable summary report

### Graph (`graph.js`)

The main state graph that:
- Defines state channels with update strategies
- Connects all nodes with conditional routing
- Manages execution flow
- Provides `runObservationAgent()` function for execution

## Usage

### Running an Observation

**Via API (Admin only):**

```javascript
POST /api/admin/agents/observation/run

Body:
{
  "observationType": "on-demand", // or "hourly", "daily", "weekly"
  "startTime": "2025-01-01T00:00:00Z", // Optional
  "endTime": "2025-01-02T00:00:00Z"    // Optional
}
```

**Programmatically:**

```javascript
import { runObservationAgent } from '@/lib/agents/platform/observation/graph';

const result = await runObservationAgent({
  observationType: 'daily',
  startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
  endTime: new Date(),
});

console.log(result.insights); // AI-generated insights
console.log(result.alerts);   // Urgent issues
console.log(result.summary_report); // Human-readable report
```

### Viewing Results

**Via Admin Dashboard:**

Navigate to: `/admin/system-observation`

The dashboard displays:
- Key metrics (active volunteers, response times, engagement)
- Prioritized insights with recommended actions
- Unacknowledged alerts
- Detailed metrics by category
- Full summary report

**Via API:**

```javascript
GET /api/admin/agents/observation?latest=true
GET /api/admin/agents/observation?type=daily&limit=10
```

## Metrics Collected

### Volunteer Program
- Total active volunteers
- Volunteers currently online
- Average sessions per volunteer
- Response time (mean/median)
- Load distribution (underutilized/optimal/high/critical)
- Busiest hours of the day
- Volunteers near capacity (burnout risk)

### Meeting Attendance
- Total meetings scheduled
- Average attendance per meeting
- **Hotspots**: High-demand meetings needing more facilitators
- **Cold spots**: Low-attendance meetings needing promotion
- Peak days and hours
- Top locations by attendance

### Support Coverage
- Coverage gaps by day/hour
- Conversation demand vs. volunteer supply
- High-demand topics
- Recommended resource allocation

### User Engagement (Privacy-Safe)
- Daily/weekly/monthly active users
- Feature usage (reflections, chat, meetings, etc.)
- Retention rates (7/30/90 day)
- Milestone achievements
- Content effectiveness (most shared/commented)

**Privacy Guarantees:**
- ✅ All metrics are aggregate only
- ✅ No individual user identification
- ✅ No personally identifiable information (PII)
- ✅ Data retention: Configurable (default 90 days)

## Insights Generated

The AI generates four types of insights:

1. **Opportunities** - Growth or improvement opportunities
   - Example: "Increasing engagement on weekends could benefit from more volunteer coverage"

2. **Warnings** - Potential issues to monitor
   - Example: "Volunteer response times increasing over past week"

3. **Recommendations** - Specific actions to take
   - Example: "Recruit 2-3 facilitators for Monday evening meetings"

4. **Celebrations** - Positive achievements
   - Example: "7-day retention improved by 15% this month!"

Each insight includes:
- Priority level (low/medium/high/urgent)
- Category (volunteer_program, meeting_attendance, etc.)
- Description and context
- Suggested actions (if actionable)
- Expected impact

## Alerts

Urgent insights are elevated to alerts:

- **Severity levels**: Low, medium, high, critical
- **Acknowledgment tracking**: Admin can mark as acknowledged
- **Recommended actions**: Clear next steps
- **Timestamp**: When the issue was detected

## Database Schema

Results are stored in the `system_observations` collection:

```javascript
{
  observation_id: "obs_1234567890",
  observation_type: "daily",
  time_period: { start: Date, end: Date },

  // Metrics
  volunteer_metrics: { ... },
  meeting_attendance: { ... },
  support_hotspots: { ... },
  journey_analytics: { ... },

  // Analysis
  insights: [{ ... }],
  alerts: [{ ... }],
  trends: [{ ... }],
  summary_report: "...",

  // Execution
  processing_start_time: Date,
  processing_end_time: Date,
  execution_path: ["supervisor", "collect_volunteer_metrics", ...],
  errors: [],
  status: "completed",

  // Admin review
  reviewed: false,
  reviewed_by: ObjectId,
  reviewed_at: Date,
  admin_notes: ""
}
```

## Scheduled Execution

To run observations automatically, set up cron jobs or Vercel Cron:

**Vercel Cron (vercel.json):**

```json
{
  "crons": [
    {
      "path": "/api/cron/observation/hourly",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/observation/daily",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/observation/weekly",
      "schedule": "0 2 * * 0"
    }
  ]
}
```

**Cron API Endpoint:**

```javascript
// /api/cron/observation/daily/route.js
import { runObservationAgent } from '@/lib/agents/platform/observation/graph';

export async function GET(request) {
  // Verify cron secret
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const result = await runObservationAgent({ observationType: 'daily' });

  return Response.json({ success: true, observation_id: result.observation_id });
}
```

## Testing

Run a test observation:

```bash
curl -X POST http://localhost:3000/api/admin/agents/observation/run \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{"observationType":"on-demand"}'
```

View results in the dashboard:
```
http://localhost:3000/admin/system-observation
```

## Extending the Agent

### Adding New Metrics

1. **Define schema in `state.js`:**
   ```javascript
   const NewMetricSchema = z.object({
     metric_name: z.string(),
     value: z.number(),
   });
   ```

2. **Create tool in `tools.js`:**
   ```javascript
   export const collectNewMetricTool = new DynamicStructuredTool({
     name: 'collect_new_metric',
     description: 'Collects new metric data',
     schema: z.object({ ... }),
     func: async ({ ... }) => { ... },
   });
   ```

3. **Add collection node in `nodes/dataCollector.js`:**
   ```javascript
   export async function collectNewMetricNode(state) {
     const result = await collectNewMetricTool.invoke({ ... });
     return { new_metric: JSON.parse(result) };
   }
   ```

4. **Update graph routing in `graph.js`:**
   ```javascript
   // Add to supervisor logic
   if (!hasNewMetric) {
     nextAction = 'collect_new_metric';
   }

   // Add to routing function
   case 'collect_new_metric':
     return 'collect_new_metric';
   ```

5. **Update state channels:**
   ```javascript
   const graphState = {
     // ...
     new_metric: {
       value: (x, y) => y ?? x,
       default: () => null,
     },
   };
   ```

## Best Practices

1. **Privacy First**
   - Always aggregate data before analysis
   - Never store individual user identifiers in observations
   - Set appropriate data retention policies

2. **Actionable Insights**
   - Focus on insights that lead to concrete actions
   - Provide specific recommendations, not just observations
   - Prioritize based on impact and urgency

3. **Regular Monitoring**
   - Schedule observations at appropriate intervals
   - Review insights and alerts weekly
   - Track trends over time to validate changes

4. **Error Handling**
   - Gracefully handle missing data
   - Continue execution even if one metric collection fails
   - Log errors for debugging

5. **Performance**
   - Run heavy observations during off-peak hours
   - Cache intermediate results when possible
   - Monitor execution time and optimize slow queries

## Future Enhancements

- [ ] Historical trend analysis (compare current vs. previous periods)
- [ ] Predictive analytics (forecast future needs)
- [ ] Automatic action execution (e.g., send recruiting emails)
- [ ] Customizable insight prompts per admin preferences
- [ ] Integration with Slack/email for alert notifications
- [ ] A/B testing framework for platform changes
- [ ] ML-based anomaly detection

## Related Documentation

- [Platform Agents Architecture](../../../../docs/platform-agents-architecture.md)
- [Volunteer Support Agent](../../volunteer/README.md)
- [Agent Graph Visualization](/admin/agent-graph)

---

**Built with ❤️ using LangGraph and GPT-4**
