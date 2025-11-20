import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * GET /api/admin/notifications/logs
 * Returns email and SMS logs with filtering options
 * Requires admin authentication
 */
export async function GET(request) {
  try {
    // Check authentication and admin status
    const session = await auth();
    if (!session?.user || !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db('dailyreflections');

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'email', 'sms', or 'all'
    const status = searchParams.get('status'); // 'sent', 'failed', etc.
    const messageType = searchParams.get('messageType'); // 'daily_reflection', etc.
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');

    const results = {
      email: [],
      sms: [],
      total: 0
    };

    // Build query
    const query = {};
    if (status) query.status = status;
    if (messageType) query.messageType = messageType;
    if (userId) query.userId = new ObjectId(userId);
    if (startDate || endDate) {
      query.sentAt = {};
      if (startDate) query.sentAt.$gte = new Date(startDate);
      if (endDate) query.sentAt.$lt = new Date(endDate);
    }

    // Fetch email logs
    if (type === 'all' || type === 'email') {
      const emailLogs = await db.collection('emailLogs')
        .find(query)
        .sort({ sentAt: -1 })
        .skip(type === 'all' ? 0 : skip)
        .limit(type === 'all' ? limit : limit)
        .toArray();

      // Populate user info
      const emailLogsWithUsers = await Promise.all(
        emailLogs.map(async (log) => {
          if (log.userId) {
            const user = await db.collection('users').findOne(
              { _id: log.userId },
              { projection: { email: 1, name: 1, displayName: 1 } }
            );
            return {
              ...log,
              user: user ? {
                email: user.email,
                name: user.name || user.displayName
              } : null
            };
          }
          return log;
        })
      );

      results.email = emailLogsWithUsers;
    }

    // Fetch SMS logs
    if (type === 'all' || type === 'sms') {
      const smsLogs = await db.collection('smsLogs')
        .find(query)
        .sort({ sentAt: -1 })
        .skip(type === 'all' ? 0 : skip)
        .limit(type === 'all' ? limit : limit)
        .toArray();

      // Populate user info
      const smsLogsWithUsers = await Promise.all(
        smsLogs.map(async (log) => {
          if (log.userId) {
            const user = await db.collection('users').findOne(
              { _id: log.userId },
              { projection: { email: 1, name: 1, displayName: 1 } }
            );
            return {
              ...log,
              user: user ? {
                email: user.email,
                name: user.name || user.displayName
              } : null
            };
          }
          return log;
        })
      );

      results.sms = smsLogsWithUsers;
    }

    // Get total counts
    if (type === 'all') {
      results.total = results.email.length + results.sms.length;
    } else if (type === 'email') {
      results.total = await db.collection('emailLogs').countDocuments(query);
    } else if (type === 'sms') {
      results.total = await db.collection('smsLogs').countDocuments(query);
    }

    return NextResponse.json({
      success: true,
      logs: results,
      pagination: {
        limit,
        skip,
        total: results.total
      }
    });
  } catch (error) {
    console.error('Error retrieving notification logs:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve notification logs' },
      { status: 500 }
    );
  }
}

