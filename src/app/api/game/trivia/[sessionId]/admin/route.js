import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import {
  getOrCreateSession,
  getSession,
  setCurrentQuestion,
  endCurrentQuestion,
  updateConfig,
  resetScores,
  endSession,
  getLeaderboard,
} from '@/lib/models/GameTrivia';
import { sampleTriviaQuestions } from '@/lib/sampleTriviaQuestions';
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
 * Check if user is admin
 */
async function isAdmin(session) {
  return session?.user?.isAdmin === true || session?.user?.role === 'admin';
}

/**
 * POST /api/game/trivia/[sessionId]/admin
 * Admin controls for trivia session (push question, configure, etc.)
 */
export async function POST(request, { params }) {
  try {
    const session = await auth();
    const { sessionId } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permissions
    if (!await isAdmin(session)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    // Get or create session
    let triviaSession = await getOrCreateSession(sessionId);

    switch (action) {
      case 'pushQuestion': {
        // Push a new trivia question to all players
        const questionId = data.questionId;

        // Get question from pool (or use provided question)
        let question;
        if (questionId) {
          question = sampleTriviaQuestions.find(q => q.id === questionId);
        } else if (data.question) {
          question = data.question;
        } else {
          // Pick a random question not recently used
          const usedIds = (triviaSession.questionHistory || []).slice(-10).map(q => q.questionId);
          const availableQuestions = sampleTriviaQuestions.filter(q => !usedIds.includes(q.id));
          question = availableQuestions.length > 0
            ? availableQuestions[Math.floor(Math.random() * availableQuestions.length)]
            : sampleTriviaQuestions[Math.floor(Math.random() * sampleTriviaQuestions.length)];
        }

        if (!question) {
          return NextResponse.json({ error: 'Question not found' }, { status: 404 });
        }

        // Set new current question
        const updatedSession = await setCurrentQuestion(sessionId, question);

        // Broadcast to all players via Ably
        try {
          const ably = getAblyClient();
          if (ably) {
            const channel = ably.channels.get(`game-trivia:${sessionId}`);
            await channel.publish('trivia:question', {
              question: {
                questionId: question.id,
                question: question.question,
                options: question.options,
                category: question.category,
                difficulty: question.difficulty,
              },
              shownAt: updatedSession?.currentQuestion?.shownAt || new Date(),
              timeLimit: triviaSession.config.answerTimeLimit,
            });
          }
        } catch (ablyError) {
          console.error('Error publishing question to Ably:', ablyError);
        }

        return NextResponse.json({
          success: true,
          message: 'Question pushed to all players',
          questionId: question.id,
        });
      }

      case 'endQuestion': {
        // End the current question (timeout)
        if (!triviaSession.currentQuestion) {
          return NextResponse.json({ error: 'No active question' }, { status: 400 });
        }

        await endCurrentQuestion(sessionId);

        // Broadcast timeout
        try {
          const ably = getAblyClient();
          if (ably) {
            const channel = ably.channels.get(`game-trivia:${sessionId}`);
            await channel.publish('trivia:timeout', {
              message: 'Time expired',
            });
            const nextQuestionAt = triviaSession.nextQuestionAt || new Date(Date.now() + triviaSession.config.questionInterval * 1000);
            await channel.publish('trivia:next', {
              secondsUntil: Math.floor((new Date(nextQuestionAt) - Date.now()) / 1000),
            });
          }
        } catch (ablyError) {
          console.error('Error publishing timeout to Ably:', ablyError);
        }

        return NextResponse.json({
          success: true,
          message: 'Question ended',
        });
      }

      case 'configure': {
        // Update trivia configuration
        const configUpdates = {};
        if (data.questionInterval !== undefined) {
          configUpdates.questionInterval = data.questionInterval;
        }
        if (data.pointsPerCorrect !== undefined) {
          configUpdates.pointsPerCorrect = data.pointsPerCorrect;
        }
        if (data.firstAnswerBonus !== undefined) {
          configUpdates.firstAnswerBonus = data.firstAnswerBonus;
        }
        if (data.answerTimeLimit !== undefined) {
          configUpdates.answerTimeLimit = data.answerTimeLimit;
        }

        const updatedSession = await updateConfig(sessionId, configUpdates);

        return NextResponse.json({
          success: true,
          message: 'Configuration updated',
          config: updatedSession?.config || triviaSession.config,
        });
      }

      case 'resetScores': {
        // Reset all player scores
        await resetScores(sessionId);

        // Broadcast updated scores
        try {
          const ably = getAblyClient();
          if (ably) {
            const channel = ably.channels.get(`game-trivia:${sessionId}`);
            const leaderboard = await getLeaderboard(sessionId, 10);
            await channel.publish('trivia:scores', {
              leaderboard,
            });
          }
        } catch (ablyError) {
          console.error('Error publishing scores to Ably:', ablyError);
        }

        return NextResponse.json({
          success: true,
          message: 'Scores reset',
        });
      }

      case 'endSession': {
        // End the trivia session
        await endSession(sessionId);
        const leaderboard = await getLeaderboard(sessionId, 10);

        return NextResponse.json({
          success: true,
          message: 'Session ended',
          finalLeaderboard: leaderboard,
        });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in trivia admin:', error);
    return NextResponse.json(
      { error: 'Failed to process admin action' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/game/trivia/[sessionId]/admin
 * Get admin view of trivia session (includes all data)
 */
export async function GET(request, { params }) {
  try {
    const session = await auth();
    const { sessionId } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!await isAdmin(session)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const triviaSession = await getSession(sessionId);

    if (!triviaSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      session: triviaSession,
      availableQuestions: sampleTriviaQuestions.length,
      questionsAsked: (triviaSession.questionHistory || []).length,
    });
  } catch (error) {
    console.error('Error fetching admin trivia data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin data' },
      { status: 500 }
    );
  }
}
