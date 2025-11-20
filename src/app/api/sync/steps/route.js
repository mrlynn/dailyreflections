import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { syncStep8ToStep9, updateStep8FromStep9, checkSyncNeeded } from '@/lib/syncSteps';

/**
 * GET: Check if synchronization between Step 8 and Step 9 is needed
 */
export async function GET(request) {
  try {
    const session = await auth();

    // Check authentication
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const syncNeeded = await checkSyncNeeded(session.user.id);

    return NextResponse.json({
      syncNeeded,
      message: syncNeeded ?
        'Synchronization needed between Step 8 and Step 9' :
        'No synchronization needed'
    });
  } catch (error) {
    console.error('Error checking sync status:', error);
    return NextResponse.json(
      { error: 'Failed to check synchronization status' },
      { status: 500 }
    );
  }
}

/**
 * POST: Synchronize entries from Step 8 to Step 9
 */
export async function POST(request) {
  try {
    const session = await auth();

    // Check authentication
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { direction, entryId } = data;

    if (direction === 'step8-to-step9') {
      // Sync all eligible entries from Step 8 to Step 9
      const syncResult = await syncStep8ToStep9(session.user.id);
      return NextResponse.json(syncResult);
    } else if (direction === 'step9-to-step8' && entryId) {
      // Update a specific Step 8 entry based on Step 9 changes
      const updateResult = await updateStep8FromStep9(session.user.id, entryId);
      return NextResponse.json(updateResult);
    } else {
      return NextResponse.json(
        { error: 'Invalid synchronization request' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in synchronization:', error);
    return NextResponse.json(
      { error: 'Failed to synchronize steps' },
      { status: 500 }
    );
  }
}