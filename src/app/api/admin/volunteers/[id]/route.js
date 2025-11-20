/**
 * Admin API routes for managing individual volunteers
 */

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import { getUserById, addVolunteerRole, removeVolunteerRole } from '@/lib/models/User';

/**
 * Check if user is an admin
 * @param {Object} session - User session
 * @returns {Boolean} - Whether user is an admin
 */
function isAdmin(session) {
  return session?.user?.isAdmin === true;
}

/**
 * GET /api/admin/volunteers/[id]
 * Get a specific volunteer by ID
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

    // Get volunteer ID from URL params
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Volunteer ID is required' }, { status: 400 });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('dailyreflections');

    // Get volunteer
    const user = await getUserById(id);
    if (!user) {
      return NextResponse.json({ error: 'Volunteer not found' }, { status: 404 });
    }

    // Ensure user has volunteer role
    const isVolunteer = user.roles && user.roles.includes('volunteer_listener');
    if (!isVolunteer) {
      return NextResponse.json({ error: 'User is not a volunteer' }, { status: 404 });
    }

    // Get volunteer application
    const application = await db.collection('volunteer_applications')
      .findOne({ user_id: new ObjectId(id) });

    // Format response
    const formattedVolunteer = {
      id: user._id.toString(),
      name: user.name || 'Anonymous',
      email: user.email,
      image: user.image,
      createdAt: user.createdAt,
      roles: user.roles || [],
      volunteer: user.volunteer || {},
      sobriety: user.sobriety || {},
      application: application ? {
        id: application._id.toString(),
        status: application.status,
        created_at: application.created_at,
        approved_at: application.approved_at,
        rejected_at: application.rejected_at,
        rejection_reason: application.rejection_reason,
        code_of_conduct_accepted: application.code_of_conduct_accepted,
        code_of_conduct_accepted_at: application.code_of_conduct_accepted_at,
        responses: application.responses || {}
      } : null
    };

    return NextResponse.json({ volunteer: formattedVolunteer });
  } catch (error) {
    console.error('Error fetching volunteer:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch volunteer' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/volunteers/[id]
 * Update a volunteer's information
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

    // Get volunteer ID from URL params
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Volunteer ID is required' }, { status: 400 });
    }

    // Get request body
    const body = await request.json();
    const { isActive, availability, notes } = body;

    // Get volunteer to check if they exist
    const user = await getUserById(id);
    if (!user) {
      return NextResponse.json({ error: 'Volunteer not found' }, { status: 404 });
    }

    // Check if user has volunteer role
    const isVolunteer = user.roles && user.roles.includes('volunteer_listener');
    if (!isVolunteer) {
      return NextResponse.json({ error: 'User is not a volunteer' }, { status: 404 });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('dailyreflections');

    // Update fields
    const updateData = {};

    // Update active status
    if (isActive !== undefined) {
      updateData['volunteer.isActive'] = isActive;
    }

    // Update availability
    if (availability) {
      updateData['volunteer.availability'] = availability;
    }

    // Perform update
    await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    // Add admin note if provided
    if (notes) {
      // Find application to add note to
      const application = await db.collection('volunteer_applications')
        .findOne({ user_id: new ObjectId(id) });

      if (application) {
        await db.collection('volunteer_applications').updateOne(
          { _id: application._id },
          {
            $push: {
              notes: {
                admin_id: new ObjectId(session.user.id),
                content: notes,
                created_at: new Date()
              }
            }
          }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Volunteer updated successfully'
    });
  } catch (error) {
    console.error('Error updating volunteer:', error);
    return NextResponse.json({ error: error.message || 'Failed to update volunteer' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/volunteers/[id]
 * Remove volunteer role from a user
 */
export async function DELETE(_, { params }) {
  try {
    // Check authentication and admin status
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get volunteer ID from URL params
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Volunteer ID is required' }, { status: 400 });
    }

    // Get volunteer to check if they exist
    const user = await getUserById(id);
    if (!user) {
      return NextResponse.json({ error: 'Volunteer not found' }, { status: 404 });
    }

    // Check if user has volunteer role
    const isVolunteer = user.roles && user.roles.includes('volunteer_listener');
    if (!isVolunteer) {
      return NextResponse.json({ error: 'User is not a volunteer' }, { status: 404 });
    }

    // Remove volunteer role
    const success = await removeVolunteerRole(id);
    if (!success) {
      return NextResponse.json({ error: 'Failed to remove volunteer role' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Volunteer role removed successfully'
    });
  } catch (error) {
    console.error('Error removing volunteer role:', error);
    return NextResponse.json({ error: error.message || 'Failed to remove volunteer role' }, { status: 500 });
  }
}