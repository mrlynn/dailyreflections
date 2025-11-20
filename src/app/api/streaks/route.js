import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { initMongoose } from '@/lib/mongoose';
import {
  getUserStreak,
  updateUserStreak,
  recoverUserStreak,
  awardStreakFreeze
} from '@/lib/models/userStreak';

/**
 * GET /api/streaks
 * Get a user's streak information
 *
 * Query parameters:
 * - journalType: The type of journal ('step10', 'journal', 'gratitude'), defaults to 'step10'
 */
export async function GET(request) {
  try {
    // Initialize Mongoose
    await initMongoose();

    // Get authenticated user
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const url = new URL(request.url);
    const journalType = url.searchParams.get('journalType') || 'step10';

    // Get streak information
    const streak = await getUserStreak(userId, journalType);

    return NextResponse.json({ streak });
  } catch (error) {
    console.error('Error in streaks GET route:', error);
    return NextResponse.json({ error: 'Failed to retrieve streak information' }, { status: 500 });
  }
}

/**
 * POST /api/streaks
 * Update a user's streak based on a new journal entry
 *
 * Required body parameters:
 * - entryId: The ID of the new journal entry
 *
 * Optional body parameters:
 * - journalType: The type of journal ('step10', 'journal', 'gratitude'), defaults to 'step10'
 */
export async function POST(request) {
  try {
    // Initialize Mongoose
    await initMongoose();

    // Get authenticated user
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    // Validate required parameters
    if (!body.entryId) {
      return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 });
    }

    const journalType = body.journalType || 'step10';

    // Update streak with new entry
    const updatedStreak = await updateUserStreak(userId, body.entryId, journalType);

    return NextResponse.json({
      message: 'Streak updated successfully',
      streak: updatedStreak
    });
  } catch (error) {
    console.error('Error in streaks POST route:', error);
    return NextResponse.json({ error: 'Failed to update streak' }, { status: 500 });
  }
}

/**
 * PUT /api/streaks
 * Perform streak actions like recovery or awarding streak freezes
 *
 * Required body parameters:
 * - action: The action to perform ('recover' or 'award_freeze')
 *
 * Optional body parameters:
 * - journalType: The type of journal ('step10', 'journal', 'gratitude'), defaults to 'step10'
 * - recoveryReason: Reason for recovery (required when action is 'recover')
 */
export async function PUT(request) {
  try {
    // Initialize Mongoose
    await initMongoose();

    // Get authenticated user
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    // Validate required parameters
    if (!body.action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    const journalType = body.journalType || 'step10';

    let result;

    // Perform the requested action
    switch (body.action) {
      case 'recover':
        if (!body.recoveryReason) {
          return NextResponse.json({ error: 'Recovery reason is required' }, { status: 400 });
        }
        result = await recoverUserStreak(userId, journalType, body.recoveryReason);
        return NextResponse.json({
          message: 'Streak recovered successfully',
          streak: result
        });

      case 'award_freeze':
        result = await awardStreakFreeze(userId, journalType);
        return NextResponse.json({
          message: 'Streak freeze awarded successfully',
          streak: result
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in streaks PUT route:', error);

    // Handle specific error messages from the streak functions
    if (error.message === 'No streak found to recover' ||
        error.message === 'Streak is not broken and does not need recovery' ||
        error.message === 'No recovery options available') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to process streak action' }, { status: 500 });
  }
}