/**
 * GET /api/course/[courseSlug]/lesson?moduleSlug=...&lessonSlug=...
 *
 * Returns lesson data for rendering.
 *
 * POST /api/course/[courseSlug]/lesson/complete
 *
 * Marks a lesson as complete.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getLessonPageData, completeLesson } from '@/lib/course/courseApi';
import { ObjectId } from 'mongodb';

export async function GET(request, context) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be signed in to access lessons.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Await params in Next.js 15+
    const { courseSlug } = await context.params;
    const { searchParams } = new URL(request.url);
    const moduleSlug = searchParams.get('moduleSlug');
    const lessonSlug = searchParams.get('lessonSlug');

    if (!moduleSlug || !lessonSlug) {
      return NextResponse.json(
        { error: 'moduleSlug and lessonSlug are required query parameters.' },
        { status: 400 }
      );
    }

    const data = await getLessonPageData({
      userId: session.user.id,
      courseSlug,
      moduleSlug,
      lessonSlug,
    });

    if (!data) {
      return NextResponse.json(
        { error: 'Lesson not found or you do not have access to it yet.' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lesson.' },
      { status: 500 }
    );
  }
}

export async function POST(request, context) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be signed in to complete lessons.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Await params (not used in POST but good for consistency)
    await context.params;

    const body = await request.json();
    const { courseId, lessonId } = body;

    if (!courseId || !lessonId) {
      return NextResponse.json(
        { error: 'courseId and lessonId are required.' },
        { status: 400 }
      );
    }

    // Validate ObjectIds
    if (!ObjectId.isValid(courseId) || !ObjectId.isValid(lessonId)) {
      return NextResponse.json(
        { error: 'Invalid courseId or lessonId format.' },
        { status: 400 }
      );
    }

    const userProgress = await completeLesson({
      userId: session.user.id,
      courseId,
      lessonId,
    });

    return NextResponse.json({
      success: true,
      userProgress,
    });
  } catch (error) {
    console.error('Error completing lesson:', error);
    return NextResponse.json(
      { error: 'Failed to complete lesson.' },
      { status: 500 }
    );
  }
}
