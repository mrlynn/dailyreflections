/**
 * API routes for handling individual chat messages
 */

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { flagMessageForModeration } from '@/lib/models/ChatMessage';

/**
 * GET /api/volunteers/chat/messages/[id]
 * Get a specific chat message by ID
 */
export async function GET(request, { params }) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get message ID from URL params
    const paramsData = await params;
    const id = paramsData.id;
    if (!id) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('dailyreflections');

    // Get the message
    const message = await db.collection('chat_messages').findOne({
      _id: typeof id === 'string' ? new ObjectId(id) : id
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Get the chat session to check permissions
    const chatSession = await db.collection('chat_sessions').findOne({
      _id: message.session_id
    });

    if (!chatSession) {
      return NextResponse.json({ error: 'Associated chat session not found' }, { status: 404 });
    }

    // Check if user has access to the chat session
    const hasAccess =
      session.user.isAdmin === true ||
      (chatSession.user_id.toString() === session.user.id) ||
      (chatSession.volunteer_id && chatSession.volunteer_id.toString() === session.user.id);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden - You do not have access to this message' }, { status: 403 });
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error fetching chat message:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch chat message' }, { status: 500 });
  }
}

/**
 * PUT /api/volunteers/chat/messages/[id]
 * Flag a message for moderation
 */
export async function PUT(request, { params }) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get message ID from URL params
    const paramsData = await params;
    const id = paramsData.id;
    if (!id) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    // Get request body
    const body = await request.json();
    const { action, reason } = body;

    if (action !== 'flag') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('dailyreflections');

    // Get the message to check permissions
    const message = await db.collection('chat_messages').findOne({
      _id: typeof id === 'string' ? new ObjectId(id) : id
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Get the chat session
    const chatSession = await db.collection('chat_sessions').findOne({
      _id: message.session_id
    });

    if (!chatSession) {
      return NextResponse.json({ error: 'Associated chat session not found' }, { status: 404 });
    }

    // Check if user has access to the chat session
    const hasAccess =
      session.user.isAdmin === true ||
      (chatSession.user_id.toString() === session.user.id) ||
      (chatSession.volunteer_id && chatSession.volunteer_id.toString() === session.user.id);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden - You do not have access to this message' }, { status: 403 });
    }

    // Flag the message
    const success = await flagMessageForModeration(id, reason || 'Flagged by user');

    return NextResponse.json({
      success,
      message: success ? 'Message flagged successfully' : 'Failed to flag message'
    });
  } catch (error) {
    console.error('Error flagging chat message:', error);
    return NextResponse.json({ error: error.message || 'Failed to flag message' }, { status: 500 });
  }
}

/**
 * DELETE /api/volunteers/chat/messages/[id]
 * Delete a chat message (admin only)
 */
export async function DELETE(request, { params }) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can delete messages
    if (session.user.isAdmin !== true) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get message ID from URL params
    const paramsData = await params;
    const id = paramsData.id;
    if (!id) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('dailyreflections');

    // Check if the message exists
    const message = await db.collection('chat_messages').findOne({
      _id: typeof id === 'string' ? new ObjectId(id) : id
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Delete the message
    const result = await db.collection('chat_messages').deleteOne({
      _id: typeof id === 'string' ? new ObjectId(id) : id
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting chat message:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete message' }, { status: 500 });
  }
}