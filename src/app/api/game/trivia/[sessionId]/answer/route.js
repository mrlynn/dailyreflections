import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getSession, recordAnswer, getLeaderboard } from '@/lib/models/GameTrivia';
import Ably from 'ably';

// Initialize Ably for publishing events
let ablyClient = null;

function getAblyClient() {
  if (!ablyClient && process.env.ABLY_API_KEY) {
    ablyClient = new Ably.Realtime(process.env.ABLY_API_KEY);
  }
  return ablyClient;
}

/**
 * POST /api/game/trivia/[sessionId]/answer
 * Submit an answer to the current trivia question
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

    const body = await request.json();
    const { answer } = body;

    if (typeof answer !== 'number') {
      return NextResponse.json({ error: 'Answer index required' }, { status: 400 });
    }

    // Get the trivia session
    const triviaSession = await getSession(sessionId);

    if (!triviaSession) {
      return NextResponse.json({ error: 'Trivia session not found' }, { status: 404 });
    }

    if (!triviaSession.currentQuestion) {
      return NextResponse.json({ error: 'No active question' }, { status: 400 });
    }

    // Check if time has expired
    const timeElapsed = Date.now() - new Date(triviaSession.currentQuestion.shownAt).getTime();
    if (timeElapsed > triviaSession.config.answerTimeLimit * 1000) {
      return NextResponse.json({ error: 'Time expired' }, { status: 400 });
    }

    // Record the answer
    const odal = session.user.id;
    const userName = session.user.displayName || session.user.name || 'Anonymous';

    const result = await recordAnswer(sessionId, odal, userName, answer);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // If this was the first correct answer, broadcast to all players
    if (result.isFirstCorrect) {
      try {
        const ably = getAblyClient();
        if (ably) {
          const channel = ably.channels.get(`game-trivia:${sessionId}`);
          await channel.publish('trivia:answered', {
            odal: odal,
            userName: userName,
            responseTime: result.responseTime,
            questionId: triviaSession.currentQuestion.questionId,
          });

          // Also send updated scores
          const leaderboard = await getLeaderboard(sessionId, 10);
          await channel.publish('trivia:scores', {
            leaderboard,
          });
        }
      } catch (ablyError) {
        console.error('Error publishing to Ably:', ablyError);
        // Don't fail the request if Ably fails
      }
    }

    return NextResponse.json({
      success: true,
      correct: result.correct,
      pointsEarned: result.pointsEarned,
      isFirstCorrect: result.isFirstCorrect,
      correctAnswer: result.correctAnswer,
      explanation: result.explanation,
      responseTime: result.responseTime,
      playerScore: result.playerScore,
    });
  } catch (error) {
    console.error('Error submitting trivia answer:', error);
    return NextResponse.json(
      { error: 'Failed to submit answer' },
      { status: 500 }
    );
  }
}
