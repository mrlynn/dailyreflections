import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToMongoose } from '@/lib/mongoose';
import ArtGenerationHistory from '@/lib/models/ArtGenerationHistory';
import User from '@/lib/models/User'; // Need to import User model for populate to work

/**
 * GET /api/admin/agents/art-director/history
 *
 * Get art generation history
 */
export async function GET(request) {
  try {
    console.log('[History API] Starting request...');

    // Check authentication
    console.log('[History API] Checking authentication...');
    const session = await getSession(request);
    console.log('[History API] Session:', session?.user?.email, 'isAdmin:', session?.user?.isAdmin);

    if (!session?.user) {
      console.log('[History API] Unauthorized - No session');
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    // Check for admin role
    const isAdmin = session.user.roles?.includes('admin') || session.user.isAdmin;
    if (!isAdmin) {
      console.log('[History API] Unauthorized - Not admin');
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Connect to database
    console.log('[History API] Connecting to database...');
    await connectToMongoose();
    console.log('[History API] Database connected');

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    console.log('[History API] Fetching history with limit:', limit);

    // Get recent history
    const history = await ArtGenerationHistory.getRecentHistory(limit);
    console.log('[History API] History fetched, count:', history?.length);

    // Get stats for last 30 days
    console.log('[History API] Fetching stats...');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stats = await ArtGenerationHistory.getGenerationStats(thirtyDaysAgo, new Date());
    console.log('[History API] Stats fetched:', stats);

    console.log('[History API] Returning success response');
    return NextResponse.json({
      success: true,
      history,
      stats: {
        last_30_days: stats,
      },
    });
  } catch (error) {
    console.error('[History API] ERROR:', error);
    console.error('[History API] Error stack:', error.stack);
    return NextResponse.json(
      {
        error: 'Failed to fetch generation history',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
