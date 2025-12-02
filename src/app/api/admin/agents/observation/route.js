import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToMongoose } from '@/lib/mongoose';
import SystemObservation from '@/lib/models/SystemObservation';

/**
 * GET /api/admin/agents/observation
 *
 * Retrieves observation results
 *
 * Query params:
 * - type: Filter by observation type
 * - limit: Number of results to return (default: 10)
 * - latest: Get only the latest observation (boolean)
 */
export async function GET(request) {
  try {
    // Check authentication
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '10');
    const latest = searchParams.get('latest') === 'true';

    // Build query
    const query = {};
    if (type) {
      query.observation_type = type;
    }

    let observations;

    if (latest) {
      // Get only the latest observation
      observations = await SystemObservation.findOne(query)
        .sort({ createdAt: -1 })
        .exec();

      return NextResponse.json({
        success: true,
        observation: observations,
      });
    } else {
      // Get multiple observations
      observations = await SystemObservation.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();

      return NextResponse.json({
        success: true,
        count: observations.length,
        observations,
      });
    }
  } catch (error) {
    console.error('Error retrieving observations:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve observations',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
