import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getTodayKey } from '@/utils/dateUtils';

/**
 * API handler to fetch today's thought of the day
 *
 * @returns {Object} Today's thought or a fallback if not found
 */
export async function GET() {
  try {
    const { db } = await connectToDatabase();

    // Get today's date in MM-DD format
    const todayKey = getTodayKey();
    const [month, day] = todayKey.split('-').map(num => parseInt(num, 10));

    // Try to find today's thought - check both dateKey and month/day
    let dailyThought = await db.collection('dailyThoughts').findOne({
      $or: [
        { dateKey: todayKey },
        { month, day }
      ]
    });

    // If no thought exists for today, try to find any thought
    if (!dailyThought) {
      dailyThought = await db.collection('dailyThoughts').findOne({ active: true });
    }

    // If still no thought, create a fallback
    if (!dailyThought) {
      dailyThought = {
        title: "Today's Recovery Thought",
        thought: "Recovery is a daily practice of self-awareness, courage, and connection with others on the same journey.",
        challenge: "Take five minutes today to reflect on one positive change in your life since beginning recovery.",
        dateKey: todayKey
      };
    }

    // Return the thought with successful status
    return NextResponse.json({
      success: true,
      data: dailyThought
    });

  } catch (error) {
    console.error('Error fetching daily thought:', error);

    // Return error with appropriate status
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch daily thought'
      },
      { status: 500 }
    );
  }
}