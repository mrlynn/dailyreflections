import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import {
  getJournalEntryById,
  updateJournalEntry,
  deleteJournalEntry
} from '@/lib/models/journalEntry';

/**
 * GET /api/journal/[id]
 * Retrieves a specific journal entry by ID
 * Requires authentication and ownership of the entry
 */
export async function GET(request, { params }) {
  try {
    const routeParams = await params;
    const { id } = routeParams || {};
    if (!id) {
      return NextResponse.json(
        { error: 'Journal entry ID is required' },
        { status: 400 }
      );
    }

    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get the entry (with ownership check)
    const entry = await getJournalEntryById(id, userId);
    if (!entry) {
      return NextResponse.json(
        { error: 'Journal entry not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ entry });
  } catch (error) {
    console.error(`Error fetching journal entry ${params?.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to retrieve journal entry' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/journal/[id]
 * Updates an existing journal entry
 * Requires authentication and ownership of the entry
 */
export async function PUT(request, { params }) {
  try {
    const routeParams = await params;
    const { id } = routeParams || {};
    if (!id) {
      return NextResponse.json(
        { error: 'Journal entry ID is required' },
        { status: 400 }
      );
    }

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
    const updates = await request.json();

    // Update the entry (with ownership check)
    try {
      const updatedEntry = await updateJournalEntry(id, updates, userId);
      return NextResponse.json({ entry: updatedEntry });
    } catch (error) {
      if (error.message === 'Journal entry not found or access denied') {
        return NextResponse.json(
          { error: 'Journal entry not found or access denied' },
          { status: 404 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error(`Error updating journal entry ${params?.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to update journal entry' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/journal/[id]
 * Deletes a journal entry
 * Requires authentication and ownership of the entry
 */
export async function DELETE(request, { params }) {
  try {
    const routeParams = await params;
    const { id } = routeParams || {};
    if (!id) {
      return NextResponse.json(
        { error: 'Journal entry ID is required' },
        { status: 400 }
      );
    }

    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Delete the entry (with ownership check)
    const deleted = await deleteJournalEntry(id, userId);
    if (!deleted) {
      return NextResponse.json(
        { error: 'Journal entry not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Journal entry deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error deleting journal entry ${params?.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete journal entry' },
      { status: 500 }
    );
  }
}