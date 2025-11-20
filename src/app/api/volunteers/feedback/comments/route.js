/**
 * API routes for volunteer feedback comments
 */

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getVolunteerFeedback } from '@/lib/models/ChatFeedback';

/**
 * GET /api/volunteers/feedback/comments
 * Get feedback comments for the authenticated volunteer
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

    // Get all feedback for this volunteer
    const allFeedback = await getVolunteerFeedback(session.user.id, 100);

    // Filter to only those with actual comments
    const commentsOnly = allFeedback
      .filter(item => item.comments && item.comments.trim() !== '')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return NextResponse.json({
      comments: commentsOnly
    });
  } catch (error) {
    console.error('Error fetching feedback comments:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch feedback comments' }, { status: 500 });
  }
}