/**
 * API routes for volunteer feedback data
 */

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getVolunteerFeedback } from '@/lib/models/ChatFeedback';

/**
 * GET /api/volunteers/feedback
 * Get all feedback for the authenticated volunteer
 */
export async function GET(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a volunteer
    if (!session.user.roles?.includes('volunteer_listener')) {
      return NextResponse.json({ error: 'Not authorized - volunteer role required' }, { status: 403 });
    }

    // Get the volunteer's feedback
    const feedback = await getVolunteerFeedback(session.user.id, 100); // Limit to 100 most recent items

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error fetching volunteer feedback:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch volunteer feedback' }, { status: 500 });
  }
}