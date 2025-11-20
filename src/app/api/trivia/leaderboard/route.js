import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb';

/**
 * GET /api/trivia/leaderboard
 *
 * Retrieves leaderboard scores based on query parameters
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'random';
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const page = parseInt(searchParams.get('page') || '0', 10);
    const userId = searchParams.get('userId');

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('dailyreflections');
    const collection = db.collection('triviaScores');

    // Build query
    const query = {};
    if (category !== 'all') {
      query.category = category;
    }
    if (userId) {
      query.userId = userId;
    }

    // Get scores from database
    const scores = await collection.find(query)
      .sort({ score: -1 }) // Sort by score descending
      .skip(page * limit)
      .limit(limit)
      .toArray();

    // Get total count for pagination
    const totalScores = await collection.countDocuments(query);

    return NextResponse.json({
      success: true,
      scores,
      pagination: {
        page,
        limit,
        total: totalScores,
        totalPages: Math.ceil(totalScores / limit)
      }
    });

  } catch (error) {
    console.error('Error retrieving leaderboard scores:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve leaderboard scores' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/trivia/leaderboard
 *
 * Submits a new score to the leaderboard
 */
export async function POST(request) {
  try {
    const data = await request.json();
    const { displayName, score, category, totalQuestions, difficulty, timeSpent } = data;

    // Validation
    if (!displayName || typeof score !== 'number' || !category || !totalQuestions) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (score < 0 || totalQuestions < 1) {
      return NextResponse.json(
        { success: false, error: 'Invalid score or question count' },
        { status: 400 }
      );
    }

    // Get user ID if logged in
    let userId = null;
    try {
      const session = await auth();
      if (session?.user) {
        userId = session.user.id;
      }
    } catch (error) {
      console.log('Not using authenticated session');
    }

    // Create score entry
    const scoreEntry = {
      displayName,
      userId,
      score,
      category,
      totalQuestions,
      difficulty,
      timeSpent,
      date: new Date()
    };

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('dailyreflections');
    const collection = db.collection('triviaScores');

    // Save to database
    const result = await collection.insertOne(scoreEntry);

    // Get user's ranking
    const userRank = await collection.countDocuments({
      category,
      score: { $gt: score }
    }) + 1;

    // Get top scores for the same category
    const topScores = await collection.find({ category })
      .sort({ score: -1 })
      .limit(5)
      .toArray();

    return NextResponse.json({
      success: true,
      scoreId: result.insertedId,
      rank: userRank,
      topScores
    });

  } catch (error) {
    console.error('Error saving score to leaderboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save score to leaderboard' },
      { status: 500 }
    );
  }
}