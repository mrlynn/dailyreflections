import { z } from 'zod';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYSTEM OBSERVATION AGENT STATE SCHEMAS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This file defines the type-safe state schema for the System Observation Agent,
 * which monitors platform health, volunteer load, meeting attendance, and
 * generates actionable insights for platform administrators.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * AGENT PURPOSE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The System Observation Agent is a scheduled agent that:
 * 1. Collects metrics from across the platform
 * 2. Analyzes patterns and trends
 * 3. Generates actionable insights
 * 4. Creates alerts for resource needs
 * 5. Provides strategic planning data
 *
 * Unlike the volunteer support agent (real-time, chat-based), this agent
 * runs on a schedule (hourly, daily, weekly) and analyzes aggregate data.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * ─────────────────────────────────────────────────────────────────────────
 * VOLUNTEER METRICS SCHEMA
 * ─────────────────────────────────────────────────────────────────────────
 */
const VolunteerMetricsSchema = z.object({
  // Volunteer availability and load
  total_active_volunteers: z.number(),
  volunteers_online_now: z.number(),
  average_active_sessions_per_volunteer: z.number(),
  volunteers_near_capacity: z.array(z.string()), // Volunteer IDs showing signs of burnout

  // Response metrics
  average_response_time_minutes: z.number(),
  median_response_time_minutes: z.number(),
  conversations_waiting: z.number(),
  longest_wait_time_minutes: z.number().optional(),

  // Load distribution
  load_distribution: z.object({
    underutilized: z.number(), // % volunteers with low load
    optimal: z.number(),       // % volunteers at healthy load
    high: z.number(),          // % volunteers at high load
    critical: z.number(),      // % volunteers at risk of burnout
  }),

  // Time-based patterns
  busiest_hours: z.array(z.object({
    hour: z.number(),          // 0-23
    average_conversations: z.number(),
    volunteer_coverage: z.number(),
  })),

  // Quality indicators
  average_conversation_rating: z.number().optional(),
  crisis_alert_count: z.number(),
  escalation_count: z.number(),
});

/**
 * ─────────────────────────────────────────────────────────────────────────
 * MEETING ATTENDANCE SCHEMA
 * ─────────────────────────────────────────────────────────────────────────
 */
const MeetingAttendanceSchema = z.object({
  // Overall metrics
  total_meetings_scheduled: z.number(),
  total_attendance_count: z.number(),
  average_attendance_per_meeting: z.number(),

  // Hotspots (high demand, low facilitator coverage)
  hotspots: z.array(z.object({
    location: z.string(),
    time_slot: z.string(),
    day_of_week: z.string(),
    attendance_trend: z.enum(['increasing', 'stable', 'decreasing']),
    facilitator_count: z.number(),
    recommended_facilitators: z.number(),
    urgency: z.enum(['low', 'medium', 'high']),
  })),

  // Cold spots (low attendance, may need promotion or schedule change)
  cold_spots: z.array(z.object({
    location: z.string(),
    time_slot: z.string(),
    day_of_week: z.string(),
    attendance_count: z.number(),
    recommendation: z.string(),
  })),

  // Time patterns
  peak_days: z.array(z.string()),
  peak_hours: z.array(z.number()),

  // Geographic patterns
  top_locations_by_attendance: z.array(z.object({
    location: z.string(),
    total_attendance: z.number(),
    meeting_count: z.number(),
  })),
});

/**
 * ─────────────────────────────────────────────────────────────────────────
 * SUPPORT HOTSPOTS SCHEMA
 * ─────────────────────────────────────────────────────────────────────────
 */
const SupportHotspotsSchema = z.object({
  // Topics needing more volunteer expertise
  high_demand_topics: z.array(z.object({
    topic: z.string(),
    conversation_count: z.number(),
    average_duration_minutes: z.number(),
    volunteer_confidence: z.number(), // How confident volunteers are with this topic
    recommended_action: z.string(),
  })),

  // Time-based coverage gaps
  coverage_gaps: z.array(z.object({
    day_of_week: z.string(),
    hour: z.number(),
    conversation_demand: z.number(),
    volunteer_supply: z.number(),
    gap_severity: z.enum(['minor', 'moderate', 'severe']),
  })),

  // Resource allocation recommendations
  recommendations: z.array(z.object({
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    category: z.string(),
    recommendation: z.string(),
    impact: z.string(),
  })),
});

/**
 * ─────────────────────────────────────────────────────────────────────────
 * RECOVERY JOURNEY ANALYTICS SCHEMA
 * ─────────────────────────────────────────────────────────────────────────
 *
 * IMPORTANT: All analytics are AGGREGATE only. No individual user tracking.
 * Privacy is paramount.
 */
const RecoveryJourneyAnalyticsSchema = z.object({
  // Engagement patterns (aggregate, anonymized)
  engagement_trends: z.object({
    daily_active_users: z.number(),
    weekly_active_users: z.number(),
    monthly_active_users: z.number(),
    average_session_duration_minutes: z.number(),
  }),

  // Feature usage (what's helping people)
  feature_usage: z.object({
    daily_reflections_completed: z.number(),
    chat_sessions_initiated: z.number(),
    meetings_attended: z.number(),
    steps_worked_on: z.number(),
    journal_entries_created: z.number(),
  }),

  // Milestone patterns (celebrating progress)
  milestone_achievements: z.object({
    sobriety_milestones_reached: z.number(),
    milestone_breakdown: z.array(z.object({
      milestone_type: z.string(), // "30 days", "90 days", "1 year", etc.
      count: z.number(),
    })),
  }),

  // Retention indicators
  retention: z.object({
    day_7_retention: z.number(),  // % of users active after 7 days
    day_30_retention: z.number(), // % of users active after 30 days
    day_90_retention: z.number(), // % of users active after 90 days
  }),

  // Content effectiveness (what resonates)
  content_effectiveness: z.object({
    most_shared_reflections: z.array(z.string()), // Reflection IDs (not user IDs)
    most_commented_topics: z.array(z.string()),
    highest_rated_resources: z.array(z.string()),
  }),
});

/**
 * ─────────────────────────────────────────────────────────────────────────
 * SYSTEM HEALTH METRICS SCHEMA
 * ─────────────────────────────────────────────────────────────────────────
 */
const SystemHealthMetricsSchema = z.object({
  // Overall platform health
  health_score: z.number().min(0).max(100), // Composite score

  // Component health
  components: z.object({
    volunteer_program: z.enum(['healthy', 'warning', 'critical']),
    meeting_program: z.enum(['healthy', 'warning', 'critical']),
    user_engagement: z.enum(['healthy', 'warning', 'critical']),
    content_moderation: z.enum(['healthy', 'warning', 'critical']),
  }),

  // Growth indicators
  growth: z.object({
    new_users_this_period: z.number(),
    growth_rate_percentage: z.number(),
    trend: z.enum(['accelerating', 'steady', 'slowing', 'declining']),
  }),

  // Risk indicators
  risks: z.array(z.object({
    risk_type: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    description: z.string(),
    mitigation: z.string(),
  })),
});

/**
 * ─────────────────────────────────────────────────────────────────────────
 * INSIGHT SCHEMA
 * ─────────────────────────────────────────────────────────────────────────
 *
 * AI-generated insights and recommendations for administrators
 */
const InsightSchema = z.object({
  insight_type: z.enum([
    'opportunity',      // Growth or improvement opportunity
    'warning',          // Potential issue to monitor
    'recommendation',   // Suggested action
    'celebration',      // Positive achievement to acknowledge
  ]),
  category: z.string(),
  title: z.string(),
  description: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  actionable: z.boolean(),
  suggested_actions: z.array(z.string()).optional(),
  impact: z.string().optional(),
  data_supporting: z.any().optional(), // Supporting data for the insight
});

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MAIN OBSERVATION STATE SCHEMA
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const ObservationStateSchema = z.object({
  // ───────────────────────────────────────────────────────────────────────
  // EXECUTION METADATA
  // ───────────────────────────────────────────────────────────────────────
  observation_id: z.string(),                    // Unique ID for this observation run
  observation_type: z.enum(['hourly', 'daily', 'weekly', 'on-demand']),
  time_period: z.object({
    start: z.date(),
    end: z.date(),
  }),

  // ───────────────────────────────────────────────────────────────────────
  // COLLECTED METRICS (from data collector nodes)
  // ───────────────────────────────────────────────────────────────────────
  volunteer_metrics: VolunteerMetricsSchema.optional(),
  meeting_attendance: MeetingAttendanceSchema.optional(),
  support_hotspots: SupportHotspotsSchema.optional(),
  journey_analytics: RecoveryJourneyAnalyticsSchema.optional(),
  system_health: SystemHealthMetricsSchema.optional(),

  // ───────────────────────────────────────────────────────────────────────
  // ANALYSIS RESULTS (from analysis nodes)
  // ───────────────────────────────────────────────────────────────────────
  insights: z.array(InsightSchema).optional(),   // AI-generated insights
  alerts: z.array(z.object({                      // Urgent items needing attention
    alert_type: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    message: z.string(),
    recommended_action: z.string(),
    timestamp: z.date(),
  })).optional(),

  trends: z.array(z.object({                      // Identified trends
    trend_type: z.string(),
    direction: z.enum(['up', 'down', 'stable', 'volatile']),
    description: z.string(),
    confidence: z.number(),                       // 0-1 confidence score
  })).optional(),

  // ───────────────────────────────────────────────────────────────────────
  // ROUTING (supervisor's decision)
  // ───────────────────────────────────────────────────────────────────────
  nextAction: z.enum([
    'collect_volunteer_metrics',
    'collect_meeting_data',
    'collect_support_data',
    'collect_journey_data',
    'analyze_patterns',
    'generate_insights',
    'create_report',
    'complete',
  ]).optional(),

  // ───────────────────────────────────────────────────────────────────────
  // FINAL OUTPUT
  // ───────────────────────────────────────────────────────────────────────
  summary_report: z.string().optional(),          // Human-readable summary

  // ───────────────────────────────────────────────────────────────────────
  // METADATA
  // ───────────────────────────────────────────────────────────────────────
  processing_start_time: z.date().optional(),
  processing_end_time: z.date().optional(),
  execution_path: z.array(z.string()).optional(), // Which nodes ran
  errors: z.array(z.string()).optional(),         // Any errors encountered
});

// Type exports for TypeScript
export type ObservationState = z.infer<typeof ObservationStateSchema>;
export type VolunteerMetrics = z.infer<typeof VolunteerMetricsSchema>;
export type MeetingAttendance = z.infer<typeof MeetingAttendanceSchema>;
export type SupportHotspots = z.infer<typeof SupportHotspotsSchema>;
export type RecoveryJourneyAnalytics = z.infer<typeof RecoveryJourneyAnalyticsSchema>;
export type SystemHealthMetrics = z.infer<typeof SystemHealthMetricsSchema>;
export type Insight = z.infer<typeof InsightSchema>;

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HELPER FUNCTIONS
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Creates initial state for a new observation run
 */
export function createInitialObservationState(params) {
  const now = new Date();

  return {
    observation_id: params.observationId || `obs_${Date.now()}`,
    observation_type: params.observationType || 'on-demand',
    time_period: params.timePeriod || {
      start: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Last 24 hours
      end: now,
    },
    processing_start_time: now,
    execution_path: [],
    errors: [],
  };
}

/**
 * Validates state against schema
 */
export function validateObservationState(state) {
  try {
    ObservationStateSchema.parse(state);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      errors: error.errors,
    };
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * STATE DESIGN NOTES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This state schema is designed to:
 *
 * 1. COLLECT METRICS
 *    - Each specialized node populates its metrics section
 *    - volunteer_metrics, meeting_attendance, etc.
 *
 * 2. ANALYZE PATTERNS
 *    - Analysis nodes examine collected metrics
 *    - Generate insights, alerts, and trend data
 *
 * 3. CREATE REPORTS
 *    - Summary node synthesizes everything into readable report
 *    - Provides actionable recommendations
 *
 * 4. MAINTAIN PRIVACY
 *    - All metrics are aggregate only
 *    - No individual user identification
 *    - No PII stored in observation results
 *
 * 5. ENABLE MONITORING
 *    - Track execution path for debugging
 *    - Record errors for reliability
 *    - Timestamp everything for trend analysis
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */
