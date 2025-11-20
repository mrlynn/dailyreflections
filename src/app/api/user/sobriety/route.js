import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * GET /api/user/sobriety
 * Retrieves the user's sobriety date
 * Supports both old schema (sobrietyDate at root) and new schema (sobriety.date)
 */
export async function GET() {
  try {
    const session = await auth();

    // Require authentication
    if (!session?.user) {
      return NextResponse.json(
        {
          error: 'You must be signed in to access sobriety information.',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db('dailyreflections');

    // Get user from database - check both old and new schema
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(session.user.id) },
      { projection: { sobrietyDate: 1, sobriety: 1 } }
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found.' },
        { status: 404 }
      );
    }

    // Return sobriety date from new schema (sobriety.date) or fallback to old schema (sobrietyDate)
    const sobrietyDate = user.sobriety?.date || user.sobrietyDate || null;
    
    return NextResponse.json({
      sobrietyDate: sobrietyDate,
      timezone: user.sobriety?.timezone || null
    });
  } catch (error) {
    console.error('Error retrieving sobriety date:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve sobriety information.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/sobriety
 * Updates user's sobriety date
 */
export async function PUT(request) {
  try {
    const session = await auth();

    // Require authentication
    if (!session?.user) {
      return NextResponse.json(
        {
          error: 'You must be signed in to update sobriety information.',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sobrietyDate } = body;

    // Validate sobriety date
    if (sobrietyDate !== null) {
      // Check if it's a valid date
      const dateObj = new Date(sobrietyDate);
      if (isNaN(dateObj.getTime())) {
        return NextResponse.json(
          { error: 'Invalid sobriety date format.' },
          { status: 400 }
        );
      }

      // Check that date is not in the future
      const currentDate = new Date();
      if (dateObj > currentDate) {
        return NextResponse.json(
          { error: 'Sobriety date cannot be in the future.' },
          { status: 400 }
        );
      }
    }

    // Connect to database
    const client = await clientPromise;
    const db = client.db('dailyreflections');

    // Update user's sobriety date using new schema (sobriety.date)
    // Also remove old sobrietyDate field if it exists
    const updateData = {
      'sobriety.date': sobrietyDate ? new Date(sobrietyDate) : null
    };

    // If timezone is provided, update it too
    if (body.timezone) {
      updateData['sobriety.timezone'] = body.timezone;
    }

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(session.user.id) },
      {
        $set: updateData,
        $unset: { sobrietyDate: "" } // Remove old schema field
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'User not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Sobriety date updated successfully.',
      sobrietyDate: sobrietyDate,
      timezone: body.timezone || null
    });
  } catch (error) {
    console.error('Error updating sobriety date:', error);
    return NextResponse.json(
      { error: 'Failed to update sobriety information.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/sobriety
 * Removes user's sobriety date
 */
export async function DELETE() {
  try {
    const session = await auth();

    // Require authentication
    if (!session?.user) {
      return NextResponse.json(
        {
          error: 'You must be signed in to remove sobriety information.',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db('dailyreflections');

    // Remove user's sobriety date from both old and new schema
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(session.user.id) },
      { 
        $unset: { 
          sobrietyDate: "",  // Remove old schema
          'sobriety.date': "",  // Remove new schema
          'sobriety.timezone': ""  // Remove timezone too
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'User not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Sobriety date removed successfully.'
    });
  } catch (error) {
    console.error('Error removing sobriety date:', error);
    return NextResponse.json(
      { error: 'Failed to remove sobriety information.' },
      { status: 500 }
    );
  }
}