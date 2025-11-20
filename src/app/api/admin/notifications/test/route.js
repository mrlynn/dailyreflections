import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { sendDailyReflectionToUser } from '@/services/emailDeliveryService';
import { sendDailyReflectionToUser as sendSMSDailyReflection } from '@/services/smsDeliveryService';

/**
 * POST /api/admin/notifications/test
 * Test sending notifications to a specific user
 * Requires admin authentication
 */
export async function POST(request) {
  try {
    // Check authentication and admin status
    const session = await auth();
    if (!session?.user || !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, channel, dateKey, overrideQuietHours } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!channel || !['email', 'sms'].includes(channel)) {
      return NextResponse.json(
        { error: 'Channel must be "email" or "sms"' },
        { status: 400 }
      );
    }

    const shouldOverrideQuietHours = overrideQuietHours === true;

    let result;
    if (channel === 'email') {
      result = await sendDailyReflectionToUser(userId, dateKey, shouldOverrideQuietHours);
    } else if (channel === 'sms') {
      result = await sendSMSDailyReflection(userId, dateKey, shouldOverrideQuietHours);
    }

    return NextResponse.json({
      success: result.success || false,
      message: result.success
        ? `Test ${channel} sent successfully`
        : result.error || `Failed to send test ${channel}`,
      details: result
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    return NextResponse.json(
      { error: 'Failed to send test notification', details: error.message },
      { status: 500 }
    );
  }
}

