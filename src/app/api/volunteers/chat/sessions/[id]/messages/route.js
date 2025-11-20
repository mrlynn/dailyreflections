/**
 * API routes for managing chat messages within a session
 */

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { createChatMessage, getSessionMessages } from '@/lib/models/ChatMessage';
import { getChatSessionById } from '@/lib/models/ChatSession';

/**
 * Helper to check if user has access to this session
 * @param {Object} session - User session
 * @param {Object} chatSession - Chat session
 * @returns {Boolean} - Whether user has access
 */
function parseObjectId(value) {
  if (!value) return null;
  if (value instanceof ObjectId) return value;
  if (typeof value === 'string' && ObjectId.isValid(value)) {
    return new ObjectId(value);
  }
  return null;
}

async function hasAccessToSession(session, chatSessionId) {
  if (!session?.user) return false;

  // Connect to MongoDB
  const client = await clientPromise;
  const db = client.db('dailyreflections');

  // Get the chat session
  const sessionObjectId = parseObjectId(chatSessionId);
  if (!sessionObjectId) return false;

  const chatSession = await db.collection('chat_sessions').findOne({
    _id: sessionObjectId,
  });

  if (!chatSession) return false;

  // Admins have access to all sessions
  if (session.user.isAdmin === true) return true;

  // Volunteer access (only if they're assigned to this session)
  if (session.user.roles?.includes('volunteer_listener')) {
    if (chatSession.volunteer_id &&
        (chatSession.volunteer_id.toString() === session.user.id ||
         chatSession.volunteer_id === session.user.id)) {
      return true;
    }

    // Allow volunteers to see waiting sessions they could pick up
    if (chatSession.status === 'waiting') return true;
  }

  // Users only have access to their own sessions
  if (chatSession.user_id &&
      (chatSession.user_id.toString() === session.user.id ||
       chatSession.user_id === session.user.id)) {
    return true;
  }

  return false;
}

/**
 * GET /api/volunteers/chat/sessions/[id]/messages
 * Get messages for a specific chat session
 */
export async function GET(request, { params }) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get session ID from URL params
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const sessionObjectId = parseObjectId(id);
    if (!sessionObjectId) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
    }

    // Check permission
    const hasAccess = await hasAccessToSession(session, sessionObjectId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden - You do not have access to this session' }, { status: 403 });
    }

    // Get the chat session to ensure we have session_key information
    const chatSession = await getChatSessionById(sessionObjectId);
    if (!chatSession) {
      return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
    }

    // IMPORTANT: Use getSessionMessages to properly filter by session_key
    // This ensures we only get messages from the current session instance
    // and prevents showing messages from previous conversations with the same user
    const messages = await getSessionMessages(sessionObjectId, {
      limit: 100 // Reasonable limit for chat messages
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch chat messages' }, { status: 500 });
  }
}

/**
 * POST /api/volunteers/chat/sessions/[id]/messages
 * Send a new message in a chat session
 */
export async function POST(request, { params }) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get session ID from URL params
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const sessionId = parseObjectId(id);
    if (!sessionId) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
    }

    // Get chat session using the imported function to ensure consistent handling
    const chatSession = await getChatSessionById(sessionId);
    if (!chatSession) {
      return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
    }

    // Check if session is active
    const allowedStatuses = ['in_progress', 'active', 'waiting'];
    if (!allowedStatuses.includes(chatSession.status)) {
      return NextResponse.json({ error: 'Cannot send messages in a closed session' }, { status: 400 });
    }

    // Check permission
    const isVolunteer = session.user.roles?.includes('volunteer_listener');

    // Volunteers can only send messages if they are assigned to this session
    if (isVolunteer) {
      const volunteerId = typeof session.user.id === 'string' ? session.user.id : session.user.id.toString();
      const sessionVolunteerId = chatSession.volunteer_id ?
        (typeof chatSession.volunteer_id === 'string' ?
          chatSession.volunteer_id :
          chatSession.volunteer_id.toString()) :
        null;

      if (sessionVolunteerId !== volunteerId) {
        return NextResponse.json({
          error: 'Forbidden - Only the assigned volunteer can send messages'
        }, { status: 403 });
      }
    } else {
      // Regular users can only send messages in their own sessions
      const userId = typeof session.user.id === 'string' ? session.user.id : session.user.id.toString();
      const sessionUserId = chatSession.user_id ?
        (typeof chatSession.user_id === 'string' ?
          chatSession.user_id :
          chatSession.user_id.toString()) :
        null;

      if (sessionUserId !== userId) {
        return NextResponse.json({
          error: 'Forbidden - You can only send messages in your own sessions'
        }, { status: 403 });
      }
    }

    // Parse the request body
    const body = await request.json();
    const { content, type = 'text' } = body;

    if (!content) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // Create the message
    // The createChatMessage function will automatically use the session_key from the session
    // to ensure this message is associated with the current session instance
    const createdMessage = await createChatMessage({
      session_id: sessionId,
      sender_id: session.user.id,
      sender_type: isVolunteer ? 'volunteer' : 'user',
      content,
      metadata: { type }
    });

    await db.collection('chat_sessions').updateOne(
      { _id: sessionId },
      { $set: { last_activity: new Date() } }
    );

    return NextResponse.json({
      success: true,
      message: createdMessage
    });
  } catch (error) {
    console.error('Error sending chat message:', error);
    return NextResponse.json({ error: error.message || 'Failed to send chat message' }, { status: 500 });
  }
}