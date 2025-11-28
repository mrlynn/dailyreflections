import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import {
  getOrCreateSession,
  getSession,
  addPlayer,
  getLeaderboard,
} from '@/lib/models/GameTrivia';

/**
 * GET /api/game/trivia/[sessionId]
 * Get the current state of a trivia session
 */
export async function GET(request, { params }) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Get or create session
    let session = await getSession(sessionId);

    if (!session) {
      session = await getOrCreateSession(sessionId);
    }

    // Get leaderboard
    const leaderboard = await getLeaderboard(sessionId, 10);

    // Prepare response (don't include correct answer if question is active)
    const response = {
      gameSessionId: session.gameSessionId,
      active: session.active,
      nextQuestionAt: session.nextQuestionAt,
      leaderboard,
      config: {
        questionInterval: session.config.questionInterval,
        answerTimeLimit: session.config.answerTimeLimit,
      },
    };

    // Include current question if one is active
    if (session.currentQuestion) {
      const hasWinner = !!session.currentQuestion.winnerId;
      const isExpired = session.currentQuestion.shownAt &&
        (Date.now() - new Date(session.currentQuestion.shownAt).getTime() > session.config.answerTimeLimit * 1000);

      response.currentQuestion = {
        questionId: session.currentQuestion.questionId,
        question: session.currentQuestion.question,
        options: session.currentQuestion.options,
        category: session.currentQuestion.category,
        difficulty: session.currentQuestion.difficulty,
        shownAt: session.currentQuestion.shownAt,
        // Only include answer info if question is resolved
        ...(hasWinner || isExpired ? {
          correctAnswer: session.currentQuestion.correctAnswer,
          explanation: session.currentQuestion.explanation,
          winnerId: session.currentQuestion.winnerId,
          winnerName: session.currentQuestion.winnerName,
        } : {}),
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching trivia session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trivia session' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/game/trivia/[sessionId]
 * Join a trivia session (register as a player)
 */
export async function POST(request, { params }) {
  try {
    const session = await auth();
    const { sessionId } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Get or create session
    await getOrCreateSession(sessionId);

    // Add player to session
    await addPlayer(
      sessionId,
      session.user.id,
      session.user.displayName || session.user.name || 'Anonymous'
    );

    // Get leaderboard
    const leaderboard = await getLeaderboard(sessionId, 10);

    return NextResponse.json({
      success: true,
      message: 'Joined trivia session',
      leaderboard,
    });
  } catch (error) {
    console.error('Error joining trivia session:', error);
    return NextResponse.json(
      { error: 'Failed to join trivia session' },
      { status: 500 }
    );
  }
}
