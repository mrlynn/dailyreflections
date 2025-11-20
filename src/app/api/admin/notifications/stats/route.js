import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * GET /api/admin/notifications/stats
 * Returns statistics about email and SMS notifications
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

    // Get date range from query params (optional)
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateQuery = {};
    if (startDate || endDate) {
      dateQuery.sentAt = {};
      if (startDate) dateQuery.sentAt.$gte = new Date(startDate);
      if (endDate) dateQuery.sentAt.$lt = new Date(endDate);
    }

    // Email statistics
    const emailStats = await db.collection('emailLogs').aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    const emailTypeStats = await db.collection('emailLogs').aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: '$messageType',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    const totalEmails = await db.collection('emailLogs').countDocuments(dateQuery);
    const successfulEmails = await db.collection('emailLogs').countDocuments({
      ...dateQuery,
      status: 'sent'
    });
    const failedEmails = await db.collection('emailLogs').countDocuments({
      ...dateQuery,
      status: 'failed'
    });

    // SMS statistics
    const smsStats = await db.collection('smsLogs').aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    const smsTypeStats = await db.collection('smsLogs').aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: '$messageType',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    const totalSMS = await db.collection('smsLogs').countDocuments(dateQuery);
    const successfulSMS = await db.collection('smsLogs').countDocuments({
      ...dateQuery,
      status: 'sent'
    });
    const failedSMS = await db.collection('smsLogs').countDocuments({
      ...dateQuery,
      status: 'failed'
    });

    // User notification preferences
    const usersWithEmailEnabled = await db.collection('users').countDocuments({
      'preferences.notifications.enabled': true,
      'preferences.notifications.channels.email': true
    });

    const usersWithSMSEnabled = await db.collection('users').countDocuments({
      'preferences.notifications.enabled': true,
      'preferences.notifications.channels.sms': true
    });

    const usersWithAppEnabled = await db.collection('users').countDocuments({
      'preferences.notifications.enabled': true,
      'preferences.notifications.channels.app': true
    });

    // Recent activity (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const recentEmails = await db.collection('emailLogs').countDocuments({
      sentAt: { $gte: yesterday }
    });

    const recentSMS = await db.collection('smsLogs').countDocuments({
      sentAt: { $gte: yesterday }
    });

    // Format results
    const emailStatusCounts = {};
    emailStats.forEach(item => {
      emailStatusCounts[item._id] = item.count;
    });

    const emailTypeCounts = {};
    emailTypeStats.forEach(item => {
      emailTypeCounts[item._id] = item.count;
    });

    const smsStatusCounts = {};
    smsStats.forEach(item => {
      smsStatusCounts[item._id] = item.count;
    });

    const smsTypeCounts = {};
    smsTypeStats.forEach(item => {
      smsTypeCounts[item._id] = item.count;
    });

    return NextResponse.json({
      success: true,
      email: {
        total: totalEmails,
        successful: successfulEmails,
        failed: failedEmails,
        successRate: totalEmails > 0 ? ((successfulEmails / totalEmails) * 100).toFixed(2) : 0,
        statusCounts: emailStatusCounts,
        typeCounts: emailTypeCounts,
        recent24h: recentEmails
      },
      sms: {
        total: totalSMS,
        successful: successfulSMS,
        failed: failedSMS,
        successRate: totalSMS > 0 ? ((successfulSMS / totalSMS) * 100).toFixed(2) : 0,
        statusCounts: smsStatusCounts,
        typeCounts: smsTypeCounts,
        recent24h: recentSMS
      },
      users: {
        emailEnabled: usersWithEmailEnabled,
        smsEnabled: usersWithSMSEnabled,
        appEnabled: usersWithAppEnabled
      }
    });
  } catch (error) {
    console.error('Error retrieving notification stats:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve notification statistics' },
      { status: 500 }
    );
  }
}

