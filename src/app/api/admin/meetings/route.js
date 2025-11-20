import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import {
  getAllMeetings,
  getMeetingBySlug,
  createMeeting,
  updateMeeting,
  deleteMeeting
} from '@/lib/models/meeting';

/**
 * Admin Meetings API
 * Protected routes for managing AA meetings
 */

/**
 * GET /api/admin/meetings
 * Returns all meetings, including inactive ones
 */
export async function GET(request) {
  try {
    // Check authentication and admin status
    const session = await auth();
    if (!session?.user || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);

    // Prepare filter options
    const filters = {};

    // Include inactive meetings for admins
    filters.includeInactive = true;

    // Optional filters
    if (searchParams.has('day')) {
      const day = parseInt(searchParams.get('day'), 10);
      if (!isNaN(day) && day >= 0 && day <= 6) {
        filters.day = day;
      }
    }

    if (searchParams.has('city')) {
      filters.city = searchParams.get('city');
    }

    if (searchParams.has('state')) {
      filters.state = searchParams.get('state');
    }

    if (searchParams.has('type')) {
      filters.type = searchParams.get('type');
    }

    // Get all meetings with applied filters
    const meetings = await getAllMeetings(filters);

    // Return JSON response
    return NextResponse.json(meetings);
  } catch (error) {
    console.error('Error retrieving meetings:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve meetings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/meetings
 * Create a new meeting
 */
export async function POST(request) {
  try {
    // Check authentication and admin status
    const session = await auth();
    if (!session?.user || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse meeting data from request body
    const meetingData = await request.json();

    // Add admin user as creator
    meetingData.created_by = session.user.id;

    // Create the new meeting
    const newMeeting = await createMeeting(meetingData);

    // Return the created meeting
    return NextResponse.json(newMeeting, { status: 201 });
  } catch (error) {
    console.error('Error creating meeting:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create meeting' },
      { status: 500 }
    );
  }
}