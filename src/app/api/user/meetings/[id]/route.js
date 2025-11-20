import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import {
  getUserMeetingAttendance,
  updateMeetingAttendance,
  deleteMeetingAttendance
} from '@/lib/models/MeetingAttendance';

/**
 * GET /api/user/meetings/[id]
 * Retrieves a single meeting attendance record
 */
export async function GET(request, { params }) {
  try {
    const session = await auth();
    const { id } = params;

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

    // Get meeting by ID
    const meetings = await getUserMeetingAttendance(session.user.id, {
      filter: { _id: id }
    });

    if (!meetings || meetings.length === 0) {
      return NextResponse.json(
        { error: 'Meeting not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      meeting: meetings[0]
    });
  } catch (error) {
    console.error('Error retrieving meeting:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve meeting information.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/meetings/[id]
 * Updates a meeting attendance record
 */
export async function PUT(request, { params }) {
  try {
    const session = await auth();
    const { id } = params;

    // Require authentication
    if (!session?.user) {
      return NextResponse.json(
        {
          error: 'You must be signed in to update meeting records.',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Update meeting
    const success = await updateMeetingAttendance(id, body, session.user.id);

    if (success) {
      return NextResponse.json({
        message: 'Meeting updated successfully.'
      });
    } else {
      return NextResponse.json(
        { error: 'Meeting not found or you do not have permission to update it.' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error updating meeting:', error);
    return NextResponse.json(
      { error: 'Failed to update meeting information.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/meetings/[id]
 * Deletes a meeting attendance record
 */
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    const { id } = params;

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

    // Delete meeting
    const success = await deleteMeetingAttendance(id, session.user.id);

    if (success) {
      return NextResponse.json({
        message: 'Meeting deleted successfully.'
      });
    } else {
      return NextResponse.json(
        { error: 'Meeting not found or you do not have permission to delete it.' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error deleting meeting:', error);
    return NextResponse.json(
      { error: 'Failed to delete meeting information.' },
      { status: 500 }
    );
  }
}