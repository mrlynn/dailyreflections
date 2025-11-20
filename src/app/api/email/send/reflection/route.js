import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { sendDailyReflectionToUser, sendDailyReflectionToAllUsers } from '@/services/emailDeliveryService';

// POST /api/email/send/reflection
// Endpoint to send daily reflection email
export async function POST(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { userId, dateKey, sendToAll } = await request.json();

    // Send to all users if requested (requires admin)
    if (sendToAll) {
      // Check if the user has admin privileges
      if (!session.user.isAdmin) {
        return NextResponse.json({ error: 'Forbidden. Admin rights required to send to all users.' }, { status: 403 });
      }

      const results = await sendDailyReflectionToAllUsers({ dateKey });
      return NextResponse.json(results);
    }

    // Send to a specific user (either the current user or another user if admin)
    const targetUserId = userId || session.user.id;

    // If trying to send to another user, check admin rights
    if (targetUserId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden. Cannot send email to other users.' }, { status: 403 });
    }

    const result = await sendDailyReflectionToUser(targetUserId, dateKey);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send daily reflection email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in reflection email API:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

