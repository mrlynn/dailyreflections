/**
 * API routes for chat session feedback
 */

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getChatSessionById } from '@/lib/models/ChatSession';
import { createChatFeedback } from '@/lib/models/ChatFeedback';

/**
 * POST /api/volunteers/chat/feedback
 * Submit feedback for a chat session
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
    const { session_id, rating, comments } = body;

    // Validate required fields
    if (!session_id) {
      return NextResponse.json({ error: 'Chat session ID is required' }, { status: 400 });
    }

    if (!rating || !['positive', 'neutral', 'flagged'].includes(rating)) {
      return NextResponse.json({ error: 'Valid rating is required (positive, neutral, or flagged)' }, { status: 400 });
    }

    // Get the chat session to verify it exists and belongs to the user
    const chatSession = await getChatSessionById(session_id);
    if (!chatSession) {
      return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
    }

    // Verify the user is the one who participated in the chat
    if (chatSession.user_id.toString() !== session.user.id && session.user.isAdmin !== true) {
      return NextResponse.json({ error: 'You can only provide feedback for your own chat sessions' }, { status: 403 });
    }

    // Check if the session is complete (can't give feedback for active sessions)
    if (chatSession.status !== 'completed') {
      return NextResponse.json({ error: 'Can only provide feedback for completed chat sessions' }, { status: 400 });
    }

    // Create feedback
    const feedback = await createChatFeedback({
      session_id,
      user_id: session.user.id,
      volunteer_id: chatSession.volunteer_id,
      rating,
      comments: comments || '',
      metadata: {
        browser: body.metadata?.browser,
        device: body.metadata?.device
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback
    });
  } catch (error) {
    console.error('Error submitting chat feedback:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit feedback' }, { status: 500 });
  }
}