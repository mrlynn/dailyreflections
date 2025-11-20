/**
 * Admin API routes for managing individual volunteer applications
 */

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import {
  getVolunteerApplicationById,
  updateVolunteerApplicationStatus,
  addApplicationNote
} from '@/lib/models/VolunteerApplication';
import { getUserById, addVolunteerRole, removeVolunteerRole } from '@/lib/models/User';
import { sendApplicationApprovedEmail, sendApplicationRejectedEmail } from '@/lib/emailService';

/**
 * Check if user is an admin
 * @param {Object} session - User session
 * @returns {Boolean} - Whether user is an admin
 */
function isAdmin(session) {
  return session?.user?.isAdmin === true;
}

/**
 * GET /api/admin/volunteers/applications/[id]
 * Get a specific volunteer application by ID (admin only)
 */
export async function GET(_, { params }) {
  try {
    // Check authentication and admin status
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get application ID from URL params - await params since it's a Promise in Next.js 16
    const paramsData = await params;
    const id = paramsData.id;
    if (!id) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    // Get application
    const application = await getVolunteerApplicationById(id);
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Get the applicant user data
    let user = null;
    if (application.user_id) {
      user = await getUserById(application.user_id);
    }

    // Return application with user info (if available)
    return NextResponse.json({
      application,
      user: user ? {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        createdAt: user.createdAt,
        sobriety: user.sobriety
      } : null
    });
  } catch (error) {
    console.error('Error fetching volunteer application:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch volunteer application' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/volunteers/applications/[id]
 * Update a volunteer application's status (approve/reject)
 */
export async function PUT(request, { params }) {
  try {
    // Check authentication and admin status
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get application ID from URL params - await params since it's a Promise in Next.js 16
    const paramsData = await params;
    const id = paramsData.id;
    if (!id) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    // Get request body
    const body = await request.json();
    const { status, notes, reason } = body;

    // Validate status
    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be "approved" or "rejected"' }, { status: 400 });
    }

    // If rejecting, require a reason
    if (status === 'rejected' && !reason) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

    // Get application to check if it exists
    const application = await getVolunteerApplicationById(id);
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Prevent changing status if already approved/rejected
    if (application.status === 'approved' || application.status === 'rejected') {
      return NextResponse.json({
        error: `Application already ${application.status}`,
        status: application.status
      }, { status: 400 });
    }

    // Add admin note if provided
    if (notes) {
      await addApplicationNote(id, session.user.id, notes);
    }

    // Get the applicant's user information for email notification
    const user = await getUserById(application.user_id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const recipient = {
      name: user.name || 'User',
      email: user.email
    };

    // Update application status
    await updateVolunteerApplicationStatus(id, status, session.user.id, reason);

    // Handle role and email notification based on status
    if (status === 'approved') {
      // Add volunteer role to user
      await addVolunteerRole(application.user_id);

      // Send approval email
      await sendApplicationApprovedEmail(recipient);
    } else if (status === 'rejected') {
      // If previously approved but now rejected, remove the volunteer role
      if (application.status === 'approved') {
        await removeVolunteerRole(application.user_id);
      }

      // Send rejection email with reason
      await sendApplicationRejectedEmail(recipient, reason);
    }

    return NextResponse.json({
      success: true,
      message: `Application ${status} successfully`,
      emailSent: true
    });
  } catch (error) {
    console.error('Error updating volunteer application:', error);
    return NextResponse.json({ error: error.message || 'Failed to update volunteer application' }, { status: 500 });
  }
}

/**
 * POST /api/admin/volunteers/applications/[id]/notes
 * Add a note to a volunteer application
 */
export async function POST(request, { params }) {
  try {
    // Check authentication and admin status
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get application ID from URL params - await params since it's a Promise in Next.js 16
    const paramsData = await params;
    const id = paramsData.id;
    if (!id) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    // Get request body
    const body = await request.json();
    const { content } = body;

    // Validate note content
    if (!content) {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 });
    }

    // Get application to check if it exists
    const application = await getVolunteerApplicationById(id);
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Add note
    await addApplicationNote(id, session.user.id, content);

    return NextResponse.json({
      success: true,
      message: 'Note added successfully'
    });
  } catch (error) {
    console.error('Error adding note to volunteer application:', error);
    return NextResponse.json({ error: error.message || 'Failed to add note' }, { status: 500 });
  }
}