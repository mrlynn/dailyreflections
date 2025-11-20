import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * GET /api/admin/notifications/users
 * Returns users with their notification preferences
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
    const channel = searchParams.get('channel'); // 'email', 'sms', 'app', or null for all
    const enabled = searchParams.get('enabled'); // 'true' or 'false'
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = parseInt(searchParams.get('skip') || '0');

    // Build query
    const query = {};
    if (enabled === 'true') {
      query['preferences.notifications.enabled'] = true;
      if (channel) {
        query[`preferences.notifications.channels.${channel}`] = true;
      }
    } else if (enabled === 'false') {
      query['preferences.notifications.enabled'] = false;
    }

    // Fetch users
    const users = await db.collection('users')
      .find(query)
      .project({
        email: 1,
        name: 1,
        displayName: 1,
        'preferences.notifications': 1,
        'sobriety.date': 1,
        'sobriety.timezone': 1,
        createdAt: 1
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Format results
    const formattedUsers = users.map(user => ({
      _id: user._id.toString(),
      email: user.email,
      name: user.name || user.displayName,
      notifications: {
        enabled: user.preferences?.notifications?.enabled || false,
        channels: {
          app: user.preferences?.notifications?.channels?.app || false,
          email: user.preferences?.notifications?.channels?.email || false,
          sms: user.preferences?.notifications?.channels?.sms || false
        },
        morningTime: user.preferences?.notifications?.morningTime || null,
        eveningTime: user.preferences?.notifications?.eveningTime || null,
        quietHoursStart: user.preferences?.notifications?.quietHoursStart || null,
        quietHoursEnd: user.preferences?.notifications?.quietHoursEnd || null,
        email: user.preferences?.notifications?.email || null
      },
      sobriety: {
        date: user.sobriety?.date || null,
        timezone: user.sobriety?.timezone || null
      },
      createdAt: user.createdAt
    }));

    // Get total count
    const total = await db.collection('users').countDocuments(query);

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      pagination: {
        limit,
        skip,
        total
      }
    });
  } catch (error) {
    console.error('Error retrieving users with notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve users' },
      { status: 500 }
    );
  }
}

