import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { startNinetyInNinetyChallenge, resetNinetyInNinetyChallenge } from '@/lib/models/MeetingAttendance';

/**
 * POST /api/user/meetings/start90in90
 * Starts a new 90-in-90 challenge for the user
 */
export async function POST(request) {
  try {
    const session = await auth();

    // Require authentication
    if (!session?.user) {
      return NextResponse.json(
        {
          error: 'You must be signed in to start a 90-in-90 challenge.',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const reset = body?.reset === true;

    // Start or reset the 90-in-90 challenge
    const ninetyInNinety = reset
      ? await resetNinetyInNinetyChallenge(session.user.id)
      : await startNinetyInNinetyChallenge(session.user.id);

    return NextResponse.json({
      message: reset ? 'Successfully reset 90-in-90 challenge.' : 'Successfully started 90-in-90 challenge.',
      ninetyInNinety
    });
  } catch (error) {
    console.error('Error starting/resetting 90-in-90 challenge:', error);
    return NextResponse.json(
      { error: 'Failed to start/reset 90-in-90 challenge.' },
      { status: 500 }
    );
  }
}