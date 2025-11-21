/**
 * GET /api/course/[courseSlug]
 *
 * Returns course overview with modules, user progress, and next lesson.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getCourseOverviewForUser } from '@/lib/course/courseApi';

export async function GET(request, context) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be signed in to access courses.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Await params in Next.js 15+
    const { courseSlug } = await context.params;

    const data = await getCourseOverviewForUser({
      userId: session.user.id,
      courseSlug,
    });

    if (!data) {
      return NextResponse.json(
        { error: 'Course not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching course overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course overview.' },
      { status: 500 }
    );
  }
}
