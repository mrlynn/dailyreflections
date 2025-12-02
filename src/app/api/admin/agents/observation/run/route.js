import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToMongoose } from '@/lib/mongoose';
import SystemObservation from '@/lib/models/SystemObservation';
import { runObservationAgent } from '@/lib/agents/platform/observation/graph';

/**
 * POST /api/admin/agents/observation/run
 *
 * Triggers a new observation run (on-demand or scheduled)
 *
 * Body:
 * {
 *   observationType: 'hourly' | 'daily' | 'weekly' | 'on-demand',
 *   startTime?: ISO date string,
 *   endTime?: ISO date string
 * }
 */
export async function POST(request) {
  try {
    // Check authentication and admin authorization
    const session = await getSession(request);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    // Check for admin role
    const isAdmin = session.user.roles?.includes('admin') || session.user.isAdmin;
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin role required' },
        { status: 403 }
      );
    }

    await connectToMongoose();

    // Parse request body
    const body = await request.json();
    const {
      observationType = 'on-demand',
      startTime,
      endTime,
    } = body;

    // Validate observation type
    const validTypes = ['hourly', 'daily', 'weekly', 'on-demand'];
    if (!validTypes.includes(observationType)) {
      return NextResponse.json(
        { error: `Invalid observation type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Parse dates
    const params = {
      observationType,
    };

    if (startTime) {
      params.startTime = new Date(startTime);
    }
    if (endTime) {
      params.endTime = new Date(endTime);
    }

    console.log('🚀 Starting observation run:', params);

    // Run the observation agent
    const result = await runObservationAgent(params);

    // Save result to database
    const observation = new SystemObservation({
      observation_id: result.observation_id,
      observation_type: result.observation_type,
      time_period: result.time_period,
      volunteer_metrics: result.volunteer_metrics,
      meeting_attendance: result.meeting_attendance,
      support_hotspots: result.support_hotspots,
      journey_analytics: result.journey_analytics,
      system_health: result.system_health,
      insights: result.insights,
      alerts: result.alerts,
      trends: result.trends,
      summary_report: result.summary_report,
      processing_start_time: result.processing_start_time,
      processing_end_time: result.processing_end_time,
      execution_path: result.execution_path,
      errors: result.errors,
      status: result.errors && result.errors.length > 0 ? 'failed' : 'completed',
    });

    await observation.save();

    console.log('✅ Observation saved:', observation._id);

    return NextResponse.json({
      success: true,
      observation_id: observation.observation_id,
      database_id: observation._id,
      summary: {
        insights_count: result.insights?.length || 0,
        alerts_count: result.alerts?.length || 0,
        errors_count: result.errors?.length || 0,
        processing_duration_ms: result.processing_end_time - result.processing_start_time,
      },
      result,
    });
  } catch (error) {
    console.error('Error running observation agent:', error);
    return NextResponse.json(
      {
        error: 'Failed to run observation',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
