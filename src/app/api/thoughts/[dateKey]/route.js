import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

/**
 * API handler to fetch a thought for a specific date
 *
 * @param {Request} request - The request object
 * @param {Object} params - URL parameters
 * @param {string} params.dateKey - The date key in MM-DD format
 * @returns {Object} The thought for the specified date
 */
export async function GET(request, { params }) {
  try {
    const { dateKey } = params;

    // Validate dateKey format (MM-DD)
    if (!dateKey || !/^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/.test(dateKey)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid date format. Please use MM-DD format.'
        },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Parse month and day from dateKey
    const [month, day] = dateKey.split('-').map(num => parseInt(num, 10));

    // Try to find the thought for the specified date - check both dateKey and month/day
    let dailyThought = await db.collection('dailyThoughts').findOne({
      $or: [
        { dateKey, active: true },
        { month, day, active: true }
      ]
    });

    // Also look for thoughts related to this reflection date
    if (!dailyThought) {
      dailyThought = await db.collection('dailyThoughts').findOne({
        $or: [
          { relatedReflectionDateKey: dateKey, active: true },
          {
            relatedReflectionMonth: month,
            relatedReflectionDay: day,
            active: true
          }
        ]
      });
    }

    // If no thought is found, return a 404
    if (!dailyThought) {
      return NextResponse.json(
        {
          success: false,
          error: 'No thought found for this date'
        },
        { status: 404 }
      );
    }

    // Return the thought with successful status
    return NextResponse.json({
      success: true,
      data: dailyThought
    });

  } catch (error) {
    console.error(`Error fetching thought for date ${params?.dateKey}:`, error);

    // Return error with appropriate status
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch thought'
      },
      { status: 500 }
    );
  }
}