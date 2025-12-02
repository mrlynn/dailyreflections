import { generateInsightsTool } from '../tools';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * INSIGHTS GENERATOR NODE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This node takes all collected metrics and uses GPT-4 to generate actionable
 * insights, recommendations, and alerts for administrators.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

export async function generateInsightsNode(state) {
  console.log('🧠 Generating insights from collected metrics...');

  try {
    // Compile all metrics into a summary
    const metricsSummary = {
      volunteer_metrics: state.volunteer_metrics,
      meeting_attendance: state.meeting_attendance,
      support_hotspots: state.support_hotspots,
      journey_analytics: state.journey_analytics,
      time_period: {
        start: state.time_period.start.toISOString(),
        end: state.time_period.end.toISOString(),
      },
    };

    const result = await generateInsightsTool.invoke({
      metrics_summary: JSON.stringify(metricsSummary, null, 2),
    });

    let insights;
    try {
      insights = JSON.parse(result);
    } catch (e) {
      // If LLM didn't return valid JSON, create a basic insight
      console.warn('Failed to parse insights JSON, using fallback');
      insights = [
        {
          insight_type: 'recommendation',
          category: 'observation',
          title: 'Platform metrics collected successfully',
          description: 'All platform metrics have been collected. Review the detailed data for specific insights.',
          priority: 'medium',
          actionable: true,
          suggested_actions: ['Review volunteer metrics for capacity issues', 'Check meeting hotspots for facilitator needs'],
        },
      ];
    }

    // Generate alerts from critical insights
    const alerts = insights
      .filter(insight => insight.priority === 'urgent' || insight.priority === 'high')
      .map(insight => ({
        alert_type: insight.category,
        severity: insight.priority,
        message: insight.title,
        recommended_action: insight.suggested_actions?.[0] || 'Review insight details',
        timestamp: new Date(),
      }));

    console.log(`✅ Generated ${insights.length} insights, ${alerts.length} alerts`);

    // Generate summary report
    const summaryReport = generateSummaryReport(state, insights);

    return {
      insights,
      alerts,
      summary_report: summaryReport,
      processing_end_time: new Date(),
      execution_path: ['generate_insights'],
    };
  } catch (error) {
    console.error('Error in generateInsightsNode:', error);
    return {
      insights: [],
      alerts: [],
      execution_path: ['generate_insights'],
      errors: [error.message],
      processing_end_time: new Date(),
    };
  }
}

/**
 * Generates a human-readable summary report
 */
function generateSummaryReport(state, insights) {
  const { volunteer_metrics, meeting_attendance, support_hotspots, journey_analytics } = state;

  let report = `# Platform Observation Report\n\n`;
  report += `**Observation Type:** ${state.observation_type}\n`;
  report += `**Time Period:** ${state.time_period.start.toLocaleString()} - ${state.time_period.end.toLocaleString()}\n\n`;

  // Volunteer Program Summary
  if (volunteer_metrics) {
    report += `## Volunteer Program\n\n`;
    report += `- **Active Volunteers:** ${volunteer_metrics.total_active_volunteers}\n`;
    report += `- **Currently Online:** ${volunteer_metrics.volunteers_online_now}\n`;
    report += `- **Average Response Time:** ${volunteer_metrics.average_response_time_minutes.toFixed(1)} minutes\n`;
    report += `- **Conversations Waiting:** ${volunteer_metrics.conversations_waiting}\n`;
    report += `\n`;

    if (volunteer_metrics.load_distribution) {
      report += `**Load Distribution:**\n`;
      report += `- Underutilized: ${volunteer_metrics.load_distribution.underutilized.toFixed(1)}%\n`;
      report += `- Optimal: ${volunteer_metrics.load_distribution.optimal.toFixed(1)}%\n`;
      report += `- High: ${volunteer_metrics.load_distribution.high.toFixed(1)}%\n`;
      report += `- Critical: ${volunteer_metrics.load_distribution.critical.toFixed(1)}%\n`;
      report += `\n`;
    }
  }

  // Meeting Program Summary
  if (meeting_attendance) {
    report += `## Meeting Program\n\n`;
    report += `- **Total Meetings:** ${meeting_attendance.total_meetings_scheduled}\n`;
    report += `- **Total Attendance:** ${meeting_attendance.total_attendance_count}\n`;
    report += `- **Average per Meeting:** ${meeting_attendance.average_attendance_per_meeting.toFixed(1)}\n`;
    report += `- **Hotspots Identified:** ${meeting_attendance.hotspots.length}\n`;
    report += `- **Cold Spots:** ${meeting_attendance.cold_spots.length}\n`;
    report += `\n`;
  }

  // Support Coverage Summary
  if (support_hotspots) {
    report += `## Support Coverage\n\n`;
    report += `- **Coverage Gaps:** ${support_hotspots.coverage_gaps.length}\n`;
    report += `\n`;

    if (support_hotspots.coverage_gaps.length > 0) {
      report += `**Top Coverage Gaps:**\n`;
      support_hotspots.coverage_gaps.slice(0, 3).forEach(gap => {
        report += `- ${gap.day_of_week} at ${gap.hour}:00 (${gap.gap_severity})\n`;
      });
      report += `\n`;
    }
  }

  // User Engagement Summary
  if (journey_analytics) {
    report += `## User Engagement\n\n`;
    if (journey_analytics.engagement_trends) {
      report += `- **Daily Active Users:** ${journey_analytics.engagement_trends.daily_active_users}\n`;
      report += `- **Weekly Active Users:** ${journey_analytics.engagement_trends.weekly_active_users}\n`;
      report += `- **Monthly Active Users:** ${journey_analytics.engagement_trends.monthly_active_users}\n`;
      report += `\n`;
    }

    if (journey_analytics.retention) {
      report += `**Retention:**\n`;
      report += `- 7-day: ${journey_analytics.retention.day_7_retention.toFixed(1)}%\n`;
      report += `\n`;
    }
  }

  // Key Insights
  if (insights && insights.length > 0) {
    report += `## Key Insights\n\n`;

    const highPriority = insights.filter(i => i.priority === 'urgent' || i.priority === 'high');
    if (highPriority.length > 0) {
      report += `### High Priority\n\n`;
      highPriority.forEach(insight => {
        report += `**${insight.title}**\n`;
        report += `${insight.description}\n`;
        if (insight.suggested_actions && insight.suggested_actions.length > 0) {
          report += `\nRecommended Actions:\n`;
          insight.suggested_actions.forEach(action => {
            report += `- ${action}\n`;
          });
        }
        report += `\n`;
      });
    }

    const opportunities = insights.filter(i => i.insight_type === 'opportunity');
    if (opportunities.length > 0) {
      report += `### Opportunities\n\n`;
      opportunities.forEach(insight => {
        report += `- ${insight.title}: ${insight.description}\n`;
      });
      report += `\n`;
    }

    const celebrations = insights.filter(i => i.insight_type === 'celebration');
    if (celebrations.length > 0) {
      report += `### Achievements\n\n`;
      celebrations.forEach(insight => {
        report += `- ${insight.title}: ${insight.description}\n`;
      });
      report += `\n`;
    }
  }

  report += `---\n`;
  report += `*Report generated by System Observation Agent*\n`;

  return report;
}
