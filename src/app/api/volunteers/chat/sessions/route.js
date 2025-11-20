/**
 * API routes for managing volunteer chat sessions
 */

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import {
  createChatSessionRequest,
  getActiveVolunteerSessions,
  getWaitingChatSessions,
  assignVolunteerToSession
} from '@/lib/models/ChatSession';

/**
 * GET /api/volunteers/chat/sessions
 * For users: Get their active or waiting chat sessions
 * For volunteers: Get their active sessions or waiting sessions they can pick up
 */
export async function GET(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'active';
    const isVolunteer = session.user.roles?.includes('volunteer_listener');

    let chatSessions = [];

    if (isVolunteer) {
      // For volunteers
      if (type === 'active') {
        // Get volunteer's active sessions
        chatSessions = await getActiveVolunteerSessions(session.user.id);
      } else if (type === 'waiting') {
        // Get sessions waiting for a volunteer to pick up
        chatSessions = await getWaitingChatSessions();
      }
    } else {
      // For regular users, only return their own sessions
      // You'd need to add a function to get user's sessions by their ID
      // This is a placeholder implementation
      const userSessions = await getUserSessions(session.user.id, type);
      chatSessions = userSessions;
    }

    return NextResponse.json({ sessions: chatSessions });
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch chat sessions' }, { status: 500 });
  }
}

/**
 * POST /api/volunteers/chat/sessions
 * Create a new chat session request (for users)
 */
export async function POST(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get metadata from request
    const body = await request.json();
    const { metadata = {} } = body;

    // Create the chat session
    const chatSession = await createChatSessionRequest(session.user.id, metadata);

    return NextResponse.json({
      success: true,
      session: chatSession
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating chat session:', error);
    return NextResponse.json({ error: error.message || 'Failed to create chat session' }, { status: 500 });
  }
}

/**
 * Helper function to get user's sessions by their ID
 * @param {string} userId - User ID
 * @param {string} type - Session type ('active', 'waiting', 'completed')
 * @returns {Promise<Array>} - Array of chat sessions
 */
async function getUserSessions(userId, type = 'active') {
  // Implementation will depend on your actual database model
  // This is a placeholder
  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const query = { user_id: typeof userId === 'string' ? new ObjectId(userId) : userId };

  if (type === 'active') {
    query.status = { $in: ['active', 'waiting'] };
  } else if (type === 'completed') {
    query.status = 'completed';
  }

  return await db.collection('chat_sessions')
    .find(query)
    .sort({ start_time: -1 })
    .toArray();
}