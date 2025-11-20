import { auth } from '@/app/api/auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { getUserJournalEntries } from '@/lib/models/journalEntry';

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
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    const client = await clientPromise;
    const db = client.db('dailyreflections');

    // Collect all user data
    const userData = {
      exportDate: new Date().toISOString(),
      user: {},
      journalEntries: [],
      stepWork: {
        step4: [],
        step8: [],
        step9: [],
      },
      reflections: [],
      meetings: [],
      streakData: null,
    };

    // Get user profile
    const user = await db.collection('users').findOne({
      _id: new ObjectId(userId)
    });

    if (user) {
      // Remove sensitive fields
      const { password, resetPasswordToken, resetPasswordExpires, ...safeUserData } = user;
      userData.user = safeUserData;
    }

    // Get journal entries
    const journalEntries = await getUserJournalEntries({
      userId,
      limit: 10000, // Get all entries
    });
    userData.journalEntries = journalEntries;

    // Get Step 4 inventory entries (using mongoose model collection name)
    const step4Entries = await db.collection('step4s').find({
      userId: new ObjectId(userId)
    }).toArray();
    userData.stepWork.step4 = step4Entries;

    // Get Step 8 amends list (using mongoose model collection name)
    const step8Entries = await db.collection('step8s').find({
      userId: new ObjectId(userId)
    }).toArray();
    userData.stepWork.step8 = step8Entries;

    // Get Step 9 amends made (using mongoose model collection name)
    const step9Entries = await db.collection('step9s').find({
      userId: new ObjectId(userId)
    }).toArray();
    userData.stepWork.step9 = step9Entries;

    // Get streak data
    const streakData = await db.collection('user_streaks').findOne({
      userId: new ObjectId(userId)
    });
    userData.streakData = streakData;

    // Get meetings created by user
    const meetings = await db.collection('meetings').find({
      createdBy: new ObjectId(userId)
    }).toArray();
    userData.meetings = meetings;

    // Get comments/reflections (if any user-specific reflection data exists)
    const comments = await db.collection('comments').find({
      userId: new ObjectId(userId)
    }).toArray();
    userData.reflections = comments;

    if (format === 'json') {
      // Return JSON
      return new Response(JSON.stringify(userData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="my-data-${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    } else if (format === 'pdf') {
      // For PDF, we'd need a PDF generation library
      // For now, return JSON with a note that PDF export is coming soon
      return Response.json(
        { error: 'PDF export is not yet implemented. Please use JSON format.' },
        { status: 501 }
      );
    } else {
      return Response.json(
        { error: 'Invalid format. Use "json" or "pdf".' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error exporting user data:', error);
    return Response.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

