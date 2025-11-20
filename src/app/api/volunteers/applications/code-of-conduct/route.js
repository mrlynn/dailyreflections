/**
 * API route for handling volunteer code of conduct agreements
 */

import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { recordCodeOfConductAgreement, getVolunteerApplicationByUserId } from '@/lib/models/VolunteerApplication';

/**
 * POST /api/volunteers/applications/code-of-conduct
 * Record user's agreement to the volunteer code of conduct
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
    const { agreed, explicit = true } = body;

    // Validate required fields
    if (agreed !== true) {
      return NextResponse.json({ error: 'You must agree to the code of conduct to continue' }, { status: 400 });
    }

    // Get the user's application
    const application = await getVolunteerApplicationByUserId(session.user.id);
    if (!application) {
      return NextResponse.json({ error: 'No volunteer application found' }, { status: 409 });
    }

    // Record the agreement
    await recordCodeOfConductAgreement(application._id, session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Code of conduct agreement recorded',
      explicit: explicit,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error recording code of conduct agreement:', error);
    return NextResponse.json({
      error: error.message || 'Failed to record code of conduct agreement'
    }, { status: 500 });
  }
}