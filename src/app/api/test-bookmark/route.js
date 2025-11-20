/**
 * Test endpoint to troubleshoot bookmark creation
 */
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { BIG_BOOK_EDITION_ID } from '@/lib/bigbook/config';
import { toObjectIdOrString } from '@/lib/bigbook/service';
import { ObjectId } from 'mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function resolveSessionUserId(session) {
  const id = session?.user?.id || session?.user?.sub || session?.user?.email || null;
  console.log('Resolved session user ID:', id);
  return id;
}

export async function POST(request) {
  try {
    console.log('Test Bookmark API: Request received');

    // Stage 1: Authentication check
    console.log('Stage 1: Checking authentication');
    const session = await getSession(request);
    const hasSession = !!session;
    console.log('Session found:', hasSession);

    const sessionUserId = resolveSessionUserId(session);
    const isAuthenticated = !!sessionUserId;
    console.log('User authenticated:', isAuthenticated);

    if (!isAuthenticated) {
      return NextResponse.json({
        success: false,
        stage: 'authentication',
        error: 'Authentication failed - no valid user ID in session',
        session: session ? {
          hasUser: !!session.user,
          hasId: !!(session.user?.id || session.user?.sub),
          hasEmail: !!session.user?.email,
        } : 'No session'
      }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    console.log('Request body:', body);

    const pageNumber = Number.parseInt(body?.pageNumber, 10);
    if (Number.isNaN(pageNumber) || pageNumber <= 0) {
      return NextResponse.json({
        success: false,
        stage: 'validation',
        error: 'Invalid page number provided'
      }, { status: 400 });
    }

    // Stage 2: MongoDB connection
    console.log('Stage 2: Testing MongoDB connection');
    let client;
    let db;

    try {
      client = await clientPromise;
      db = client.db('dailyreflections');
      console.log('MongoDB connection successful');
    } catch (dbError) {
      console.error('MongoDB connection failed:', dbError);
      return NextResponse.json({
        success: false,
        stage: 'database_connection',
        error: 'Failed to connect to database',
        details: dbError.message
      }, { status: 500 });
    }

    // Stage 3: Test collection access
    console.log('Stage 3: Testing collection access');
    let bookmarks;

    try {
      bookmarks = db.collection('user_bigbook_bookmarks');
      const count = await bookmarks.countDocuments();
      console.log('Bookmarks collection accessible, document count:', count);
    } catch (collectionError) {
      console.error('Collection access failed:', collectionError);
      return NextResponse.json({
        success: false,
        stage: 'collection_access',
        error: 'Failed to access bookmarks collection',
        details: collectionError.message
      }, { status: 500 });
    }

    // Stage 4: Test document creation
    console.log('Stage 4: Testing bookmark creation');
    const userId = toObjectIdOrString(sessionUserId);
    const now = new Date();

    try {
      // First check if a bookmark already exists
      const existing = await bookmarks.findOne({
        editionId: BIG_BOOK_EDITION_ID,
        userId,
        pageNumber
      });

      console.log('Existing bookmark check:', existing ? 'Found' : 'Not found');

      // Attempt to create or update bookmark
      const result = await bookmarks.findOneAndUpdate(
        {
          editionId: BIG_BOOK_EDITION_ID,
          userId,
          pageNumber,
        },
        {
          $set: {
            updatedAt: now,
          },
          $setOnInsert: {
            createdAt: now,
            editionId: BIG_BOOK_EDITION_ID,
          },
        },
        {
          upsert: true,
          returnDocument: 'after',
        }
      );

      console.log('Database operation result:', result ? 'Success' : 'No result');

      // Check the result
      if (!result || !result.value) {
        return NextResponse.json({
          success: false,
          stage: 'document_creation',
          error: 'Operation did not return expected document',
          result: typeof result === 'object' ? Object.keys(result) : typeof result
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Bookmark created successfully',
        bookmark: {
          id: result.value._id.toString(),
          pageNumber: result.value.pageNumber,
          createdAt: result.value.createdAt,
          updatedAt: result.value.updatedAt,
        }
      });

    } catch (opError) {
      console.error('Database operation failed:', opError);
      return NextResponse.json({
        success: false,
        stage: 'document_operation',
        error: 'Failed to create or update bookmark',
        details: opError.message,
        stack: process.env.NODE_ENV === 'development' ? opError.stack : undefined
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Test bookmark failed:', error);
    return NextResponse.json({
      success: false,
      stage: 'unexpected_error',
      error: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}