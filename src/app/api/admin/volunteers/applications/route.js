/**
 * Admin API routes for managing volunteer applications
 */

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getPendingVolunteerApplications } from '@/lib/models/VolunteerApplication';

/**
 * Check if user is an admin
 * @param {Object} session - User session
 * @returns {Boolean} - Whether user is an admin
 */
function isAdmin(session) {
  return session?.user?.isAdmin === true;
}

/**
 * GET /api/admin/volunteers/applications
 * Get all pending volunteer applications (admin only)
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

    // Get pending applications
    const applications = await getPendingVolunteerApplications();

    return NextResponse.json({ applications });
  } catch (error) {
    console.error('Error fetching volunteer applications:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch volunteer applications' }, { status: 500 });
  }
}