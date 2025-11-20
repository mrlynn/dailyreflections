/**
 * Moderation Event Model
 *
 * Stores moderation events for chat messages
 */

import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

/**
 * Schema for moderation_events collection:
 *
 * {
 *   _id: ObjectId,
 *   session_id: ObjectId,      // Reference to chat_session
 *   user_id: ObjectId,         // User who sent the message
 *   volunteer_id: ObjectId,    // Volunteer in the chat
 *   message_text: String,      // Original message text (encrypted/hashed for privacy)
 *   message_direction: String, // "user_to_volunteer" or "volunteer_to_user"
 *   flag_type: String,         // "hate", "harassment", "sexual", "violence", "self_harm", etc.
 *   flag_score: Number,        // Severity score (0-1)
 *   flag_source: String,       // "ai", "user_report", "admin_review"
 *   created_at: Date,
 *   reviewed: Boolean,
 *   reviewed_at: Date,
 *   reviewed_by: ObjectId,
 *   resolution: String,        // "warning", "session_ended", "volunteer_suspended", "false_positive"
 *   resolution_notes: String   // Notes from admin review
 * }
 */

/**
 * Create a moderation event for a message
 * @param {Object} eventData - Moderation event data
 * @param {string} eventData.session_id - Chat session ID
 * @param {string} eventData.user_id - User ID
 * @param {string} eventData.volunteer_id - Volunteer ID
 * @param {string} eventData.message_text - Original message text (will be encrypted/hashed)
 * @param {string} eventData.message_direction - "user_to_volunteer" or "volunteer_to_user"
 * @param {string} eventData.flag_type - Type of content flag
 * @param {number} eventData.flag_score - Severity score (0-1)
 * @param {string} eventData.flag_source - Source of the flag
 * @returns {Promise<Object>} Created moderation event
 */
export async function createModerationEvent(eventData) {
  if (!eventData.session_id) throw new Error('Chat session ID is required');
  if (!eventData.message_text) throw new Error('Message text is required');
  if (!eventData.flag_type) throw new Error('Flag type is required');
  if (!eventData.message_direction) throw new Error('Message direction is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  // TODO: In production, implement proper encryption/hashing of message text
  // For now, we'll store the plain text for development purposes
  const messageToStore = eventData.message_text;

  const event = {
    session_id: typeof eventData.session_id === 'string' ? new ObjectId(eventData.session_id) : eventData.session_id,
    user_id: eventData.user_id ? (typeof eventData.user_id === 'string' ? new ObjectId(eventData.user_id) : eventData.user_id) : null,
    volunteer_id: eventData.volunteer_id ? (typeof eventData.volunteer_id === 'string' ? new ObjectId(eventData.volunteer_id) : eventData.volunteer_id) : null,
    message_text: messageToStore,
    message_direction: eventData.message_direction,
    flag_type: eventData.flag_type,
    flag_score: eventData.flag_score || 0.5,
    flag_source: eventData.flag_source || 'ai',
    created_at: new Date(),
    reviewed: false
  };

  const result = await db.collection('moderation_events').insertOne(event);

  // Update the chat session to track the moderation event
  await db.collection('chat_sessions').updateOne(
    { _id: typeof eventData.session_id === 'string' ? new ObjectId(eventData.session_id) : eventData.session_id },
    {
      $inc: { moderation_flags: 1 },
      $push: { moderation_events: result.insertedId }
    }
  );

  // If the event involves a volunteer and it's a high-severity flag, update the volunteer record
  if (eventData.volunteer_id && eventData.flag_score > 0.7) {
    await db.collection('users').updateOne(
      { _id: typeof eventData.volunteer_id === 'string' ? new ObjectId(eventData.volunteer_id) : eventData.volunteer_id },
      { $inc: { 'volunteer.flaggedSessionsCount': 1 } }
    );
  }

  return {
    ...event,
    _id: result.insertedId
  };
}

/**
 * Get moderation events by chat session
 * @param {string} sessionId - Chat session ID
 * @returns {Promise<Array>} Array of moderation events
 */
export async function getModerationEventsBySession(sessionId) {
  if (!sessionId) throw new Error('Chat session ID is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  return await db.collection('moderation_events')
    .find({
      session_id: typeof sessionId === 'string' ? new ObjectId(sessionId) : sessionId
    })
    .sort({ created_at: 1 })
    .toArray();
}

/**
 * Get unreviewed moderation events
 * @param {number} [limit=20] - Maximum number of events to return
 * @returns {Promise<Array>} Array of unreviewed moderation events
 */
export async function getUnreviewedModerationEvents(limit = 20) {
  const client = await clientPromise;
  const db = client.db('dailyreflections');

  return await db.collection('moderation_events')
    .find({ reviewed: false })
    .sort({ flag_score: -1, created_at: 1 }) // Highest score first, then oldest
    .limit(limit)
    .toArray();
}

/**
 * Mark a moderation event as reviewed
 * @param {string} eventId - Moderation event ID
 * @param {string} adminId - Admin ID who reviewed the event
 * @param {string} resolution - Resolution type
 * @param {string} [notes] - Optional resolution notes
 * @returns {Promise<boolean>} Success status
 */
export async function resolveModerationEvent(eventId, adminId, resolution, notes = '') {
  if (!eventId) throw new Error('Event ID is required');
  if (!adminId) throw new Error('Admin ID is required');
  if (!resolution) throw new Error('Resolution is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const result = await db.collection('moderation_events').updateOne(
    { _id: typeof eventId === 'string' ? new ObjectId(eventId) : eventId },
    {
      $set: {
        reviewed: true,
        reviewed_at: new Date(),
        reviewed_by: typeof adminId === 'string' ? new ObjectId(adminId) : adminId,
        resolution,
        resolution_notes: notes
      }
    }
  );

  // Apply actions based on resolution
  if (resolution === 'volunteer_suspended') {
    const event = await db.collection('moderation_events').findOne({
      _id: typeof eventId === 'string' ? new ObjectId(eventId) : eventId
    });

    if (event && event.volunteer_id) {
      // Suspend volunteer
      await db.collection('users').updateOne(
        { _id: event.volunteer_id },
        {
          $set: {
            'volunteer.status': 'suspended',
            'roles': db.collection('users').findOne({ _id: event.volunteer_id }).then(user =>
              (user.roles || []).filter(role => role !== 'volunteer_listener')
            )
          }
        }
      );
    }
  }

  return result.modifiedCount === 1;
}

/**
 * Get moderation events for a specific volunteer
 * @param {string} volunteerId - Volunteer ID
 * @param {number} [limit=20] - Maximum number of events to return
 * @returns {Promise<Array>} Array of moderation events
 */
export async function getVolunteerModerationEvents(volunteerId, limit = 20) {
  if (!volunteerId) throw new Error('Volunteer ID is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  return await db.collection('moderation_events')
    .find({
      volunteer_id: typeof volunteerId === 'string' ? new ObjectId(volunteerId) : volunteerId
    })
    .sort({ created_at: -1 }) // Most recent first
    .limit(limit)
    .toArray();
}