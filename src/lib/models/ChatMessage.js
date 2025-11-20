/**
 * Chat Message Model
 *
 * Stores messages exchanged between users and volunteers in chat sessions
 */

import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

/**
 * Schema for chat_messages collection:
 *
 * {
 *   _id: ObjectId,
 *   session_id: ObjectId,     // Reference to chat_session
 *   sender_id: ObjectId,      // User or volunteer who sent the message
 *   sender_type: String,      // "user" or "volunteer"
 *   content: String,          // Message text content
 *   created_at: Date,         // When the message was sent (server timestamp)
 *   timestamp: Date,          // Legacy alias for created_at
 *   status: String,           // "sent", "delivered", "read"
 *   delivered_at: Date,       // When the message was delivered
 *   read_at: Date,            // When the message was read
 *   read_by: [                // Audit trail of readers
 *     {
 *       user_id: String,
 *       timestamp: Date
 *     }
 *   ],
 *   moderated: Boolean,       // Whether the message was flagged by moderation
 *   moderation_reason: String, // Reason for moderation flag
 *   metadata: {               // Additional metadata
 *     client_message_id: String, // Client-side message ID for synchronization
 *     client_timestamp: Date,    // Client-side timestamp
 *     attachments: [],        // Future: support for attachments
 *     system_message: Boolean // True if this is a system message
 *   }
 * }
 */

/**
 * Create a new chat message
 * @param {Object} messageData - Message data
 * @param {string} messageData.session_id - Chat session ID
 * @param {string} messageData.sender_id - Sender user/volunteer ID
 * @param {string} messageData.sender_type - "user" or "volunteer"
 * @param {string} messageData.content - Message text content
 * @param {Object} [messageData.metadata] - Additional message metadata
 * @returns {Promise<Object>} Created message object
 */
export async function createChatMessage(messageData) {
  if (!messageData.session_id) throw new Error('Session ID is required');
  if (!messageData.sender_id) throw new Error('Sender ID is required');
  if (!messageData.sender_type) throw new Error('Sender type is required');
  if (!['user', 'volunteer', 'system'].includes(messageData.sender_type)) {
    throw new Error('Sender type must be "user", "volunteer", or "system"');
  }
  if (!messageData.content && !messageData.metadata?.system_message) {
    throw new Error('Message content is required for non-system messages');
  }

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  // Get session to ensure it exists
  const session = await db.collection('chat_sessions').findOne({
    _id: typeof messageData.session_id === 'string' ? new ObjectId(messageData.session_id) : messageData.session_id
  });

  if (!session) {
    throw new Error('Chat session not found');
  }

  const allowedStatuses = ['active', 'in_progress', 'waiting'];
  if (!allowedStatuses.includes(session.status) && messageData.sender_type !== 'system') {
    throw new Error('Chat session is not active');
  }

  const now = new Date();
  const message = {
    session_id: typeof messageData.session_id === 'string' ? new ObjectId(messageData.session_id) : messageData.session_id,
    sender_id: typeof messageData.sender_id === 'string' ? new ObjectId(messageData.sender_id) : messageData.sender_id,
    sender_type: messageData.sender_type,
    content: messageData.content || '',
    created_at: now,
    timestamp: now,
    updated_at: now,
    status: 'sent',
    delivered_at: null,
    read_at: null,
    read_by: [],
    moderated: false,
    // Include the session_key if it exists on the session to track which specific session instance this message belongs to
    session_key: session.session_key || undefined,
    metadata: messageData.metadata || {}
  };

  console.log('Creating chat message:', {
    session_id: message.session_id.toString(),
    sender_type: message.sender_type,
    content_preview: message.content.substring(0, 20) + (message.content.length > 20 ? '...' : ''),
    has_session_key: !!message.session_key,
    session_key: message.session_key || 'No session_key found'
  });

  const result = await db.collection('chat_messages').insertOne(message);

  // Update message count in the session
  await db.collection('chat_sessions').updateOne(
    { _id: message.session_id },
    { $inc: { messages_count: 1 } }
  );

  return {
    ...message,
    _id: result.insertedId
  };
}

/**
 * Get messages for a chat session
 * @param {string} sessionId - Chat session ID
 * @param {Object} [options] - Query options
 * @param {number} [options.limit=50] - Maximum number of messages to return
 * @param {number} [options.offset=0] - Number of messages to skip
 * @param {Date} [options.before] - Only return messages before this timestamp
 * @param {Date} [options.after] - Only return messages after this timestamp
 * @returns {Promise<Array>} Array of chat messages
 */
export async function getSessionMessages(sessionId, options = {}) {
  if (!sessionId) throw new Error('Session ID is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  // Get the chat session to get the session_key
  const session = await db.collection('chat_sessions').findOne({
    _id: typeof sessionId === 'string' ? new ObjectId(sessionId) : sessionId
  });

  if (!session) {
    throw new Error('Chat session not found');
  }

  const query = {
    session_id: typeof sessionId === 'string' ? new ObjectId(sessionId) : sessionId
  };

  // If the session has a session_key, filter messages by that key
  // This ensures we only get messages from the current session instance
  if (session.session_key) {
    query.session_key = session.session_key;
  }

  // Add timestamp filters if provided
  if (options.before) {
    query.created_at = { ...(query.created_at || {}), $lt: options.before };
  }
  if (options.after) {
    query.created_at = { ...(query.created_at || {}), $gt: options.after };
  }

  const limit = options.limit || 50;
  const skip = options.offset || 0;

  return await db.collection('chat_messages')
    .find(query)
    .sort({ created_at: 1 }) // Oldest first for chat history
    .skip(skip)
    .limit(limit)
    .toArray();
}

/**
 * Mark messages as delivered
 * @param {string} sessionId - Chat session ID
 * @param {string} recipientId - Recipient user/volunteer ID
 * @returns {Promise<number>} Number of messages updated
 */
export async function markMessagesDelivered(sessionId, recipientId) {
  if (!sessionId) throw new Error('Session ID is required');
  if (!recipientId) throw new Error('Recipient ID is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const session = await db.collection('chat_sessions').findOne({
    _id: typeof sessionId === 'string' ? new ObjectId(sessionId) : sessionId
  });

  if (!session) {
    throw new Error('Chat session not found');
  }

  // Determine the sender type based on the recipient
  // If recipient is user, then we're marking messages from volunteer as delivered
  // If recipient is volunteer, then we're marking messages from user as delivered
  const recipientString = typeof recipientId === 'string' ? recipientId : recipientId?.toString();
  const sessionUserString = session.user_id ? session.user_id.toString() : null;
  const volunteerString = session.volunteer_id ? session.volunteer_id.toString() : null;
  let senderType = 'user';
  if (sessionUserString && recipientString && sessionUserString === recipientString) {
    senderType = 'volunteer';
  } else if (volunteerString && recipientString && volunteerString === recipientString) {
    senderType = 'user';
  }

  const deliveredAt = new Date();
  const result = await db.collection('chat_messages').updateMany(
    {
      session_id: typeof sessionId === 'string' ? new ObjectId(sessionId) : sessionId,
      sender_type: senderType,
      status: 'sent'
    },
    {
      $set: {
        status: 'delivered',
        delivered_at: deliveredAt,
        updated_at: deliveredAt
      }
    }
  );

  return result.modifiedCount;
}

/**
 * Mark messages as read
 * @param {string} sessionId - Chat session ID
 * @param {string} recipientId - Recipient user/volunteer ID
 * @returns {Promise<number>} Number of messages updated
 */
export async function markMessagesRead(sessionId, recipientId) {
  if (!sessionId) throw new Error('Session ID is required');
  if (!recipientId) throw new Error('Recipient ID is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const session = await db.collection('chat_sessions').findOne({
    _id: typeof sessionId === 'string' ? new ObjectId(sessionId) : sessionId
  });

  if (!session) {
    throw new Error('Chat session not found');
  }

  // Determine the sender type based on the recipient
  const recipientString = typeof recipientId === 'string' ? recipientId : recipientId?.toString();
  const sessionUserString = session.user_id ? session.user_id.toString() : null;
  const volunteerString = session.volunteer_id ? session.volunteer_id.toString() : null;
  let senderType = 'user';
  if (sessionUserString && recipientString && sessionUserString === recipientString) {
    senderType = 'volunteer';
  } else if (volunteerString && recipientString && volunteerString === recipientString) {
    senderType = 'user';
  }

  const now = new Date();

  const result = await db.collection('chat_messages').updateMany(
    {
      session_id: typeof sessionId === 'string' ? new ObjectId(sessionId) : sessionId,
      sender_type: senderType,
      status: { $in: ['sent', 'delivered'] }
    },
    {
      $set: {
        status: 'read',
        read_at: now,
        updated_at: now
      },
      $addToSet: {
        read_by: {
          user_id: recipientString,
          timestamp: now
        }
      }
    }
  );

  return result.modifiedCount;
}

/**
 * Create a system message
 * @param {string} sessionId - Chat session ID
 * @param {string} content - Message content
 * @param {Object} [metadata] - Additional message metadata
 * @returns {Promise<Object>} Created message object
 */
export async function createSystemMessage(sessionId, content, metadata = {}) {
  if (!sessionId) throw new Error('Session ID is required');
  if (!content) throw new Error('Content is required');

  const messageData = {
    session_id: sessionId,
    sender_id: new ObjectId(), // Generate a placeholder ID for system
    sender_type: 'system',
    content: content,
    metadata: {
      ...metadata,
      system_message: true
    }
  };

  return await createChatMessage(messageData);
}

/**
 * Flag a message for moderation
 * @param {string} messageId - Message ID
 * @param {string} reason - Reason for moderation flag
 * @returns {Promise<boolean>} Success status
 */
export async function flagMessageForModeration(messageId, reason) {
  if (!messageId) throw new Error('Message ID is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const result = await db.collection('chat_messages').updateOne(
    { _id: typeof messageId === 'string' ? new ObjectId(messageId) : messageId },
    {
      $set: {
        moderated: true,
        moderation_reason: reason || 'Content flagged by moderation system'
      }
    }
  );

  // Increment moderation_flags count in the session
  if (result.modifiedCount > 0) {
    const message = await db.collection('chat_messages').findOne({
      _id: typeof messageId === 'string' ? new ObjectId(messageId) : messageId
    });

    if (message) {
      await db.collection('chat_sessions').updateOne(
        { _id: message.session_id },
        { $inc: { moderation_flags: 1 } }
      );
    }
  }

  return result.modifiedCount === 1;
}

/**
 * Get unread message count
 * @param {string} sessionId - Chat session ID
 * @param {string} recipientId - Recipient user/volunteer ID
 * @returns {Promise<number>} Number of unread messages
 */
export async function getUnreadMessageCount(sessionId, recipientId) {
  if (!sessionId) throw new Error('Session ID is required');
  if (!recipientId) throw new Error('Recipient ID is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const session = await db.collection('chat_sessions').findOne({
    _id: typeof sessionId === 'string' ? new ObjectId(sessionId) : sessionId
  });

  if (!session) {
    throw new Error('Chat session not found');
  }

  // Determine sender type based on recipient
  const recipientString = typeof recipientId === 'string' ? recipientId : recipientId?.toString();
  const sessionUserString = session.user_id ? session.user_id.toString() : null;
  let senderType = 'user';
  if (sessionUserString && recipientString && sessionUserString === recipientString) {
    senderType = 'volunteer';
  } else if (!sessionUserString && session.volunteer_id) {
    const volunteerString = session.volunteer_id.toString();
    senderType = volunteerString === recipientString ? 'user' : 'volunteer';
  }

  const count = await db.collection('chat_messages').countDocuments({
    session_id: typeof sessionId === 'string' ? new ObjectId(sessionId) : sessionId,
    sender_type: senderType,
    status: { $in: ['sent', 'delivered'] }
  });

  return count;
}