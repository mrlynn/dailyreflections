/**
 * Admin API routes for managing volunteers
 */

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';

/**
 * Check if user is an admin
 * @param {Object} session - User session
 * @returns {Boolean} - Whether user is an admin
 */
function isAdmin(session) {
  return session?.user?.isAdmin === true;
}

/**
 * GET /api/admin/volunteers
 * Get a list of all volunteers with their details
 */
export async function GET(request) {
  try {
    // Check authentication and admin status
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status'); // 'active' or 'inactive'
    const search = searchParams.get('search'); // search by name or email

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('dailyreflections');

    // Build the query
    const query = {
      roles: 'volunteer_listener'
    };

    // Add status filter if provided
    if (status === 'active') {
      query['volunteer.isActive'] = true;
    } else if (status === 'inactive') {
      query['volunteer.isActive'] = false;
    }

    // Add search filter if provided
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex }
      ];
    }

    // Count total matching documents
    const totalCount = await db.collection('users').countDocuments(query);

    // Get paginated volunteers
    const volunteers = await db.collection('users')
      .find(query)
      .project({
        _id: 1,
        name: 1,
        email: 1,
        image: 1,
        volunteer: 1,
        roles: 1,
        createdAt: 1,
        sobriety: 1
      })
      .sort({ 'volunteer.activatedAt': -1 }) // Sort by activation date (newest first)
      .skip(page * limit)
      .limit(limit)
      .toArray();

    // Get application status for each volunteer (if exists)
    const volunteerIds = volunteers.map(v => v._id);
    const applications = await db.collection('volunteer_applications')
      .find({ user_id: { $in: volunteerIds } })
      .project({
        user_id: 1,
        status: 1,
        created_at: 1,
        approved_at: 1,
        code_of_conduct_accepted: 1
      })
      .toArray();

    // Create a map of user_id to application info
    const applicationMap = applications.reduce((map, app) => {
      map[app.user_id.toString()] = app;
      return map;
    }, {});

    // Enhance volunteer data with application info
    const enhancedVolunteers = volunteers.map(volunteer => {
      const app = applicationMap[volunteer._id.toString()];
      return {
        id: volunteer._id.toString(),
        name: volunteer.name || 'Anonymous',
        email: volunteer.email,
        image: volunteer.image,
        isActive: volunteer.volunteer?.isActive || false,
        activatedAt: volunteer.volunteer?.activatedAt || null,
        codeOfConductAccepted: volunteer.volunteer?.codeOfConductAccepted || false,
        codeOfConductAcceptedAt: volunteer.volunteer?.codeOfConductAcceptedAt || null,
        sobrietyDate: volunteer.sobriety?.date || null,
        applicationStatus: app?.status || null,
        applicationDate: app?.created_at || null,
        approvedAt: app?.approved_at || volunteer.volunteer?.activatedAt || null,
        availability: volunteer.volunteer?.availability || []
      };
    });

    return NextResponse.json({
      volunteers: enhancedVolunteers,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching volunteers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch volunteers' },
      { status: 500 }
    );
  }
}