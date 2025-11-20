import { NextResponse } from 'next/server';
import { sampleTriviaQuestions } from '@/lib/sampleTriviaQuestions';

/**
 * GET /api/trivia/questions
 *
 * Returns trivia questions filtered by category
 * Query parameters:
 * - category: Filter questions by category (optional, defaults to 'random')
 * - count: Number of questions to return (optional, defaults to 5)
 * - difficulty: Filter by difficulty level (optional)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'random';
    const count = parseInt(searchParams.get('count') || '5', 10);
    const difficulty = searchParams.get('difficulty');

    // In a production environment, we'd fetch from MongoDB here
    // For now, we'll use the sample questions
    let filteredQuestions = [...sampleTriviaQuestions];

    // Apply category filter
    if (category !== 'random') {
      filteredQuestions = filteredQuestions.filter(q => q.category === category);

      // If no questions in category, return all questions
      if (filteredQuestions.length === 0) {
        filteredQuestions = [...sampleTriviaQuestions];
      }
    }

    // Apply difficulty filter if specified
    if (difficulty) {
      const difficultyLevel = parseInt(difficulty, 10);
      filteredQuestions = filteredQuestions.filter(q => q.difficulty === difficultyLevel);
    }

    // Shuffle questions
    filteredQuestions.sort(() => Math.random() - 0.5);

    // Limit to requested count
    const selectedQuestions = filteredQuestions.slice(0, count);

    return NextResponse.json({
      success: true,
      questions: selectedQuestions
    });
  } catch (error) {
    console.error('Error fetching trivia questions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trivia questions' },
      { status: 500 }
    );
  }
}