import {
  collectVolunteerMetricsTool,
  analyzeMeetingAttendanceTool,
  detectSupportHotspotsTool,
  collectJourneyAnalyticsTool,
} from '../tools';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DATA COLLECTOR NODES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * These nodes collect specific metrics from the platform using specialized tools.
 * Each node is focused on one aspect of platform health.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Collects volunteer metrics
 */
export async function collectVolunteerMetricsNode(state) {
  console.log('👥 Collecting volunteer metrics...');

  try {
    const result = await collectVolunteerMetricsTool.invoke({
      start_time: state.time_period.start.toISOString(),
      end_time: state.time_period.end.toISOString(),
    });

    const metrics = JSON.parse(result);

    if (metrics.error) {
      return {
        volunteer_metrics: {}, // Return empty object so supervisor knows we tried
        execution_path: ['collect_volunteer_metrics'],
        errors: [`Volunteer metrics: ${metrics.error}`],
      };
    }

    console.log(`✅ Collected volunteer metrics: ${metrics.total_active_volunteers} active volunteers`);

    return {
      volunteer_metrics: metrics,
      execution_path: ['collect_volunteer_metrics'],
    };
  } catch (error) {
    console.error('Error in collectVolunteerMetricsNode:', error);
    return {
      volunteer_metrics: {}, // Return empty object so supervisor knows we tried
      execution_path: ['collect_volunteer_metrics'],
      errors: [error.message],
    };
  }
}

/**
 * Collects meeting attendance data
 */
export async function collectMeetingDataNode(state) {
  console.log('📅 Collecting meeting attendance data...');

  try {
    const result = await analyzeMeetingAttendanceTool.invoke({
      start_time: state.time_period.start.toISOString(),
      end_time: state.time_period.end.toISOString(),
    });

    const metrics = JSON.parse(result);

    if (metrics.error) {
      return {
        meeting_attendance: {},
        execution_path: ['collect_meeting_data'],
        errors: [`Meeting data: ${metrics.error}`],
      };
    }

    console.log(`✅ Collected meeting data: ${metrics.total_meetings_scheduled} meetings, ${metrics.hotspots.length} hotspots`);

    return {
      meeting_attendance: metrics,
      execution_path: ['collect_meeting_data'],
    };
  } catch (error) {
    console.error('Error in collectMeetingDataNode:', error);
    return {
      meeting_attendance: {},
      execution_path: ['collect_meeting_data'],
      errors: [error.message],
    };
  }
}

/**
 * Detects support hotspots
 */
export async function collectSupportDataNode(state) {
  console.log('🔥 Detecting support hotspots...');

  try {
    const result = await detectSupportHotspotsTool.invoke({
      start_time: state.time_period.start.toISOString(),
      end_time: state.time_period.end.toISOString(),
    });

    const metrics = JSON.parse(result);

    if (metrics.error) {
      return {
        support_hotspots: {},
        execution_path: ['collect_support_data'],
        errors: [`Support hotspots: ${metrics.error}`],
      };
    }

    console.log(`✅ Detected ${metrics.coverage_gaps.length} coverage gaps`);

    return {
      support_hotspots: metrics,
      execution_path: ['collect_support_data'],
    };
  } catch (error) {
    console.error('Error in collectSupportDataNode:', error);
    return {
      support_hotspots: {},
      execution_path: ['collect_support_data'],
      errors: [error.message],
    };
  }
}

/**
 * Collects recovery journey analytics
 */
export async function collectJourneyDataNode(state) {
  console.log('🌱 Collecting recovery journey analytics...');

  try {
    const result = await collectJourneyAnalyticsTool.invoke({
      start_time: state.time_period.start.toISOString(),
      end_time: state.time_period.end.toISOString(),
    });

    const metrics = JSON.parse(result);

    if (metrics.error) {
      return {
        journey_analytics: {},
        execution_path: ['collect_journey_data'],
        errors: [`Journey analytics: ${metrics.error}`],
      };
    }

    console.log(`✅ Collected journey analytics: ${metrics.engagement_trends.daily_active_users} DAU`);

    return {
      journey_analytics: metrics,
      execution_path: ['collect_journey_data'],
    };
  } catch (error) {
    console.error('Error in collectJourneyDataNode:', error);
    return {
      journey_analytics: {},
      execution_path: ['collect_journey_data'],
      errors: [error.message],
    };
  }
}
