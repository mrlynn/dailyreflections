import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getJournalEntryByDate } from '@/lib/models/journalEntry';

/**
 * GET /api/journal/date
 * Retrieves a journal entry for a specific date
 * Requires authentication
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
    const dateParam = searchParams.get('date');

    if (!dateParam) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    // Get journal entry for the specified date
    const entry = await getJournalEntryByDate(userId, dateParam);

    // If no entry found for this date, return empty object (not an error)
    if (!entry) {
      return NextResponse.json({ entry: null });
    }

    return NextResponse.json({ entry });
  } catch (error) {
    console.error('Error fetching journal entry by date:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve journal entry' },
      { status: 500 }
    );
  }
}