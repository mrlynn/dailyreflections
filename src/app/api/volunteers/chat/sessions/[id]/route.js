/**
 * API routes for managing individual chat sessions
 */

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import {
  getChatSessionById,
  assignVolunteerToSession,
  completeChatSession,
  updateMessageCount,
  resumeChatSession,
} from '@/lib/models/ChatSession';
import { createSystemMessage } from '@/lib/models/ChatMessage';
import { getConfig } from '@/lib/models/SystemConfig';
import { CHAT_CONFIG } from '@/lib/constants/configKeys';

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
 * GET /api/volunteers/chat/sessions/[id]
 * Get details of a specific chat session
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

    // Get chat session
    const chatSession = await getChatSessionById(id);
    if (!chatSession) {
      return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
    }

    // Check permission
    if (!hasAccessToSession(session, chatSession)) {
      return NextResponse.json({ error: 'Forbidden - You do not have access to this session' }, { status: 403 });
    }

    return NextResponse.json({ session: chatSession });
  } catch (error) {
    console.error('Error fetching chat session:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch chat session' }, { status: 500 });
  }
}

/**
 * POST /api/volunteers/chat/sessions/[id]/assign
 * Volunteer assigns themselves to a waiting chat session
 */
export async function POST(request, { params }) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a volunteer
    if (!session.user.roles?.includes('volunteer_listener')) {
      return NextResponse.json({ error: 'Forbidden - Only volunteers can perform this action' }, { status: 403 });
    }

    // Get session ID from URL params
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Parse the request body to get additional information
    const body = await request.json();
    const { action } = body;

    // Handle different actions
    switch (action) {
      case 'assign':
        // Assign volunteer to session
        await assignVolunteerToSession(id, session.user.id);

        // Send automated welcome message if configured
        const welcomeMessage = await getConfig(CHAT_CONFIG.VOLUNTEER_WELCOME_MESSAGE, '');
        if (welcomeMessage && welcomeMessage.trim() !== '') {
          // Check if a welcome message has already been sent for this session
          const client = await clientPromise;
          const db = client.db('dailyreflections');
          const existingWelcomeMessage = await db.collection('chat_messages').findOne({
            session_id: typeof id === 'string' ? new ObjectId(id) : id,
            sender_type: 'system',
            'metadata.welcome_message': true
          });

          // Only send welcome message if one hasn't been sent already
          if (!existingWelcomeMessage) {
            // Send the welcome message as a system message to ensure consistency
            await createSystemMessage(id, welcomeMessage, {
              volunteer_id: session.user.id,
              automated: true,
              welcome_message: true
            });
          }
        }

        return NextResponse.json({
          success: true,
          message: 'You have been assigned to this chat session'
        });

      case 'complete':
        // Complete the session
        await completeChatSession(id);
        return NextResponse.json({
          success: true,
          message: 'Chat session completed'
        });
      case 'resume':
        // Resume a session by marking it active again
        await resumeChatSession(id);
        return NextResponse.json({
          success: true,
          message: 'Chat session resumed'
        });

      case 'update_count':
        // Update message count
        const { count } = body;
        if (count === undefined) {
          return NextResponse.json({ error: 'Message count is required' }, { status: 400 });
        }

        await updateMessageCount(id, count);
        return NextResponse.json({
          success: true,
          message: 'Message count updated'
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error handling chat session action:', error);
    return NextResponse.json({ error: error.message || 'Failed to handle chat session action' }, { status: 500 });
  }
}