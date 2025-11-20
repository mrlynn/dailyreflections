/**
 * API routes for chat messages
 */

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { getChatSessionById } from '@/lib/models/ChatSession';
import {
  createChatMessage,
  getSessionMessages,
  markMessagesDelivered,
  markMessagesRead
} from '@/lib/models/ChatMessage';

/**
 * Helper to check if user has access to this session
 * @param {Object} session - User session
 * @param {Object} chatSession - Chat session
 * @returns {Boolean} - Whether user has access
 */
function hasAccessToSession(session, chatSession) {
  if (!session?.user || !chatSession) return false;

  // Admins have access to all sessions
  if (session.user.isAdmin === true) return true;

  // Volunteer access (only if they're assigned to this session)
  if (session.user.roles?.includes('volunteer_listener')) {
    if (chatSession.volunteer_id &&
        (chatSession.volunteer_id.toString() === session.user.id ||
         chatSession.volunteer_id === session.user.id)) {
      return true;
    }
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
 * GET /api/volunteers/chat/messages
 * Get messages for a specific chat session
 */
export async function GET(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get session ID from query parameters
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Get query parameters for pagination/filtering
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const before = searchParams.get('before') ? new Date(searchParams.get('before')) : null;
    const after = searchParams.get('after') ? new Date(searchParams.get('after')) : null;

    // Get chat session
    const chatSession = await getChatSessionById(sessionId);
    if (!chatSession) {
      return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
    }

    // Check permission
    if (!hasAccessToSession(session, chatSession)) {
      return NextResponse.json({ error: 'Forbidden - You do not have access to this session' }, { status: 403 });
    }

    // Get messages
    const messages = await getSessionMessages(sessionId, { limit, offset, before, after });

    // If user is viewing messages, mark messages from others as read
    if (chatSession.user_id && chatSession.user_id.toString() === session.user.id) {
      // If viewer is the user, mark volunteer messages as read
      await markMessagesRead(sessionId, session.user.id);
    } else if (chatSession.volunteer_id &&
              (chatSession.volunteer_id.toString() === session.user.id ||
               chatSession.volunteer_id === session.user.id)) {
      // If viewer is the volunteer, mark user messages as read
      await markMessagesRead(sessionId, session.user.id);
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch chat messages' }, { status: 500 });
  }
}

/**
 * POST /api/volunteers/chat/messages
 * Send a message in a chat session
 */
export async function POST(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { sessionId, content, metadata } = body;

    // Validate required fields
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    if (!content) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // Get chat session
    const chatSession = await getChatSessionById(sessionId);
    if (!chatSession) {
      return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
    }

    // Check permission
    if (!hasAccessToSession(session, chatSession)) {
      return NextResponse.json({ error: 'Forbidden - You do not have access to this session' }, { status: 403 });
    }

    // Check if session is active
    if (chatSession.status !== 'active' && chatSession.status !== 'in_progress') {
      return NextResponse.json({ error: 'Cannot send message - chat session is not active' }, { status: 400 });
    }

    // Check for recent duplicate messages to prevent accidental duplicates
    // Look for identical messages sent in the last 30 seconds
    const thirtySecondsAgo = new Date();
    thirtySecondsAgo.setSeconds(thirtySecondsAgo.getSeconds() - 30);

    // Get database connection
    const client = await clientPromise;
    const db = client.db('dailyreflections');

    const recentDuplicate = await db.collection('chat_messages').findOne({
      session_id: sessionId,
      sender_id: typeof session.user.id === 'string' ? new ObjectId(session.user.id) : session.user.id,
      content: content.trim(),
      created_at: { $gt: thirtySecondsAgo }
    });

    if (recentDuplicate) {
      return NextResponse.json({
        warning: 'Duplicate message detected',
        message: recentDuplicate
      }, { status: 200 });
    }

    // Determine sender type
    let senderType = 'user';
    if (session.user.roles?.includes('volunteer_listener') &&
        chatSession.volunteer_id &&
        (chatSession.volunteer_id.toString() === session.user.id ||
         chatSession.volunteer_id === session.user.id)) {
      senderType = 'volunteer';
    } else if (session.user.isAdmin === true && body.senderType === 'system') {
      // Allow admins to send system messages
      senderType = 'system';
    } else if (chatSession.user_id.toString() !== session.user.id) {
      return NextResponse.json({ error: 'You are not authorized to send messages in this session' }, { status: 403 });
    }

    // Create message
    const message = await createChatMessage({
      session_id: sessionId,
      sender_id: session.user.id,
      sender_type: senderType,
      content,
      metadata: metadata || {}
    });

    return NextResponse.json({
      success: true,
      message
    }, { status: 201 });
  } catch (error) {
    console.error('Error sending chat message:', error);
    return NextResponse.json({ error: error.message || 'Failed to send message' }, { status: 500 });
  }
}

/**
 * PUT /api/volunteers/chat/messages
 * Update message status (mark as delivered/read)
 */
export async function PUT(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { sessionId, action } = body;

    // Validate required fields
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    if (!action || !['delivered', 'read'].includes(action)) {
      return NextResponse.json({ error: 'Valid action is required (delivered or read)' }, { status: 400 });
    }

    // Get chat session
    const chatSession = await getChatSessionById(sessionId);
    if (!chatSession) {
      return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
    }

    // Check permission
    if (!hasAccessToSession(session, chatSession)) {
      return NextResponse.json({ error: 'Forbidden - You do not have access to this session' }, { status: 403 });
    }

    let count = 0;
    if (action === 'delivered') {
      count = await markMessagesDelivered(sessionId, session.user.id);
    } else if (action === 'read') {
      count = await markMessagesRead(sessionId, session.user.id);
    }

    return NextResponse.json({
      success: true,
      count,
      message: `${count} messages marked as ${action}`
    });
  } catch (error) {
    console.error('Error updating message status:', error);
    return NextResponse.json({ error: error.message || 'Failed to update message status' }, { status: 500 });
  }
}