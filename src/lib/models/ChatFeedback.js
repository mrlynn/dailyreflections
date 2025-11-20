/**
 * Chat Feedback Model
 *
 * Stores user feedback for chat sessions
 */

import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

/**
 * Schema for chat_feedback collection:
 *
 * {
 *   _id: ObjectId,
 *   session_id: ObjectId,      // Reference to chat_session
 *   user_id: ObjectId,         // User who provided feedback
 *   volunteer_id: ObjectId,    // Volunteer who was rated
 *   rating: String,            // "positive", "neutral", "flagged"
 *   comments: String,          // Optional user comments
 *   created_at: Date,
 *   metadata: {                // Additional metadata about the feedback
 *     browser: String,
 *     device: String,
 *     session_length: Number   // Duration in seconds
 *   },
 *   reviewed: Boolean,
 *   reviewed_at: Date,
 *   reviewed_by: ObjectId      // Admin who reviewed flagged feedback
 * }
 */

/**
 * Create chat feedback
 * @param {Object} feedbackData - Feedback data
 * @param {string} feedbackData.session_id - Chat session ID
 * @param {string} feedbackData.user_id - User ID
 * @param {string} feedbackData.volunteer_id - Volunteer ID
 * @param {string} feedbackData.rating - "positive", "neutral", or "flagged"
 * @param {string} [feedbackData.comments] - Optional comments
 * @param {Object} [feedbackData.metadata] - Additional metadata
 * @returns {Promise<Object>} Created feedback object
 */
export async function createChatFeedback(feedbackData) {
  if (!feedbackData.session_id) throw new Error('Session ID is required');
  if (!feedbackData.rating) throw new Error('Rating is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  // Get session to ensure it exists and to get user/volunteer IDs if not provided
  const session = await db.collection('chat_sessions').findOne({
    _id: typeof feedbackData.session_id === 'string' ? new ObjectId(feedbackData.session_id) : feedbackData.session_id
  });

  if (!session) {
    throw new Error('Chat session not found');
  }

  const feedback = {
    session_id: typeof feedbackData.session_id === 'string' ? new ObjectId(feedbackData.session_id) : feedbackData.session_id,
    user_id: feedbackData.user_id ? (typeof feedbackData.user_id === 'string' ? new ObjectId(feedbackData.user_id) : feedbackData.user_id) : session.user_id,
    volunteer_id: feedbackData.volunteer_id ? (typeof feedbackData.volunteer_id === 'string' ? new ObjectId(feedbackData.volunteer_id) : feedbackData.volunteer_id) : session.volunteer_id,
    rating: feedbackData.rating,
    comments: feedbackData.comments || '',
    created_at: new Date(),
    metadata: feedbackData.metadata || {},
    reviewed: feedbackData.rating !== 'flagged' // Auto-mark non-flagged feedback as reviewed
  };

  // Store session length in metadata if not provided
  if (session.end_time && session.start_time && !feedback.metadata.session_length) {
    feedback.metadata.session_length = Math.floor((session.end_time.getTime() - session.start_time.getTime()) / 1000);
  }

  const result = await db.collection('chat_feedback').insertOne(feedback);

  // Update the chat session with feedback info
  await db.collection('chat_sessions').updateOne(
    { _id: feedback.session_id },
    {
      $set: {
        'feedback': {
          rating: feedback.rating,
          comments: feedback.comments,
          submitted_at: feedback.created_at
        }
      }
    }
  );

  // Update volunteer stats if negative feedback
  if (feedback.volunteer_id && feedback.rating === 'flagged') {
    await db.collection('users').updateOne(
      { _id: feedback.volunteer_id },
      { $inc: { 'volunteer.flaggedSessionsCount': 1 } }
    );
  }

  // Calculate and update average feedback score for volunteer
  if (feedback.volunteer_id) {
    // Get all feedback for this volunteer
    const allFeedback = await db.collection('chat_feedback').find({
      volunteer_id: feedback.volunteer_id
    }).toArray();

    // Calculate average score (positive = 1, neutral = 0.5, flagged = 0)
    let totalScore = 0;
    allFeedback.forEach(item => {
      if (item.rating === 'positive') totalScore += 1;
      else if (item.rating === 'neutral') totalScore += 0.5;
    });
    const averageScore = allFeedback.length > 0 ? totalScore / allFeedback.length : 0;

    // Update volunteer's average score
    await db.collection('users').updateOne(
      { _id: feedback.volunteer_id },
      {
        $set: { 'volunteer.averageFeedbackScore': averageScore }
      }
    );
  }

  return {
    ...feedback,
    _id: result.insertedId
  };
}

/**
 * Get flagged feedback that needs review
 * @param {number} [limit=20] - Maximum number of feedback items to return
 * @returns {Promise<Array>} Array of flagged feedback items
 */
export async function getFlaggedFeedback(limit = 20) {
  const client = await clientPromise;
  const db = client.db('dailyreflections');

  return await db.collection('chat_feedback')
    .find({
      rating: 'flagged',
      reviewed: false
    })
    .sort({ created_at: 1 }) // Oldest first
    .limit(limit)
    .toArray();
}

/**
 * Get feedback for a specific volunteer
 * @param {string} volunteerId - Volunteer ID
 * @param {number} [limit=50] - Maximum number of feedback items to return
 * @returns {Promise<Array>} Array of feedback items
 */
export async function getVolunteerFeedback(volunteerId, limit = 50) {
  if (!volunteerId) throw new Error('Volunteer ID is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  return await db.collection('chat_feedback')
    .find({
      volunteer_id: typeof volunteerId === 'string' ? new ObjectId(volunteerId) : volunteerId
    })
    .sort({ created_at: -1 }) // Most recent first
    .limit(limit)
    .toArray();
}

/**
 * Mark feedback as reviewed
 * @param {string} feedbackId - Feedback ID
 * @param {string} adminId - Admin ID who reviewed the feedback
 * @returns {Promise<boolean>} Success status
 */
export async function markFeedbackReviewed(feedbackId, adminId) {
  if (!feedbackId) throw new Error('Feedback ID is required');
  if (!adminId) throw new Error('Admin ID is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const result = await db.collection('chat_feedback').updateOne(
    { _id: typeof feedbackId === 'string' ? new ObjectId(feedbackId) : feedbackId },
    {
      $set: {
        reviewed: true,
        reviewed_at: new Date(),
        reviewed_by: typeof adminId === 'string' ? new ObjectId(adminId) : adminId
      }
    }
  );

  return result.modifiedCount === 1;
}

/**
 * Get feedback statistics for a volunteer
 * @param {string} volunteerId - Volunteer ID
 * @returns {Promise<Object>} Feedback statistics
 */
export async function getVolunteerFeedbackStats(volunteerId) {
  if (!volunteerId) throw new Error('Volunteer ID is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  // Get all feedback for this volunteer
  const feedback = await db.collection('chat_feedback').find({
    volunteer_id: typeof volunteerId === 'string' ? new ObjectId(volunteerId) : volunteerId
  }).toArray();

  // Count feedback by rating
  const positive = feedback.filter(item => item.rating === 'positive').length;
  const neutral = feedback.filter(item => item.rating === 'neutral').length;
  const flagged = feedback.filter(item => item.rating === 'flagged').length;
  const total = feedback.length;

  // Calculate percentages
  const positivePercent = total > 0 ? (positive / total) * 100 : 0;
  const neutralPercent = total > 0 ? (neutral / total) * 100 : 0;
  const flaggedPercent = total > 0 ? (flagged / total) * 100 : 0;

  return {
    positive,
    neutral,
    flagged,
    total,
    positivePercent,
    neutralPercent,
    flaggedPercent,
    averageScore: total > 0 ? (positive + (neutral * 0.5)) / total : 0
  };
}