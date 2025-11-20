/**
 * API routes for volunteer applications
 */

import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { createVolunteerApplication, getVolunteerApplicationByUserId } from '@/lib/models/VolunteerApplication';

/**
 * GET /api/volunteers/applications
 * Get the current user's volunteer application(s)
 */
export async function GET(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's application
    const application = await getVolunteerApplicationByUserId(session.user.id);

    return NextResponse.json({ application });
  } catch (error) {
    console.error('Error fetching volunteer application:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch volunteer application' }, { status: 500 });
  }
}

/**
 * POST /api/volunteers/applications
 * Submit a new volunteer application
 */
export async function POST(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { responses } = body;

    // Validate required fields
    if (!responses) {
      return NextResponse.json({ error: 'Application responses are required' }, { status: 400 });
    }

    if (!responses.sobrietyDuration) {
      return NextResponse.json({ error: 'Sobriety duration is required' }, { status: 400 });
    }

    if (!responses.volunteerMotivation) {
      return NextResponse.json({ error: 'Volunteer motivation is required' }, { status: 400 });
    }

    if (!responses.recoveryConnection) {
      return NextResponse.json({ error: 'Recovery connection information is required' }, { status: 400 });
    }

    if (!responses.serviceMeaning) {
      return NextResponse.json({ error: 'Service meaning is required' }, { status: 400 });
    }

    // Check if user already has an application
    const existingApplication = await getVolunteerApplicationByUserId(session.user.id);
    if (existingApplication && existingApplication.status === 'pending') {
      return NextResponse.json({
        error: 'You already have a pending volunteer application',
        applicationId: existingApplication._id
      }, { status: 400 });
    }

    // Create the application
    const application = await createVolunteerApplication(session.user.id, responses);

    return NextResponse.json({ success: true, application }, { status: 201 });
  } catch (error) {
    console.error('Error creating volunteer application:', error);
    return NextResponse.json({ error: error.message || 'Failed to create volunteer application' }, { status: 500 });
  }
}