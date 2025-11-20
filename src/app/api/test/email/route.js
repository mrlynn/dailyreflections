import { NextResponse } from 'next/server';
import { sendDailyReflectionToUser } from '@/services/emailDeliveryService';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * Test endpoint for sending a daily reflection email
 * This is for development testing only and should be removed or secured in production
 *
 * @route GET /api/test/email
 */
export async function GET(request) {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    // Get the user ID from query params, defaulting to first user if not specified
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get('userId');
    const dateKey = searchParams.get('dateKey') || null; // Optional date key override

    // If no userId provided, get the first user from the database
    if (!userId) {
      const client = await clientPromise;
      const db = client.db();

      const firstUser = await db.collection('users')
        .findOne({
          email: { $exists: true, $ne: null, $ne: '' }
        });

      if (!firstUser) {
        return NextResponse.json({ error: 'No users found in the database' }, { status: 404 });
      }

      userId = firstUser._id.toString();
    }

    // Send the email
    console.log(`Sending test email to user ${userId} for date ${dateKey || 'today'}`);
    const result = await sendDailyReflectionToUser(userId, dateKey, true); // Override quiet hours

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Test email sent successfully' : 'Failed to send test email',
      details: result
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send test email' },
      { status: 500 }
    );
  }
}