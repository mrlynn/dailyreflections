/**
 * API routes for volunteer feedback statistics
 */

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { getVolunteerFeedbackStats, getVolunteerFeedback } from '@/lib/models/ChatFeedback';

/**
 * GET /api/volunteers/feedback/stats
 * Get feedback statistics for the authenticated volunteer
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

    // Get the volunteer's feedback stats
    const stats = await getVolunteerFeedbackStats(session.user.id);

    // Get recent feedback with comments for display
    const allFeedback = await getVolunteerFeedback(session.user.id, 50);

    // Filter to include only those with comments and sort by date
    const feedbackWithComments = allFeedback
      .filter(item => item.comments && item.comments.trim() !== '')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return NextResponse.json({
      ...stats,
      recentFeedback: feedbackWithComments.slice(0, 5) // Only return the 5 most recent comments
    });
  } catch (error) {
    console.error('Error fetching feedback statistics:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch feedback statistics' }, { status: 500 });
  }
}