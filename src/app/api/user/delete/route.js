import { auth } from '@/app/api/auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export async function DELETE(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id || session.user._id;
    const client = await clientPromise;
    const db = client.db('dailyreflections');

    // Check if user already has a deletion scheduled
    const user = await db.collection('users').findOne({
      _id: new ObjectId(userId)
    });

    if (!user) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate deletion date (7 days from now)
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 7);

    // Mark account for deletion instead of deleting immediately
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          'account.deletionScheduled': true,
          'account.deletionDate': deletionDate,
          'account.deletionScheduledAt': new Date(),
        }
      }
    );

    // Log the deletion request
    await db.collection('account_deletions').insertOne({
      userId: new ObjectId(userId),
      scheduledAt: new Date(),
      deletionDate: deletionDate,
      status: 'scheduled',
      canUndo: true,
    });

    return Response.json({
      success: true,
      message: 'Account deletion scheduled. You have 7 days to undo this action by logging in again.',
      deletionDate: deletionDate.toISOString(),
    });
  } catch (error) {
    console.error('Error scheduling account deletion:', error);
    return Response.json(
      { error: 'Failed to schedule account deletion' },
      { status: 500 }
    );
  }
}

