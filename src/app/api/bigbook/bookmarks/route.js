import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  getBigBookCollections,
  BIG_BOOK_EDITION_ID,
  normalizeBookmarkDocument,
  toObjectIdOrString,
} from '@/lib/bigbook/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_LABEL_LENGTH = 120;

function parsePageNumber(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function normalizeLabel(label) {
  if (!label) return null;
  return label.toString().trim().slice(0, MAX_LABEL_LENGTH);
}

function resolveSessionUserId(session) {
  return (
    session?.user?.id ||
    session?.user?.sub ||
    session?.user?.email ||
    null
  );
}

export async function GET(request) {
  try {
    const session = await getSession(request);

    const sessionUserId = resolveSessionUserId(session);

    if (!sessionUserId) {
      return NextResponse.json(
        { error: 'You must be signed in to view bookmarks.' },
        { status: 401 },
      );
    }

    const userId = toObjectIdOrString(sessionUserId);
    const { bookmarks } = await getBigBookCollections();

    const docs = await bookmarks
      .find(
        {
          editionId: BIG_BOOK_EDITION_ID,
          userId,
        },
        {
          sort: { createdAt: -1 },
        },
      )
      .toArray();

    return NextResponse.json({
      bookmarks: docs.map(normalizeBookmarkDocument),
    });
  } catch (error) {
    console.error('Error fetching Big Book bookmarks:', error);
    return NextResponse.json(
      { error: 'Failed to load bookmarks.' },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    console.log('POST /api/bigbook/bookmarks: Request received');

    const session = await getSession(request);
    console.log('Session retrieved:', session ? 'Session found' : 'No session found');

    const sessionUserId = resolveSessionUserId(session);
    console.log('Session user ID:', sessionUserId || 'Not found');

    if (!sessionUserId) {
      console.log('Authentication failed: No user ID in session');
      return NextResponse.json(
        { error: 'You must be signed in to save bookmarks.' },
        { status: 401 },
      );
    }

    const body = await request.json();
    console.log('Request body:', body);

    const pageNumber = parsePageNumber(body?.pageNumber);
    const label = normalizeLabel(body?.label);
    console.log('Parsed pageNumber:', pageNumber, 'Label:', label || 'No label');

    if (!pageNumber) {
      console.log('Validation failed: Invalid page number');
      return NextResponse.json(
        { error: 'A valid pageNumber is required.' },
        { status: 400 },
      );
    }

    const now = new Date();

    // Be extra careful with the user ID conversion
    let userId;
    try {
      userId = toObjectIdOrString(sessionUserId);
      console.log('Using user ID (converted):', userId, 'Type:', typeof userId);
    } catch (idError) {
      console.error('Failed to convert user ID:', idError);
      // Fall back to using the raw string ID
      userId = sessionUserId;
      console.log('Using fallback string user ID:', userId);
    }

    // Extra validation for MongoDB operations
    if (!userId) {
      console.error('User ID is null or undefined after conversion');
      return NextResponse.json(
        { error: 'Invalid user identification.' },
        { status: 400 },
      );
    }

    console.log('Getting MongoDB collections');
    const { bookmarks } = await getBigBookCollections().catch(err => {
      console.error('Failed to get collections:', err);
      throw new Error('Database connection failed');
    });
    console.log('Collections retrieved successfully');

    console.log('Attempting to save bookmark for user:', userId, 'page:', pageNumber);

    // Prepare document for creation/update with proper typing
    const query = {
      editionId: BIG_BOOK_EDITION_ID,
      pageNumber,
    };

    // Add userId with proper type safety
    query.userId = userId;

    // Log the final query object
    console.log('MongoDB query:', JSON.stringify(query));

    // Try a simpler insert approach first if there might be ObjectId issues
    let result;
    try {
      // First check if document already exists
      const existing = await bookmarks.findOne(query);
      console.log('Existing bookmark check:', existing ? 'Found' : 'Not found');

      if (existing) {
        // Update existing document
        result = await bookmarks.findOneAndUpdate(
          query,
          {
            $set: {
              label,
              updatedAt: now,
            },
          },
          { returnDocument: 'after' },
        );
        console.log('Updated existing bookmark');
      } else {
        // Insert new document
        const newDoc = {
          ...query,
          label,
          createdAt: now,
          updatedAt: now,
        };

        const insertResult = await bookmarks.insertOne(newDoc);
        console.log('Insert result:', insertResult.acknowledged ? 'Success' : 'Failed');

        if (insertResult.acknowledged) {
          // Fetch the inserted document
          result = { value: await bookmarks.findOne({ _id: insertResult.insertedId }) };
          console.log('Retrieved newly inserted document');
        }
      }
    } catch (dbOpError) {
      console.error('Direct DB operation failed, error:', dbOpError);
      throw new Error(`Database operation failed: ${dbOpError.message}`);
    }

    console.log('Bookmark operation completed, result:', result ? 'Success' : 'No result');

    if (!result || !result.value) {
      console.warn('No document returned from database operation');
      // Create a minimal document if none returned
      return NextResponse.json({
        bookmark: {
          id: 'pending',
          pageNumber,
          label: label || null,
          createdAt: now,
          editionId: BIG_BOOK_EDITION_ID,
        }
      });
    }

    return NextResponse.json({
      bookmark: normalizeBookmarkDocument(result.value),
    });
  } catch (error) {
    console.error('Error saving Big Book bookmark:', error);
    // More detailed error response
    return NextResponse.json(
      {
        error: 'Failed to save bookmark.',
        details: error.message || 'Unknown error'
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    console.log('DELETE /api/bigbook/bookmarks: Request received');

    const session = await getSession(request);
    console.log('Session retrieved:', session ? 'Session found' : 'No session found');

    const sessionUserId = resolveSessionUserId(session);
    console.log('Session user ID:', sessionUserId || 'Not found');

    if (!sessionUserId) {
      console.log('Authentication failed: No user ID in session');
      return NextResponse.json(
        { error: 'You must be signed in to remove bookmarks.' },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const pageNumber = parsePageNumber(searchParams.get('pageNumber'));
    console.log('Parsed pageNumber from query:', pageNumber);

    if (!pageNumber) {
      console.log('Validation failed: Invalid page number in query');
      return NextResponse.json(
        { error: 'A valid pageNumber query parameter is required.' },
        { status: 400 },
      );
    }

    // Be extra careful with the user ID conversion
    let userId;
    try {
      userId = toObjectIdOrString(sessionUserId);
      console.log('Using user ID (converted):', userId, 'Type:', typeof userId);
    } catch (idError) {
      console.error('Failed to convert user ID:', idError);
      // Fall back to using the raw string ID
      userId = sessionUserId;
      console.log('Using fallback string user ID:', userId);
    }

    // Extra validation for MongoDB operations
    if (!userId) {
      console.error('User ID is null or undefined after conversion');
      return NextResponse.json(
        { error: 'Invalid user identification.' },
        { status: 400 },
      );
    }

    console.log('Getting MongoDB collections');
    const { bookmarks } = await getBigBookCollections().catch(err => {
      console.error('Failed to get collections:', err);
      throw new Error('Database connection failed');
    });
    console.log('Collections retrieved successfully');

    // Prepare delete query with proper typing
    const query = {
      editionId: BIG_BOOK_EDITION_ID,
      pageNumber,
      userId,
    };

    // Log the final query object
    console.log('MongoDB delete query:', JSON.stringify(query));

    console.log('Attempting to delete bookmark for user:', userId, 'page:', pageNumber);

    const result = await bookmarks.deleteOne(query).catch(err => {
      console.error('MongoDB operation failed:', err);
      throw new Error(`Database operation failed: ${err.message}`);
    });

    console.log('Delete operation completed, deletedCount:', result.deletedCount);

    if (!result.deletedCount) {
      console.log('No bookmark found to delete');
      return NextResponse.json(
        { error: 'Bookmark not found.' },
        { status: 404 },
      );
    }

    console.log('Bookmark deleted successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting Big Book bookmark:', error);
    // More detailed error response
    return NextResponse.json(
      {
        error: 'Failed to delete bookmark.',
        details: error.message || 'Unknown error'
      },
      { status: 500 },
    );
  }
}


