/**
 * API routes for volunteer statistics
 */

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

/**
 * GET /api/volunteers/stats
 * Get statistics for the current volunteer
 */
export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has volunteer role
    const hasVolunteerRole = session.user.roles?.includes('volunteer_listener');
    if (!hasVolunteerRole) {
      return NextResponse.json({ error: 'Forbidden - Only volunteers can access this endpoint' }, { status: 403 });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('dailyreflections');
    const volunteerId = typeof session.user.id === 'string' ? new ObjectId(session.user.id) : session.user.id;

    // Get volunteer statistics from the database
    const userRecord = await db.collection('users').findOne(
      { _id: volunteerId },
      {
        projection: {
          'volunteer.totalSessionsCompleted': 1,
          'volunteer.averageFeedbackScore': 1,
          'volunteer.flaggedSessionsCount': 1
        }
      }
    );

    // Get chat session stats
    const chatSessions = await db.collection('chat_sessions').find({
      volunteer_id: volunteerId,
      status: 'completed'
    }).toArray();

    // Calculate statistics
    const totalSessions = userRecord?.volunteer?.totalSessionsCompleted || 0;
    let totalMessages = 0;
    let totalDuration = 0;

    for (const session of chatSessions) {
      totalMessages += session.messages_count || 0;

      if (session.start_time && session.end_time) {
        const durationInSeconds = (new Date(session.end_time) - new Date(session.start_time)) / 1000;
        totalDuration += durationInSeconds;
      }
    }

    // Calculate averages
    const avgSessionDuration = totalSessions > 0 ? Math.round((totalDuration / totalSessions) / 60) : 0; // in minutes

    // Calculate positive rating percentage
    const feedbackScore = userRecord?.volunteer?.averageFeedbackScore || 0;
    const positiveRating = Math.round(feedbackScore * 100); // Convert to percentage

    return NextResponse.json({
      totalSessions,
      totalMessages,
      avgSessionDuration,
      positiveRating,
      flaggedSessionsCount: userRecord?.volunteer?.flaggedSessionsCount || 0
    });
  } catch (error) {
    console.error('Error fetching volunteer stats:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch volunteer stats' }, { status: 500 });
  }
}