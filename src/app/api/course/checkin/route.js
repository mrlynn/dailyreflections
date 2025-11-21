/**
 * POST /api/course/checkin
 *
 * Records a check-in response from a CheckinBlock.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { recordCheckin } from '@/lib/course/courseApi';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be signed in to record check-ins.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { lessonId, mood } = body;

    if (!lessonId || !mood) {
      return NextResponse.json(
        { error: 'lessonId and mood are required.' },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(lessonId)) {
      return NextResponse.json(
        { error: 'Invalid lessonId format.' },
        { status: 400 }
      );
    }

    if (typeof mood !== 'string' || mood.trim().length === 0) {
      return NextResponse.json(
        { error: 'mood must be a non-empty string.' },
        { status: 400 }
      );
    }

    await recordCheckin({
      userId: session.user.id,
      lessonId,
      mood: mood.trim(),
    });

    return NextResponse.json({
      success: true,
      message: 'Check-in recorded successfully.',
    });
  } catch (error) {
    console.error('Error recording check-in:', error);
    return NextResponse.json(
      { error: 'Failed to record check-in.' },
      { status: 500 }
    );
  }
}
