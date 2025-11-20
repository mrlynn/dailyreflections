'use server';

import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getChatSessionById, setTypingStatus } from '@/lib/models/ChatSession';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { sessionId, status } = body || {};

    if (!sessionId || !['start', 'stop'].includes(status)) {
      return NextResponse.json(
        { error: 'sessionId and valid status ("start" or "stop") are required' },
        { status: 400 }
      );
    }

    const chatSession = await getChatSessionById(sessionId);
    if (!chatSession) {
      return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
    }

    const userIdString = session.user.id?.toString();
    const userObjectId = (() => {
      try {
        return new ObjectId(userIdString);
      } catch {
        return null;
      }
    })();

    let actor = null;
    if (chatSession.user_id?.toString() === userIdString) {
      actor = 'user';
    } else if (chatSession.volunteer_id?.toString() === userIdString) {
      actor = 'volunteer';
    }

    if (!actor) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await setTypingStatus(sessionId, actor, status === 'start');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating typing status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update typing status' },
      { status: 500 }
    );
  }
}


