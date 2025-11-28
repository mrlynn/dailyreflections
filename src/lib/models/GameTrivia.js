/**
 * Game Trivia helper functions for real-time multiplayer trivia within games
 *
 * This module provides functions for:
 * - Managing trivia sessions within games
 * - Tracking current questions and answers
 * - Managing player scores
 */

import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

const COLLECTION_NAME = 'game_trivia_sessions';

/**
 * Get or create a trivia session for a game
 * @param {string} gameSessionId - The game session ID
 * @param {string} gameType - Type of game (e.g., 'bingo', 'standalone')
 * @returns {Promise<Object>} The trivia session
 */
export async function getOrCreateSession(gameSessionId, gameType = 'bingo') {
  const client = await clientPromise;
  const db = client.db('dailyreflections');
  const collection = db.collection(COLLECTION_NAME);

  let session = await collection.findOne({ gameSessionId });

  if (!session) {
    const now = new Date();
    const newSession = {
      gameSessionId,
      gameType,
      active: true,
      currentQuestion: null,
      questionHistory: [],
      players: [],
      config: {
        questionInterval: 180, // 3 minutes
        pointsPerCorrect: 10,
        firstAnswerBonus: 5,
        answerTimeLimit: 30,
      },
      nextQuestionAt: new Date(now.getTime() + 30000), // First question in 30 seconds
      startedAt: now,
      endedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(newSession);
    session = { ...newSession, _id: result.insertedId };
  }

  return session;
}

/**
 * Get a trivia session by ID
 * @param {string} gameSessionId - The game session ID
 * @returns {Promise<Object|null>} The trivia session or null
 */
export async function getSession(gameSessionId) {
  const client = await clientPromise;
  const db = client.db('dailyreflections');
  return db.collection(COLLECTION_NAME).findOne({ gameSessionId });
}

/**
 * Add or update a player in a trivia session
 * @param {string} gameSessionId - The game session ID
 * @param {string} odal - User ID
 * @param {string} userName - User display name
 * @returns {Promise<Object>} Updated session
 */
export async function addPlayer(gameSessionId, odal, userName) {
  const client = await clientPromise;
  const db = client.db('dailyreflections');
  const collection = db.collection(COLLECTION_NAME);

  // Check if player already exists
  const session = await collection.findOne({
    gameSessionId,
    'players.odal': odal,
  });

  if (session) {
    // Player already exists
    return session;
  }

  // Add new player
  const result = await collection.findOneAndUpdate(
    { gameSessionId },
    {
      $push: {
        players: {
          odal,
          userName,
          score: 0,
          correctAnswers: 0,
          totalAnswers: 0,
          fastestAnswer: null,
        },
      },
      $set: { updatedAt: new Date() },
    },
    { returnDocument: 'after' }
  );

  return result;
}

/**
 * Set a new current question
 * @param {string} gameSessionId - The game session ID
 * @param {Object} question - Question object from sampleTriviaQuestions
 * @returns {Promise<Object>} Updated session
 */
export async function setCurrentQuestion(gameSessionId, question) {
  const client = await clientPromise;
  const db = client.db('dailyreflections');
  const collection = db.collection(COLLECTION_NAME);

  const session = await collection.findOne({ gameSessionId });
  if (!session) return null;

  const now = new Date();
  const currentQuestion = {
    questionId: question.id,
    question: question.question,
    options: question.options,
    correctAnswer: question.correctAnswer,
    category: question.category,
    difficulty: question.difficulty,
    explanation: question.explanation,
    shownAt: now,
    winnerId: null,
    winnerName: null,
    answeredAt: null,
    answers: [],
  };

  // Move old question to history if exists
  const updateOps = {
    $set: {
      currentQuestion,
      nextQuestionAt: new Date(now.getTime() + session.config.questionInterval * 1000),
      updatedAt: now,
    },
  };

  if (session.currentQuestion) {
    updateOps.$push = { questionHistory: session.currentQuestion };
  }

  const result = await collection.findOneAndUpdate(
    { gameSessionId },
    updateOps,
    { returnDocument: 'after' }
  );

  return result;
}

/**
 * Record a player's answer
 * @param {string} gameSessionId - The game session ID
 * @param {string} odal - User ID
 * @param {string} userName - User display name
 * @param {number} answer - Answer index
 * @returns {Promise<Object>} Result with correct, points, etc.
 */
export async function recordAnswer(gameSessionId, odal, userName, answer) {
  const client = await clientPromise;
  const db = client.db('dailyreflections');
  const collection = db.collection(COLLECTION_NAME);

  const session = await collection.findOne({ gameSessionId });

  if (!session) {
    return { success: false, error: 'Session not found' };
  }

  if (!session.currentQuestion) {
    return { success: false, error: 'No active question' };
  }

  // Check if user already answered
  const existingAnswer = session.currentQuestion.answers?.find(a => a.odal === odal);
  if (existingAnswer) {
    return { success: false, error: 'Already answered', alreadyAnswered: true };
  }

  const isCorrect = answer === session.currentQuestion.correctAnswer;
  const answeredAt = new Date();
  const responseTime = answeredAt - new Date(session.currentQuestion.shownAt);

  // Prepare answer record
  const answerRecord = {
    odal,
    userName,
    answer,
    correct: isCorrect,
    answeredAt,
  };

  // Calculate points
  let pointsEarned = 0;
  let isFirstCorrect = false;

  if (isCorrect) {
    pointsEarned = session.config.pointsPerCorrect;

    // Check if first correct answer
    if (!session.currentQuestion.winnerId) {
      pointsEarned += session.config.firstAnswerBonus;
      isFirstCorrect = true;
    }
  }

  // Build update operations
  const updateOps = {
    $push: { 'currentQuestion.answers': answerRecord },
    $set: { updatedAt: new Date() },
  };

  // Update winner if first correct
  if (isFirstCorrect) {
    updateOps.$set['currentQuestion.winnerId'] = odal;
    updateOps.$set['currentQuestion.winnerName'] = userName;
    updateOps.$set['currentQuestion.answeredAt'] = answeredAt;
  }

  // Update player stats
  const playerIndex = session.players.findIndex(p => p.odal === odal);
  if (playerIndex >= 0) {
    updateOps.$inc = {
      [`players.${playerIndex}.totalAnswers`]: 1,
    };

    if (isCorrect) {
      updateOps.$inc[`players.${playerIndex}.correctAnswers`] = 1;
      updateOps.$inc[`players.${playerIndex}.score`] = pointsEarned;
    }
  } else {
    // Add new player
    updateOps.$push.players = {
      odal,
      userName,
      score: pointsEarned,
      correctAnswers: isCorrect ? 1 : 0,
      totalAnswers: 1,
      fastestAnswer: isCorrect ? responseTime : null,
    };
  }

  await collection.updateOne({ gameSessionId }, updateOps);

  // Get updated player score
  const updatedSession = await collection.findOne({ gameSessionId });
  const player = updatedSession.players.find(p => p.odal === odal);

  return {
    success: true,
    correct: isCorrect,
    pointsEarned,
    isFirstCorrect,
    correctAnswer: session.currentQuestion.correctAnswer,
    explanation: session.currentQuestion.explanation,
    responseTime,
    playerScore: player?.score || pointsEarned,
  };
}

/**
 * Get leaderboard for a session
 * @param {string} gameSessionId - The game session ID
 * @param {number} limit - Max number of players to return
 * @returns {Promise<Array>} Leaderboard array
 */
export async function getLeaderboard(gameSessionId, limit = 10) {
  const client = await clientPromise;
  const db = client.db('dailyreflections');
  const session = await db.collection(COLLECTION_NAME).findOne({ gameSessionId });

  if (!session) return [];

  return session.players
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((p, index) => ({
      rank: index + 1,
      odal: p.odal,
      userName: p.userName,
      score: p.score,
      correctAnswers: p.correctAnswers,
      totalAnswers: p.totalAnswers,
    }));
}

/**
 * End the current question
 * @param {string} gameSessionId - The game session ID
 * @returns {Promise<Object>} Updated session
 */
export async function endCurrentQuestion(gameSessionId) {
  const client = await clientPromise;
  const db = client.db('dailyreflections');
  const collection = db.collection(COLLECTION_NAME);

  const session = await collection.findOne({ gameSessionId });
  if (!session || !session.currentQuestion) return session;

  const result = await collection.findOneAndUpdate(
    { gameSessionId },
    {
      $push: { questionHistory: session.currentQuestion },
      $set: {
        currentQuestion: null,
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' }
  );

  return result;
}

/**
 * Update session configuration
 * @param {string} gameSessionId - The game session ID
 * @param {Object} config - Configuration updates
 * @returns {Promise<Object>} Updated session
 */
export async function updateConfig(gameSessionId, config) {
  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const updateFields = {};
  if (config.questionInterval !== undefined) {
    updateFields['config.questionInterval'] = config.questionInterval;
  }
  if (config.pointsPerCorrect !== undefined) {
    updateFields['config.pointsPerCorrect'] = config.pointsPerCorrect;
  }
  if (config.firstAnswerBonus !== undefined) {
    updateFields['config.firstAnswerBonus'] = config.firstAnswerBonus;
  }
  if (config.answerTimeLimit !== undefined) {
    updateFields['config.answerTimeLimit'] = config.answerTimeLimit;
  }
  updateFields.updatedAt = new Date();

  const result = await db.collection(COLLECTION_NAME).findOneAndUpdate(
    { gameSessionId },
    { $set: updateFields },
    { returnDocument: 'after' }
  );

  return result;
}

/**
 * Reset all player scores in a session
 * @param {string} gameSessionId - The game session ID
 * @returns {Promise<Object>} Updated session
 */
export async function resetScores(gameSessionId) {
  const client = await clientPromise;
  const db = client.db('dailyreflections');
  const collection = db.collection(COLLECTION_NAME);

  const session = await collection.findOne({ gameSessionId });
  if (!session) return null;

  const resetPlayers = session.players.map(p => ({
    ...p,
    score: 0,
    correctAnswers: 0,
    totalAnswers: 0,
    fastestAnswer: null,
  }));

  const result = await collection.findOneAndUpdate(
    { gameSessionId },
    {
      $set: {
        players: resetPlayers,
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' }
  );

  return result;
}

/**
 * End a trivia session
 * @param {string} gameSessionId - The game session ID
 * @returns {Promise<Object>} Updated session
 */
export async function endSession(gameSessionId) {
  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const result = await db.collection(COLLECTION_NAME).findOneAndUpdate(
    { gameSessionId },
    {
      $set: {
        active: false,
        currentQuestion: null,
        endedAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' }
  );

  return result;
}
