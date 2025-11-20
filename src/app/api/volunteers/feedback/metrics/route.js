/**
 * API routes for volunteer feedback metrics and analytics
 */

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

/**
 * GET /api/volunteers/feedback/metrics
 * Get detailed feedback metrics for the authenticated volunteer
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

    const client = await clientPromise;
    const db = client.db('dailyreflections');

    const volunteerId = typeof session.user.id === 'string' ? new ObjectId(session.user.id) : session.user.id;

    // Get all sessions for this volunteer
    const sessions = await db.collection('chat_sessions')
      .find({
        volunteer_id: volunteerId,
        status: 'completed'
      })
      .sort({ start_time: -1 })
      .toArray();

    // Get all feedback for this volunteer
    const feedback = await db.collection('chat_feedback')
      .find({
        volunteer_id: volunteerId
      })
      .toArray();

    // Calculate metrics
    const totalSessions = sessions.length;

    // Calculate average duration
    let totalDuration = 0;
    let sessionsWithDuration = 0;

    sessions.forEach(session => {
      if (session.start_time && session.end_time) {
        const start = new Date(session.start_time);
        const end = new Date(session.end_time);
        const durationMinutes = Math.floor((end - start) / (1000 * 60));

        if (!isNaN(durationMinutes) && durationMinutes >= 0) {
          totalDuration += durationMinutes;
          sessionsWithDuration++;
        }
      }
    });

    const averageDuration = sessionsWithDuration > 0 ? totalDuration / sessionsWithDuration : 0;

    // Calculate response time metrics
    let totalResponseTime = 0;
    let responseTimeCount = 0;

    // Calculate average rating
    const positiveCount = feedback.filter(f => f.rating === 'positive').length;
    const neutralCount = feedback.filter(f => f.rating === 'neutral').length;
    const flaggedCount = feedback.filter(f => f.rating === 'flagged').length;
    const totalFeedbackCount = feedback.length;

    const averageRating = totalFeedbackCount > 0 ?
      (positiveCount + (neutralCount * 0.5)) / totalFeedbackCount : 0;

    // Determine rating trend (simplified for demo)
    // In a real implementation, this would compare recent ratings to older ones
    const ratingTrend = 'stable';

    // Calculate weekly stats
    const weeklyStats = [];
    const now = new Date();

    // Last 4 weeks
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - ((i + 1) * 7));

      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - (i * 7));

      const weekSessions = sessions.filter(s => {
        const sessionDate = new Date(s.start_time);
        return sessionDate >= weekStart && sessionDate < weekEnd;
      });

      const weekFeedback = feedback.filter(f => {
        const feedbackDate = new Date(f.created_at);
        return feedbackDate >= weekStart && feedbackDate < weekEnd;
      });

      const weekPositive = weekFeedback.filter(f => f.rating === 'positive').length;
      const positivePercent = weekFeedback.length > 0 ?
        (weekPositive / weekFeedback.length) * 100 : 0;

      weeklyStats.push({
        label: `Week ${4-i}`,
        count: weekSessions.length,
        positivePercent
      });
    }

    // Calculate sessions by hour of day
    const sessionsByHour = Array(24).fill().map((_, hour) => ({
      hour,
      count: 0
    }));

    sessions.forEach(session => {
      if (session.start_time) {
        const hour = new Date(session.start_time).getHours();
        sessionsByHour[hour].count++;
      }
    });

    // Return metrics
    return NextResponse.json({
      totalSessions,
      averageDuration,
      averageRating,
      responseTimeAvg: 45, // Placeholder - would be calculated from actual message response times
      ratingTrend,
      weeklyStats,
      sessionsByHour
    });
  } catch (error) {
    console.error('Error fetching feedback metrics:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch feedback metrics' }, { status: 500 });
  }
}