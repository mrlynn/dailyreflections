import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { auth } from '@/app/api/auth/[...nextauth]/route';

/**
 * API handler to create or update a daily thought
 * Admin use only - requires authentication with admin role
 *
 * @param {Request} request - The request object with thought data
 * @returns {Object} Result of the operation
 */
export async function POST(request) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const thoughtData = await request.json();

    // Basic validation
    if (!thoughtData.month || !thoughtData.day || !thoughtData.title || !thoughtData.thought) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: month, day, title, and thought are required'
        },
        { status: 400 }
      );
    }

    // Ensure month and day are valid
    const month = parseInt(thoughtData.month, 10);
    const day = parseInt(thoughtData.day, 10);
    if (isNaN(month) || month < 1 || month > 12 || isNaN(day) || day < 1 || day > 31) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid month or day values'
        },
        { status: 400 }
      );
    }

    // Format dateKey
    const dateKey = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const { db } = await connectToDatabase();

    // Prepare thought object
    const thought = {
      ...thoughtData,
      month,
      day,
      dateKey,
      active: thoughtData.active !== false, // Default to active if not specified
      updatedAt: new Date()
    };

    // If _id is provided, update existing thought
    if (thoughtData._id) {
      const { ObjectId } = require('mongodb');
      const result = await db.collection('dailyThoughts').updateOne(
        { _id: new ObjectId(thoughtData._id) },
        { $set: thought }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Thought not found'
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Thought updated successfully',
        data: { ...thought, _id: thoughtData._id }
      });
    }

    // Otherwise, check if a thought already exists for this date
    const existingThought = await db.collection('dailyThoughts').findOne({
      $or: [
        { dateKey },
        { month, day }
      ]
    });

    if (existingThought) {
      // Update existing thought
      const result = await db.collection('dailyThoughts').updateOne(
        { _id: existingThought._id },
        { $set: { ...thought, createdAt: existingThought.createdAt } }
      );

      return NextResponse.json({
        success: true,
        message: 'Thought updated successfully',
        data: { ...thought, _id: existingThought._id }
      });
    } else {
      // Create new thought
      thought.createdAt = new Date();
      const result = await db.collection('dailyThoughts').insertOne(thought);

      return NextResponse.json({
        success: true,
        message: 'Thought created successfully',
        data: { ...thought, _id: result.insertedId }
      });
    }

  } catch (error) {
    console.error('Error creating/updating thought:', error);

    // Return error with appropriate status
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create/update thought'
      },
      { status: 500 }
    );
  }
}

/**
 * API handler to delete a daily thought
 * Admin use only - requires authentication with admin role
 *
 * @param {Request} request - The request object with thought ID
 * @returns {Object} Result of the operation
 */
export async function DELETE(request) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    if (!data._id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing thought ID'
        },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const { ObjectId } = require('mongodb');

    const result = await db.collection('dailyThoughts').deleteOne({
      _id: new ObjectId(data._id)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Thought not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Thought deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting thought:', error);

    // Return error with appropriate status
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete thought'
      },
      { status: 500 }
    );
  }
}