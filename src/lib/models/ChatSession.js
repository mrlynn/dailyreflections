/**
 * Chat Session Model
 *
 * Stores metadata for volunteer chat sessions
 */

import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

/**
 * Schema for chat_sessions collection:
 *
 * {
 *   _id: ObjectId,
 *   volunteer_id: ObjectId,     // Volunteer who staffed the chat
 *   user_id: ObjectId,          // User who requested chat
 *   status: String,             // "waiting", "active", "completed", "abandoned", "expired"
 *   start_time: Date,           // When the chat was initiated
 *   end_time: Date,             // When the chat was completed/closed
 *   duration: Number,           // Duration in seconds
 *   messages_count: Number,     // Number of messages exchanged
 *   feedback: {                // User feedback
 *     rating: String,          // "positive", "neutral", "flagged"
 *     comments: String,
 *     submitted_at: Date
 *   },
 *   moderation_flags: Number,   // Count of moderation flags during session
 *   moderation_events: [ObjectId], // References to moderation_events
 *   metadata: {                // Additional metadata about the session
 *     user_device: String,
 *     user_browser: String,
 *     user_ip_hash: String,    // Hashed IP for abuse prevention
 *     user_location: String    // Country/region (not precise)
 *   }
 * }
 */

/**
 * Create a new chat session request
 * @param {string} userId - User ID requesting chat
 * @param {Object} [metadata] - Additional metadata about the session
 * @returns {Promise<Object>} Created chat session
 */
export async function createChatSessionRequest(userId, metadata = {}) {
  if (!userId) throw new Error('User ID is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  // We no longer return existing sessions - always create a new one
  // This ensures that each new chat starts fresh

  // Generate a unique session identifier to differentiate from previous sessions with the same user
  const sessionKey = new ObjectId().toString();

  const session = {
    user_id: typeof userId === 'string' ? new ObjectId(userId) : userId,
    status: 'waiting',
    start_time: new Date(),
    messages_count: 0,
    moderation_flags: 0,
    moderation_events: [],
    session_key: sessionKey, // Add a unique identifier for the session
    metadata: metadata || {}
  };

  const result = await db.collection('chat_sessions').insertOne(session);

  return {
    ...session,
    _id: result.insertedId
  };
}

/**
 * Assign a volunteer to a waiting chat session
 * @param {string} sessionId - Chat session ID
 * @param {string} volunteerId - Volunteer ID
 * @returns {Promise<boolean>} Success status
 */
export async function assignVolunteerToSession(sessionId, volunteerId) {
  if (!sessionId) throw new Error('Session ID is required');
  if (!volunteerId) throw new Error('Volunteer ID is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const session = await db.collection('chat_sessions').findOne({
    _id: typeof sessionId === 'string' ? new ObjectId(sessionId) : sessionId
  });

  if (!session) {
    throw new Error('Chat session not found');
  }

  if (session.status !== 'waiting') {
    throw new Error('Chat session is not in waiting status');
  }

  const result = await db.collection('chat_sessions').updateOne(
    { _id: typeof sessionId === 'string' ? new ObjectId(sessionId) : sessionId },
    {
      $set: {
        volunteer_id: typeof volunteerId === 'string' ? new ObjectId(volunteerId) : volunteerId,
        status: 'active'
      }
    }
  );

  // Update volunteer's active status
  await db.collection('users').updateOne(
    { _id: typeof volunteerId === 'string' ? new ObjectId(volunteerId) : volunteerId },
    {
      $set: {
        'volunteer.lastActive': new Date()
      }
    }
  );

  return result.modifiedCount === 1;
}

/**
 * Get waiting chat session requests
 * @param {number} [limit=10] - Maximum number of sessions to return
 * @returns {Promise<Array>} Array of waiting chat sessions
 */
export async function getWaitingChatSessions(limit = 10) {
  const client = await clientPromise;
  const db = client.db('dailyreflections');

  return await db.collection('chat_sessions')
    .find({ status: 'waiting' })
    .sort({ start_time: 1 }) // Oldest first
    .limit(limit)
    .toArray();
}

/**
 * Get active chat sessions for a volunteer
 * @param {string} volunteerId - Volunteer ID
 * @returns {Promise<Array>} Array of active chat sessions
 */
export async function getActiveVolunteerSessions(volunteerId) {
  if (!volunteerId) throw new Error('Volunteer ID is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  return await db.collection('chat_sessions')
    .find({
      volunteer_id: typeof volunteerId === 'string' ? new ObjectId(volunteerId) : volunteerId,
      status: 'active'
    })
    .sort({ start_time: 1 })
    .toArray();
}

/**
 * Complete a chat session
 * @param {string} sessionId - Chat session ID
 * @returns {Promise<boolean>} Success status
 */
export async function completeChatSession(sessionId) {
  if (!sessionId) throw new Error('Session ID is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const session = await db.collection('chat_sessions').findOne({
    _id: typeof sessionId === 'string' ? new ObjectId(sessionId) : sessionId
  });

  if (!session) {
    throw new Error('Chat session not found');
  }

  if (session.status !== 'active') {
    throw new Error('Chat session is not active');
  }

  const endTime = new Date();
  const duration = Math.floor((endTime.getTime() - session.start_time.getTime()) / 1000);

  const result = await db.collection('chat_sessions').updateOne(
    { _id: typeof sessionId === 'string' ? new ObjectId(sessionId) : sessionId },
    {
      $set: {
        status: 'completed',
        end_time: endTime,
        duration: duration
      }
    }
  );

  // Update volunteer stats
  if (session.volunteer_id) {
    await db.collection('users').updateOne(
      { _id: session.volunteer_id },
      { $inc: { 'volunteer.totalSessionsCompleted': 1 } }
    );
  }

  return result.modifiedCount === 1;
}

/**
 * Resume a chat session by marking it active again
 * @param {string} sessionId - Chat session ID
 * @returns {Promise<boolean>} Success status
 */
export async function resumeChatSession(sessionId) {
  if (!sessionId) throw new Error('Session ID is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const session = await db.collection('chat_sessions').findOne({
    _id: typeof sessionId === 'string' ? new ObjectId(sessionId) : sessionId
  });

  if (!session) {
    throw new Error('Chat session not found');
  }

  if (!session.volunteer_id) {
    throw new Error('Cannot resume session without assigned volunteer');
  }

  if (!['waiting', 'completed', 'abandoned', 'expired'].includes(session.status)) {
    throw new Error('Chat session is already active');
  }

  const result = await db.collection('chat_sessions').updateOne(
    { _id: typeof sessionId === 'string' ? new ObjectId(sessionId) : sessionId },
    {
      $set: {
        status: 'active',
        end_time: null,
      }
    }
  );

  return result.modifiedCount === 1;
}

/**
 * Submit feedback for a chat session
 * @param {string} sessionId - Chat session ID
 * @param {Object} feedback - Feedback data
 * @param {string} feedback.rating - "positive", "neutral", or "flagged"
 * @param {string} feedback.comments - Optional comments
 * @returns {Promise<boolean>} Success status
 */
export async function submitChatFeedback(sessionId, feedback) {
  if (!sessionId) throw new Error('Session ID is required');
  if (!feedback || !feedback.rating) throw new Error('Feedback rating is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const session = await db.collection('chat_sessions').findOne({
    _id: typeof sessionId === 'string' ? new ObjectId(sessionId) : sessionId
  });

  if (!session) {
    throw new Error('Chat session not found');
  }

  // Add submitted timestamp
  feedback.submitted_at = new Date();

  const result = await db.collection('chat_sessions').updateOne(
    { _id: typeof sessionId === 'string' ? new ObjectId(sessionId) : sessionId },
    {
      $set: { feedback }
    }
  );

  // If feedback is flagged, update the volunteer's record
  if (feedback.rating === 'flagged' && session.volunteer_id) {
    await db.collection('users').updateOne(
      { _id: session.volunteer_id },
      { $inc: { 'volunteer.flaggedSessionsCount': 1 } }
    );
  }

  return result.modifiedCount === 1;
}

/**
 * Get chat session by ID
 * @param {string} sessionId - Chat session ID
 * @returns {Promise<Object|null>} Chat session or null if not found
 */
export async function getChatSessionById(sessionId) {
  if (!sessionId) throw new Error('Session ID is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  return await db.collection('chat_sessions').findOne({
    _id: typeof sessionId === 'string' ? new ObjectId(sessionId) : sessionId
  });
}

/**
 * Update message count for a session
 * @param {string} sessionId - Chat session ID
 * @param {number} count - Number of messages to add
 * @returns {Promise<boolean>} Success status
 */
export async function updateMessageCount(sessionId, count = 1) {
  if (!sessionId) throw new Error('Session ID is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const result = await db.collection('chat_sessions').updateOne(
    { _id: typeof sessionId === 'string' ? new ObjectId(sessionId) : sessionId },
    { $inc: { messages_count: count } }
  );

  return result.modifiedCount === 1;
}

/**
 * Set typing status for a participant in a chat session
 * @param {string} sessionId - Chat session ID
 * @param {'user' | 'volunteer'} actor - Which participant is typing
 * @param {boolean} isTyping - Whether typing is active
 * @param {number} [ttlMs=4000] - How long the typing indicator should stay active
 * @returns {Promise<void>}
 */
export async function setTypingStatus(sessionId, actor, isTyping, ttlMs = 4000) {
  if (!sessionId) throw new Error('Session ID is required');
  if (!['user', 'volunteer'].includes(actor)) throw new Error('Actor must be "user" or "volunteer"');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const sessionObjectId = typeof sessionId === 'string' ? new ObjectId(sessionId) : sessionId;
  const fieldPath = `typing_status.${actor}`;

  const update = isTyping
    ? {
        $set: {
          [fieldPath]: {
            until: new Date(Date.now() + ttlMs),
            updated_at: new Date()
          }
        }
      }
    : {
        $unset: {
          [fieldPath]: ''
        }
      };

  await db.collection('chat_sessions').updateOne({ _id: sessionObjectId }, update);
}

/**
 * Get the current typing status for a chat session
 * @param {string} sessionId - Chat session ID
 * @returns {Promise<{ user: boolean, volunteer: boolean }>}
 */
export async function getTypingStatus(sessionId) {
  if (!sessionId) throw new Error('Session ID is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const sessionObjectId = typeof sessionId === 'string' ? new ObjectId(sessionId) : sessionId;

  const session = await db.collection('chat_sessions').findOne(
    { _id: sessionObjectId },
    { projection: { typing_status: 1 } }
  );

  const now = new Date();
  const status = { user: false, volunteer: false };

  const userTyping = session?.typing_status?.user;
  const volunteerTyping = session?.typing_status?.volunteer;

  if (userTyping?.until && userTyping.until > now) {
    status.user = true;
  } else if (userTyping) {
    await db.collection('chat_sessions').updateOne(
      { _id: sessionObjectId },
      { $unset: { 'typing_status.user': '' } }
    );
  }

  if (volunteerTyping?.until && volunteerTyping.until > now) {
    status.volunteer = true;
  } else if (volunteerTyping) {
    await db.collection('chat_sessions').updateOne(
      { _id: sessionObjectId },
      { $unset: { 'typing_status.volunteer': '' } }
    );
  }

  return status;
}

/**
 * Get sessions that have been abandoned or expired
 * @returns {Promise<Array>} Array of abandoned/expired sessions
 */
export async function getStaleActiveSessions() {
  const client = await clientPromise;
  const db = client.db('dailyreflections');

  // Get sessions that have been inactive for more than 30 minutes
  const cutoffTime = new Date();
  cutoffTime.setMinutes(cutoffTime.getMinutes() - 30);

  return await db.collection('chat_sessions')
    .find({
      status: { $in: ['waiting', 'active'] },
      start_time: { $lt: cutoffTime }
    })
    .toArray();
}