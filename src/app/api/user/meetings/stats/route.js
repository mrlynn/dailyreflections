import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getUserMeetingTrackerStats, refreshUserMeetingStats } from '@/lib/models/MeetingAttendance';

/**
 * GET /api/user/meetings/stats
 * Retrieves the user's meeting tracker statistics
 */
export async function GET(request) {
  try {
    const session = await auth();

    // Require authentication
    if (!session?.user) {
      return NextResponse.json(
        {
          error: 'You must be signed in to access meeting statistics.',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    // Check if refresh is requested
    const url = new URL(request.url);
    const refresh = url.searchParams.get('refresh') === 'true';

    // Get user's meeting tracker stats
    const stats = refresh
      ? await refreshUserMeetingStats(session.user.id)
      : await getUserMeetingTrackerStats(session.user.id);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error retrieving meeting statistics:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve meeting statistics.' },
      { status: 500 }
    );
  }
}