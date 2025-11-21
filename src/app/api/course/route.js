/**
 * GET /api/course
 *
 * Returns list of active courses for the authenticated user.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getCoursesForUser } from '@/lib/course/courseApi';

export async function GET(request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be signed in to access courses.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const courses = await getCoursesForUser(session.user.id);

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses.' },
      { status: 500 }
    );
  }
}
