import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import {
  getUserJournalEntries,
  createJournalEntry
} from '@/lib/models/journalEntry';

/**
 * GET /api/journal
 * Retrieves journal entries for the authenticated user
 * Supports pagination, date range filtering, and tag filtering
 */
export async function GET(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30');
    const skip = parseInt(searchParams.get('skip') || '0');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const tag = searchParams.get('tag');
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    // Get journal entries
    const entries = await getUserJournalEntries({
      userId,
      startDate,
      endDate,
      limit,
      skip,
      tag,
      sortBy,
      sortOrder
    });

    console.log(`[Journal API] Retrieved ${entries.length} entries for user ${userId}`);
    if (entries.length > 0) {
      console.log(`[Journal API] First entry date type: ${typeof entries[0].date}, value: ${entries[0].date}`);
    }

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve journal entries' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/journal
 * Creates a new journal entry
 * Requires authentication
 */
export async function POST(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Parse request body
    const entryData = await request.json();

    // Validate required fields
    if (!entryData.date) {
      return NextResponse.json(
        { error: 'Missing required field: date' },
        { status: 400 }
      );
    }

    // Set the user ID from the session
    entryData.userId = userId;

    // Log the entry data for debugging
    console.log(`[Journal API] Creating entry for user ${userId}, date: ${entryData.date}, type: ${typeof entryData.date}`);

    // Create the entry
    const entry = await createJournalEntry(entryData);
    
    console.log(`[Journal API] Entry created successfully with ID: ${entry._id}`);

    return NextResponse.json(
      { message: 'Journal entry created successfully', entry },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating journal entry:', error);
    return NextResponse.json(
      { error: 'Failed to create journal entry' },
      { status: 500 }
    );
  }
}