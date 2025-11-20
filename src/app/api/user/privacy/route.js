import { auth } from '@/app/api/auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export async function GET(request) {
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

    const user = await db.collection('users').findOne({
      _id: new ObjectId(userId)
    });

    if (!user) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return privacy settings
    return Response.json({
      sponsorVisibility: user.privacy?.sponsorVisibility || {
        shareNightlyInventory: false,
        shareJournalReflections: false,
        shareMilestones: true,
      },
      privacyLockEnabled: user.privacy?.lockEnabled || false,
    });
  } catch (error) {
    console.error('Error fetching privacy settings:', error);
    return Response.json(
      { error: 'Failed to fetch privacy settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id || session.user._id;
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db('dailyreflections');

    const updateData = {};

    if (body.sponsorVisibility) {
      updateData['privacy.sponsorVisibility'] = body.sponsorVisibility;
    }

    if (body.privacyLockEnabled !== undefined) {
      updateData['privacy.lockEnabled'] = body.privacyLockEnabled;
    }

    if (Object.keys(updateData).length === 0) {
      return Response.json(
        { error: 'No valid privacy settings provided' },
        { status: 400 }
      );
    }

    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    return Response.json({
      success: true,
      message: 'Privacy settings updated',
    });
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    return Response.json(
      { error: 'Failed to update privacy settings' },
      { status: 500 }
    );
  }
}

