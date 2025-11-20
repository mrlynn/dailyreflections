import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getMeetingBySlug, updateMeeting, deleteMeeting } from '@/lib/models/meeting';

/**
 * Admin Meeting Detail API
 * Protected routes for managing individual AA meetings
 */

/**
 * GET /api/admin/meetings/[slug]
 * Get a specific meeting by slug
 */
export async function GET(request, { params }) {
  try {
    // Check authentication and admin status
    const session = await auth();
    if (!session?.user || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = params;

    // Get meeting by slug
    const meeting = await getMeetingBySlug(slug);

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Return the meeting data
    return NextResponse.json(meeting);
  } catch (error) {
    console.error(`Error retrieving meeting ${params.slug}:`, error);
    return NextResponse.json(
      { error: 'Failed to retrieve meeting' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/meetings/[slug]
 * Update a specific meeting
 */
export async function PUT(request, { params }) {
  try {
    // Check authentication and admin status
    const session = await auth();
    if (!session?.user || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = params;
    const updates = await request.json();

    // Update the meeting
    const updatedMeeting = await updateMeeting(slug, updates);

    // Return the updated meeting
    return NextResponse.json(updatedMeeting);
  } catch (error) {
    console.error(`Error updating meeting ${params.slug}:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to update meeting' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/meetings/[slug]
 * Delete a specific meeting
 */
export async function DELETE(request, { params }) {
  try {
    // Check authentication and admin status
    const session = await auth();
    if (!session?.user || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = params;

    // Delete the meeting
    const result = await deleteMeeting(slug);

    if (!result) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Return success response
    return NextResponse.json({ success: true, message: 'Meeting deleted successfully' });
  } catch (error) {
    console.error(`Error deleting meeting ${params.slug}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete meeting' },
      { status: 500 }
    );
  }
}