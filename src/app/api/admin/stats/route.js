import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb';

/**
 * Admin Stats API
 * Protected route for retrieving admin dashboard statistics
 */

/**
 * GET /api/admin/stats
 * Returns statistics for the admin dashboard
 */
export async function GET(request) {
  try {
    // Check authentication and admin status
    const session = await auth();
    if (!session?.user || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      meetingCount,
      activeUserCount,
      recentActivity
    ] = await Promise.all([
      // Total users
      db.collection('users').countDocuments(),

      // Total comments
      db.collection('comments').countDocuments(),

      // Total chat messages
      db.collection('chatMessages').countDocuments().catch(() => 0), // Use 0 if collection doesn't exist

      // Total meetings
      db.collection('meetings').countDocuments().catch(() => 0), // Use 0 if collection doesn't exist

      // Active users (logged in within last 24 hours)
      db.collection('users').countDocuments({
        lastLogin: { $gte: oneDayAgo }
      }).catch(() => 0), // Use 0 if field doesn't exist

      // Recent activity (from various collections)
      getRecentActivity(db)
    ]);

    // Return statistics
    return NextResponse.json({
      stats: {
        totalUsers: userCount,
        totalComments: commentCount,
        totalChatMessages: chatMessageCount,
        totalMeetings: meetingCount,
        activeUsers: activeUserCount,
      },
      recentActivity
    });
  } catch (error) {
    console.error('Error retrieving admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve admin statistics' },
      { status: 500 }
    );
  }
}

/**
 * Get recent activity from various collections
 * @param {Object} db - MongoDB database connection
 * @returns {Promise<Array>} - Array of recent activity items
 */
async function getRecentActivity(db) {
  try {
    // Get recent comments
    const recentComments = await db.collection('comments')
      .find()
      .sort({ createdAt: -1 })
      .limit(3)
      .toArray();

    // Format comments for display
    const commentActivity = recentComments.map(comment => ({
      type: 'comment',
      user: comment.author,
      content: `Added a comment on ${formatDateKey(comment.dateKey)} reflection`,
      time: getTimeAgo(comment.createdAt),
      timestamp: comment.createdAt
    }));

    // Get recent logins (if session collection exists)
    let loginActivity = [];
    try {
      const recentSessions = await db.collection('sessions')
        .find()
        .sort({ updatedAt: -1 })
        .limit(3)
        .toArray();

      // Fetch user details for sessions
      const userIds = recentSessions.map(session => session.userId);
      const users = await db.collection('users')
        .find({ _id: { $in: userIds } })
        .toArray();

      // Create user map for quick lookups
      const userMap = users.reduce((map, user) => {
        map[user._id.toString()] = user;
        return map;
      }, {});

      // Format login activity
      loginActivity = recentSessions.map(session => {
        const user = userMap[session.userId] || {};
        const displayName = user.displayName || user.name || 'Anonymous User';

        return {
          type: 'login',
          user: displayName,
          content: 'Logged in',
          time: getTimeAgo(session.updatedAt),
          timestamp: session.updatedAt
        };
      });
    } catch (error) {
      // Sessions might not be stored in database, ignore error
      console.log('Could not fetch session activity:', error.message);
    }

    // Get recent chat messages (if collection exists)
    let chatActivity = [];
    try {
      const recentChats = await db.collection('chatMessages')
        .find()
        .sort({ createdAt: -1 })
        .limit(3)
        .toArray();

      // Format chat messages
      chatActivity = recentChats.map(chat => ({
        type: 'chat',
        user: chat.username || 'Anonymous User',
        content: `Asked a question about ${chat.topic || 'recovery'}`,
        time: getTimeAgo(chat.createdAt),
        timestamp: chat.createdAt
      }));
    } catch (error) {
      // Chat collection might not exist, ignore error
      console.log('Could not fetch chat activity:', error.message);
    }

    // Combine all activities and sort by time
    const allActivity = [...commentActivity, ...loginActivity, ...chatActivity]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5); // Limit to 5 most recent items

    return allActivity;
  } catch (error) {
    console.error('Error getting recent activity:', error);
    return []; // Return empty array if there's an error
  }
}

/**
 * Format a date key (MM-DD) into a readable date string
 * @param {string} dateKey - Date key in MM-DD format
 * @returns {string} - Readable date string
 */
function formatDateKey(dateKey) {
  if (!dateKey || !/^\d{2}-\d{2}$/.test(dateKey)) {
    return 'a';
  }

  const [month, day] = dateKey.split('-').map(Number);

  const months = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'
  ];

  return `${months[month - 1]} ${day}`;
}

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param {Date} date - Date to convert
 * @returns {string} - Relative time string
 */
function getTimeAgo(date) {
  if (!date) return 'some time ago';

  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} days ago`;

  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} months ago`;
}