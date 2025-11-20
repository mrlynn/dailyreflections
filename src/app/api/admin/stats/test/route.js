import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

/**
 * Admin Stats Test API
 * Testing version of the admin stats API that doesn't require authentication
 * !!! FOR DEVELOPMENT/TESTING ONLY - SHOULD BE REMOVED IN PRODUCTION !!!
 */

/**
 * GET /api/admin/stats/test
 * Returns test statistics for the admin dashboard
 */
export async function GET(request) {
  try {
    const client = await clientPromise;
    const db = client.db('dailyreflections');

    // Get current date for active users calculation
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    // Execute queries in parallel for better performance
    const [
      userCount,
      commentCount,
      chatMessageCount,
      meetingCount
    ] = await Promise.all([
      // Total users
      db.collection('users').countDocuments().catch(() => 0),

      // Total comments
      db.collection('comments').countDocuments().catch(() => 0),

      // Total chat messages
      db.collection('chatMessages').countDocuments().catch(() => 0),

      // Total meetings
      db.collection('meetings').countDocuments().catch(() => 0),
    ]);

    // Generate test active user count
    const activeUserCount = Math.round(userCount * 0.2) || 5;

    // Generate test recent activity
    const recentActivity = [
      { type: 'comment', user: 'Test User 1', content: 'Added a comment on November 1 reflection', time: '15 minutes ago', timestamp: new Date(Date.now() - 15 * 60000) },
      { type: 'login', user: 'Test User 2', content: 'Logged in', time: '30 minutes ago', timestamp: new Date(Date.now() - 30 * 60000) },
      { type: 'chat', user: 'Test User 3', content: 'Asked a question about Step 4', time: '1 hour ago', timestamp: new Date(Date.now() - 60 * 60000) },
      { type: 'comment', user: 'Test User 4', content: 'Added a comment on November 5 reflection', time: '2 hours ago', timestamp: new Date(Date.now() - 120 * 60000) },
    ];

    // Return test statistics
    return NextResponse.json({
      stats: {
        totalUsers: userCount || 15,
        totalComments: commentCount || 42,
        totalChatMessages: chatMessageCount || 78,
        totalMeetings: meetingCount || 23,
        activeUsers: activeUserCount,
      },
      recentActivity
    });
  } catch (error) {
    console.error('Error retrieving test admin stats:', error);
    // Return mock data in case of error
    return NextResponse.json({
      stats: {
        totalUsers: 15,
        totalComments: 42,
        totalChatMessages: 78,
        totalMeetings: 23,
        activeUsers: 5,
      },
      recentActivity: [
        { type: 'comment', user: 'Test User 1', content: 'Added a comment on November 1 reflection', time: '15 minutes ago' },
        { type: 'login', user: 'Test User 2', content: 'Logged in', time: '30 minutes ago' },
        { type: 'chat', user: 'Test User 3', content: 'Asked a question about Step 4', time: '1 hour ago' },
        { type: 'comment', user: 'Test User 4', content: 'Added a comment on November 5 reflection', time: '2 hours ago' },
      ]
    });
  }
}