import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import {
  createMeetingAttendance,
  getUserMeetingAttendance,
  deleteMeetingAttendance
} from '@/lib/models/MeetingAttendance';

/**
 * GET /api/user/meetings
 * Retrieves the user's meeting attendance records
 */
export async function GET(request) {
  try {
    const session = await auth();

    // Require authentication
    if (!session?.user) {
      return NextResponse.json(
        {
          error: 'You must be signed in to access meeting information.',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const skip = parseInt(url.searchParams.get('skip') || '0', 10);

    // Get user's meeting attendance
    const meetings = await getUserMeetingAttendance(session.user.id, { limit, skip });

    return NextResponse.json({ meetings });
  } catch (error) {
    console.error('Error retrieving meeting attendance:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve meeting information.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/meetings
 * Creates a new meeting attendance record
 */
export async function POST(request) {
  try {
    const session = await auth();

    // Require authentication
    if (!session?.user) {
      return NextResponse.json(
        {
          error: 'You must be signed in to log meeting attendance.',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.date) {
      return NextResponse.json(
        { error: 'Meeting date is required.' },
        { status: 400 }
      );
    }

    // Create meeting attendance record
    const meeting = await createMeetingAttendance(body, session.user.id);

    return NextResponse.json({
      message: 'Meeting logged successfully.',
      meeting
    });
  } catch (error) {
    console.error('Error logging meeting attendance:', error);
    return NextResponse.json(
      { error: 'Failed to log meeting attendance.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/meetings
 * Deletes a meeting attendance record
 */
export async function DELETE(request) {
  try {
    const session = await auth();

    // Require authentication
    if (!session?.user) {
      return NextResponse.json(
        {
          error: 'You must be signed in to delete meeting records.',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    // Parse the meetingId from query
    const url = new URL(request.url);
    const meetingId = url.searchParams.get('id');

    if (!meetingId) {
      return NextResponse.json(
        { error: 'Meeting ID is required.' },
        { status: 400 }
      );
    }

    // Delete meeting record
    const success = await deleteMeetingAttendance(meetingId, session.user.id);

    if (success) {
      return NextResponse.json({
        message: 'Meeting record deleted successfully.'
      });
    } else {
      return NextResponse.json(
        { error: 'Meeting record not found or you do not have permission to delete it.' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error deleting meeting record:', error);
    return NextResponse.json(
      { error: 'Failed to delete meeting record.' },
      { status: 500 }
    );
  }
}