import { NextResponse } from 'next/server';
import { triviaCategories } from '@/lib/sampleTriviaQuestions';

/**
 * GET /api/trivia/categories
 *
 * Returns available trivia categories
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      categories: triviaCategories
    });
  } catch (error) {
    console.error('Error fetching trivia categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trivia categories' },
      { status: 500 }
    );
  }
}