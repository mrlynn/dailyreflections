import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { ChatOpenAI } from '@langchain/openai';
import { connectToMongoose } from '@/lib/mongoose';
import clientPromise from '@/lib/mongodb';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYSTEM OBSERVATION AGENT TOOLS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * These tools enable the observation agent to collect metrics and analyze
 * platform data. Each tool is focused on a specific aspect of the platform.
 *
 * Tool categories:
 * 1. Data Collection Tools - Query MongoDB for metrics
 * 2. Analysis Tools - Use LLMs to identify patterns
 * 3. Insight Generation Tools - Create actionable recommendations
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * ─────────────────────────────────────────────────────────────────────────
 * VOLUNTEER METRICS COLLECTION TOOL
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Collects comprehensive metrics about volunteer availability, load, and
 * performance to identify capacity issues and burnout risks.
 */
export const collectVolunteerMetricsTool = new DynamicStructuredTool({
  name: 'collect_volunteer_metrics',
  description: 'Collects metrics about volunteer availability, active sessions, response times, and load distribution',
  schema: z.object({
    start_time: z.string().describe('ISO timestamp for start of period'),
    end_time: z.string().describe('ISO timestamp for end of period'),
  }),
  func: async ({ start_time, end_time }) => {
    try {
      await connectToMongoose();

      const startDate = new Date(start_time);
      const endDate = new Date(end_time);

      // Get active volunteers (those with approved applications and 'active' status)
      const client = await clientPromise;
      const db = client.db('dailyreflections');

      const activeVolunteers = await db.collection('users').find({
        roles: 'volunteer',
        'volunteerProfile.status': 'active',
      }, {
        projection: { _id: 1, email: 1, volunteerProfile: 1 }
      }).toArray();

      const volunteerIds = activeVolunteers.map(v => v._id);

      // Get chat sessions in period
      const chatSessions = await db.collection('chat_sessions').find({
        volunteer_id: { $in: volunteerIds },
        start_time: { $gte: startDate, $lte: endDate },
      }).toArray();

      // Calculate metrics
      const totalActiveVolunteers = activeVolunteers.length;

      // Currently online (active session in last 15 minutes)
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      const volunteersOnlineNow = await db.collection('chat_sessions').distinct('volunteer_id', {
        volunteer_id: { $in: volunteerIds },
        last_activity: { $gte: fifteenMinutesAgo },
      });

      // Sessions per volunteer
      const sessionsByVolunteer = {};
      chatSessions.forEach(session => {
        const volId = session.volunteer_id?.toString();
        if (volId) {
          sessionsByVolunteer[volId] = (sessionsByVolunteer[volId] || 0) + 1;
        }
      });

      const avgSessionsPerVolunteer = totalActiveVolunteers > 0
        ? Object.values(sessionsByVolunteer).reduce((a, b) => a + b, 0) / totalActiveVolunteers
        : 0;

      // Response time metrics
      const responseTimes = [];
      for (const session of chatSessions) {
        const messages = await db.collection('chat_messages')
          .find({ session_id: session._id })
          .sort({ timestamp: 1 })
          .toArray();

        for (let i = 0; i < messages.length - 1; i++) {
          if (messages[i].sender === 'user' && messages[i + 1].sender === 'volunteer') {
            const responseTime = (messages[i + 1].timestamp - messages[i].timestamp) / 1000 / 60; // minutes
            responseTimes.push(responseTime);
          }
        }
      }

      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

      const medianResponseTime = responseTimes.length > 0
        ? responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length / 2)]
        : 0;

      // Waiting conversations
      const waitingConversations = await db.collection('chat_sessions').countDocuments({
        status: 'waiting',
        start_time: { $gte: startDate },
      });

      // Load distribution
      const sessionCounts = Object.values(sessionsByVolunteer);
      const maxSessions = Math.max(...sessionCounts, 0);

      const loadDistribution = {
        underutilized: 0,
        optimal: 0,
        high: 0,
        critical: 0,
      };

      sessionCounts.forEach(count => {
        const loadPercentage = maxSessions > 0 ? (count / maxSessions) * 100 : 0;
        if (loadPercentage < 30) loadDistribution.underutilized++;
        else if (loadPercentage < 70) loadDistribution.optimal++;
        else if (loadPercentage < 90) loadDistribution.high++;
        else loadDistribution.critical++;
      });

      // Convert to percentages
      const totalVols = totalActiveVolunteers || 1;
      loadDistribution.underutilized = (loadDistribution.underutilized / totalVols) * 100;
      loadDistribution.optimal = (loadDistribution.optimal / totalVols) * 100;
      loadDistribution.high = (loadDistribution.high / totalVols) * 100;
      loadDistribution.critical = (loadDistribution.critical / totalVols) * 100;

      // Busiest hours (simplified - group by hour of day)
      const hourlyActivity = new Array(24).fill(0).map((_, hour) => ({
        hour,
        conversations: 0,
        volunteer_coverage: 0,
      }));

      chatSessions.forEach(session => {
        const hour = session.start_time?.getHours() || 0;
        hourlyActivity[hour].conversations++;
      });

      // Sort and get top 5 busiest hours
      const busiestHours = hourlyActivity
        .map(h => ({
          hour: h.hour,
          average_conversations: h.conversations,
          volunteer_coverage: volunteersOnlineNow.length, // Simplified
        }))
        .sort((a, b) => b.average_conversations - a.average_conversations)
        .slice(0, 5);

      return JSON.stringify({
        total_active_volunteers: totalActiveVolunteers,
        volunteers_online_now: volunteersOnlineNow.length,
        average_active_sessions_per_volunteer: avgSessionsPerVolunteer,
        volunteers_near_capacity: [], // TODO: Implement burnout detection
        average_response_time_minutes: avgResponseTime,
        median_response_time_minutes: medianResponseTime,
        conversations_waiting: waitingConversations,
        load_distribution: loadDistribution,
        busiest_hours: busiestHours,
        crisis_alert_count: 0, // TODO: Query crisis alerts from agent_analyses
        escalation_count: 0,
      });
    } catch (error) {
      console.error('Error collecting volunteer metrics:', error);
      return JSON.stringify({ error: error.message });
    }
  },
});

/**
 * ─────────────────────────────────────────────────────────────────────────
 * MEETING ATTENDANCE ANALYSIS TOOL
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Analyzes meeting attendance patterns to identify hotspots (high demand,
 * low coverage) and cold spots (low attendance).
 */
export const analyzeMeetingAttendanceTool = new DynamicStructuredTool({
  name: 'analyze_meeting_attendance',
  description: 'Analyzes meeting attendance patterns to find hotspots needing facilitators and cold spots with low attendance',
  schema: z.object({
    start_time: z.string().describe('ISO timestamp for start of period'),
    end_time: z.string().describe('ISO timestamp for end of period'),
  }),
  func: async ({ start_time, end_time }) => {
    try {
      await connectToMongoose();

      const startDate = new Date(start_time);
      const endDate = new Date(end_time);

      // Get meeting attendance records in period
      const client = await clientPromise;
      const db = client.db('dailyreflections');

      const attendanceRecords = await db.collection('meeting_attendance').find({
        date: { $gte: startDate, $lte: endDate },
      }).toArray();

      // Get meeting details for each attendance record
      const meetingIds = [...new Set(attendanceRecords.map(r => r.meeting_id).filter(Boolean))];
      const meetings = await db.collection('meetings').find({
        _id: { $in: meetingIds }
      }).toArray();

      const meetingMap = {};
      meetings.forEach(m => { meetingMap[m._id.toString()] = m; });

      // Populate meeting data
      attendanceRecords.forEach(record => {
        if (record.meeting_id) {
          record.meeting = meetingMap[record.meeting_id.toString()];
        }
      });

      const totalMeetings = attendanceRecords.length;
      const totalAttendance = attendanceRecords.reduce((sum, record) => sum + (record.attendeeCount || 0), 0);
      const avgAttendance = totalMeetings > 0 ? totalAttendance / totalMeetings : 0;

      // Group by location and time
      const meetingStats = {};

      attendanceRecords.forEach(record => {
        const meeting = record.meeting;
        if (!meeting) return;

        const key = `${meeting.location}_${meeting.day}_${meeting.time}`;

        if (!meetingStats[key]) {
          meetingStats[key] = {
            location: meeting.location || 'Unknown',
            time_slot: meeting.time || 'Unknown',
            day_of_week: meeting.day || 'Unknown',
            attendance_counts: [],
            facilitator_count: 1, // TODO: Track actual facilitator count
          };
        }

        meetingStats[key].attendance_counts.push(record.attendeeCount || 0);
      });

      // Identify hotspots (high attendance, might need more facilitators)
      const hotspots = [];
      const coldSpots = [];

      Object.values(meetingStats).forEach(stats => {
        const avgAttendanceHere = stats.attendance_counts.reduce((a, b) => a + b, 0) / stats.attendance_counts.length;
        const trend = determineAttendanceTrend(stats.attendance_counts);

        if (avgAttendanceHere > avgAttendance * 1.5) {
          // High attendance location
          hotspots.push({
            location: stats.location,
            time_slot: stats.time_slot,
            day_of_week: stats.day_of_week,
            attendance_trend: trend,
            facilitator_count: stats.facilitator_count,
            recommended_facilitators: Math.ceil(avgAttendanceHere / 15), // Recommend 1 facilitator per 15 attendees
            urgency: avgAttendanceHere > avgAttendance * 2 ? 'high' : 'medium',
          });
        } else if (avgAttendanceHere < avgAttendance * 0.5 && avgAttendanceHere < 5) {
          // Low attendance location
          coldSpots.push({
            location: stats.location,
            time_slot: stats.time_slot,
            day_of_week: stats.day_of_week,
            attendance_count: Math.round(avgAttendanceHere),
            recommendation: trend === 'decreasing'
              ? 'Consider rescheduling or promoting this meeting'
              : 'Monitor attendance and consider consolidation if trend continues',
          });
        }
      });

      // Find peak days and hours
      const dayAttendance = {};
      const hourAttendance = {};

      attendanceRecords.forEach(record => {
        const day = record.meeting?.day || 'Unknown';
        const hour = parseInt(record.meeting?.time?.split(':')[0]) || 0;

        dayAttendance[day] = (dayAttendance[day] || 0) + (record.attendeeCount || 0);
        hourAttendance[hour] = (hourAttendance[hour] || 0) + (record.attendeeCount || 0);
      });

      const peakDays = Object.entries(dayAttendance)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([day]) => day);

      const peakHours = Object.entries(hourAttendance)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([hour]) => parseInt(hour));

      return JSON.stringify({
        total_meetings_scheduled: totalMeetings,
        total_attendance_count: totalAttendance,
        average_attendance_per_meeting: avgAttendance,
        hotspots,
        cold_spots: coldSpots,
        peak_days: peakDays,
        peak_hours: peakHours,
        top_locations_by_attendance: [], // TODO: Implement location ranking
      });
    } catch (error) {
      console.error('Error analyzing meeting attendance:', error);
      return JSON.stringify({ error: error.message });
    }
  },
});

/**
 * Helper function to determine attendance trend
 */
function determineAttendanceTrend(attendanceCounts) {
  if (attendanceCounts.length < 2) return 'stable';

  const firstHalf = attendanceCounts.slice(0, Math.floor(attendanceCounts.length / 2));
  const secondHalf = attendanceCounts.slice(Math.floor(attendanceCounts.length / 2));

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const change = ((secondAvg - firstAvg) / firstAvg) * 100;

  if (change > 10) return 'increasing';
  if (change < -10) return 'decreasing';
  return 'stable';
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * SUPPORT HOTSPOTS DETECTION TOOL
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Identifies topics and times where support demand exceeds volunteer supply
 */
export const detectSupportHotspotsTool = new DynamicStructuredTool({
  name: 'detect_support_hotspots',
  description: 'Identifies topics and times where volunteer support demand exceeds supply',
  schema: z.object({
    start_time: z.string().describe('ISO timestamp for start of period'),
    end_time: z.string().describe('ISO timestamp for end of period'),
  }),
  func: async ({ start_time, end_time }) => {
    try {
      await connectToMongoose();

      const startDate = new Date(start_time);
      const endDate = new Date(end_time);

      // Get MongoDB client
      const client = await clientPromise;
      const db = client.db('dailyreflections');

      // Get chat sessions in period
      const sessions = await db.collection('chat_sessions').find({
        start_time: { $gte: startDate, $lte: endDate },
      }).toArray();

      // Analyze by hour and day of week
      const timeSlots = {};
      const dayOfWeekNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      for (const session of sessions) {
        const date = session.start_time || new Date();
        const dayOfWeek = dayOfWeekNames[date.getDay()];
        const hour = date.getHours();
        const key = `${dayOfWeek}_${hour}`;

        if (!timeSlots[key]) {
          timeSlots[key] = {
            day_of_week: dayOfWeek,
            hour,
            conversation_demand: 0,
            volunteer_supply: 0,
          };
        }

        timeSlots[key].conversation_demand++;
        if (session.volunteer_id) timeSlots[key].volunteer_supply++;
      }

      // Identify coverage gaps
      const coverageGaps = Object.values(timeSlots)
        .filter(slot => {
          const coverageRatio = slot.volunteer_supply / (slot.conversation_demand || 1);
          return coverageRatio < 0.8; // Less than 80% coverage
        })
        .map(slot => {
          const coverageRatio = slot.volunteer_supply / (slot.conversation_demand || 1);
          let severity = 'minor';
          if (coverageRatio < 0.3) severity = 'severe';
          else if (coverageRatio < 0.5) severity = 'moderate';

          return {
            ...slot,
            gap_severity: severity,
          };
        })
        .sort((a, b) => a.volunteer_supply / a.conversation_demand - b.volunteer_supply / b.conversation_demand)
        .slice(0, 10); // Top 10 gaps

      // High-level recommendations
      const recommendations = [];

      if (coverageGaps.length > 0) {
        recommendations.push({
          priority: 'high',
          category: 'volunteer_coverage',
          recommendation: `Recruit volunteers for ${coverageGaps.length} time slots with coverage gaps`,
          impact: 'Reduce wait times and improve user experience during peak demand periods',
        });
      }

      return JSON.stringify({
        high_demand_topics: [], // TODO: Implement topic extraction from messages
        coverage_gaps: coverageGaps,
        recommendations,
      });
    } catch (error) {
      console.error('Error detecting support hotspots:', error);
      return JSON.stringify({ error: error.message });
    }
  },
});

/**
 * ─────────────────────────────────────────────────────────────────────────
 * JOURNEY ANALYTICS COLLECTION TOOL
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Collects aggregate analytics about user recovery journeys
 * IMPORTANT: All data is aggregated and anonymized
 */
export const collectJourneyAnalyticsTool = new DynamicStructuredTool({
  name: 'collect_journey_analytics',
  description: 'Collects aggregate, anonymized analytics about user engagement and recovery journeys',
  schema: z.object({
    start_time: z.string().describe('ISO timestamp for start of period'),
    end_time: z.string().describe('ISO timestamp for end of period'),
  }),
  func: async ({ start_time, end_time }) => {
    try {
      await connectToMongoose();

      const startDate = new Date(start_time);
      const endDate = new Date(end_time);

      // Get MongoDB client for user queries
      const client = await clientPromise;
      const db = client.db('dailyreflections');

      // Daily active users
      const dailyActiveUsers = await db.collection('users').countDocuments({
        lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });

      // Weekly active users
      const weeklyActiveUsers = await db.collection('users').countDocuments({
        lastActive: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      });

      // Monthly active users
      const monthlyActiveUsers = await db.collection('users').countDocuments({
        lastActive: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      });

      // Feature usage
      const chatSessionsCount = await db.collection('chat_sessions').countDocuments({
        start_time: { $gte: startDate, $lte: endDate },
      });

      const meetingAttendanceCount = await db.collection('meeting_attendance').countDocuments({
        date: { $gte: startDate, $lte: endDate },
      });

      // Simplified retention (would need user cohort analysis for accuracy)
      const usersCreatedSevenDaysAgo = await db.collection('users').countDocuments({
        createdAt: { $lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      });

      const activeAfterSevenDays = await db.collection('users').countDocuments({
        createdAt: { $lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });

      const day7Retention = usersCreatedSevenDaysAgo > 0
        ? (activeAfterSevenDays / usersCreatedSevenDaysAgo) * 100
        : 0;

      return JSON.stringify({
        engagement_trends: {
          daily_active_users: dailyActiveUsers,
          weekly_active_users: weeklyActiveUsers,
          monthly_active_users: monthlyActiveUsers,
          average_session_duration_minutes: 0, // TODO: Calculate from session data
        },
        feature_usage: {
          daily_reflections_completed: 0, // TODO: Query reflection completion
          chat_sessions_initiated: chatSessionsCount,
          meetings_attended: meetingAttendanceCount,
          steps_worked_on: 0, // TODO: Query step progress
          journal_entries_created: 0, // TODO: Query journal entries
        },
        milestone_achievements: {
          sobriety_milestones_reached: 0, // TODO: Query milestone achievements
          milestone_breakdown: [],
        },
        retention: {
          day_7_retention: day7Retention,
          day_30_retention: 0, // TODO: Calculate 30-day retention
          day_90_retention: 0, // TODO: Calculate 90-day retention
        },
        content_effectiveness: {
          most_shared_reflections: [],
          most_commented_topics: [],
          highest_rated_resources: [],
        },
      });
    } catch (error) {
      console.error('Error collecting journey analytics:', error);
      return JSON.stringify({ error: error.message });
    }
  },
});

/**
 * ─────────────────────────────────────────────────────────────────────────
 * INSIGHT GENERATION TOOL
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Uses GPT-4 to analyze collected metrics and generate actionable insights
 */
export const generateInsightsTool = new DynamicStructuredTool({
  name: 'generate_insights',
  description: 'Analyzes collected metrics using AI to generate actionable insights and recommendations',
  schema: z.object({
    metrics_summary: z.string().describe('JSON string of all collected metrics'),
  }),
  func: async ({ metrics_summary }) => {
    try {
      const model = new ChatOpenAI({
        modelName: 'gpt-4o',
        temperature: 0.7,
      });

      const prompt = `You are an AI analyst for a recovery support platform (Daily Reflections).
Analyze the following platform metrics and generate 3-5 actionable insights.

Focus on:
1. Opportunities for growth or improvement
2. Potential issues that need attention
3. Recommended actions for administrators
4. Positive achievements to celebrate

Metrics:
${metrics_summary}

For each insight, provide:
- insight_type: "opportunity", "warning", "recommendation", or "celebration"
- category: e.g., "volunteer_program", "meeting_attendance", "user_engagement"
- title: Brief, clear title
- description: 2-3 sentences explaining the insight
- priority: "low", "medium", "high", or "urgent"
- actionable: true/false
- suggested_actions: Array of specific actions to take (if actionable)
- impact: Expected impact of taking action

Return as a JSON array of insights.`;

      const response = await model.invoke(prompt);
      const content = response.content;

      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return jsonMatch[0];
      }

      return content;
    } catch (error) {
      console.error('Error generating insights:', error);
      return JSON.stringify({
        error: error.message,
        fallback_insights: [
          {
            insight_type: 'recommendation',
            category: 'system',
            title: 'Continue monitoring platform health',
            description: 'Regular observation runs will help identify trends over time.',
            priority: 'medium',
            actionable: true,
            suggested_actions: ['Schedule regular observation runs', 'Review insights weekly'],
          },
        ],
      });
    }
  },
});

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TOOL EXPORTS
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const observationTools = [
  collectVolunteerMetricsTool,
  analyzeMeetingAttendanceTool,
  detectSupportHotspotsTool,
  collectJourneyAnalyticsTool,
  generateInsightsTool,
];
