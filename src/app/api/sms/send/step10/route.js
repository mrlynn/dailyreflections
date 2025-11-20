import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { sendStep10ReminderToUser } from '@/services/smsDeliveryService';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// POST /api/sms/send/step10
// Endpoint to send Step 10 reminder SMS
export async function POST(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { userId, sendToAll } = await request.json();

    // Send to all eligible users (requires admin)
    if (sendToAll) {
      // Check if the user has admin privileges
      if (!session.user.isAdmin) {
        return NextResponse.json({ error: 'Forbidden. Admin rights required to send to all users.' }, { status: 403 });
      }

      // Find all users with SMS enabled for Step 10 reminders
      const client = await clientPromise;
      const db = client.db();
      const eligibleUsers = await db.collection('userSMSPreferences')
        .find({
          'phoneNumber': { $exists: true, $ne: null },
          'preferences.enabled': true,
          'preferences.step10Reminder': true
        })
        .toArray();

      console.log(`Found ${eligibleUsers.length} eligible users for Step 10 SMS reminders`);

      // Results tracking
      const results = {
        total: eligibleUsers.length,
        sent: 0,
        failed: 0,
        skipped: 0,
        quietHours: 0,
        errors: []
      };

      // Send to each eligible user
      for (const user of eligibleUsers) {
        const result = await sendStep10ReminderToUser(user.userId.toString());

        if (result.success) {
          results.sent++;
        } else {
          if (result.quietHours) {
            results.quietHours++;
            results.skipped++;
          } else {
            results.failed++;
            results.errors.push({
              userId: user.userId.toString(),
              error: result.error
            });
          }
        }

        // Add a small delay between sends to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return NextResponse.json(results);
    }

    // Send to a specific user (either the current user or another user if admin)
    const targetUserId = userId || session.user.id;

    // If trying to send to another user, check admin rights
    if (targetUserId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden. Cannot send SMS to other users.' }, { status: 403 });
    }

    const result = await sendStep10ReminderToUser(targetUserId);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send Step 10 reminder' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in Step 10 reminder SMS API:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}