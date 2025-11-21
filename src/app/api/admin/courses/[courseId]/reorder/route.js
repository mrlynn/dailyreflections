/**
 * POST /api/admin/courses/[courseId]/reorder
 * Reorders a course (moves it up or down in the list)
 */

import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request, context) {
  try {
    const session = await auth();

    // Check if user is admin
    const isAdmin =
      session?.user?.role === 'admin' ||
      session?.user?.role === 'superadmin' ||
      session?.user?.isAdmin === true;

    if (!session?.user || !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { courseId } = await context.params;
    const { direction } = await request.json();

    if (!ObjectId.isValid(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    if (!['up', 'down'].includes(direction)) {
      return NextResponse.json(
        { error: 'Direction must be "up" or "down"' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Get the current course
    const course = await db
      .collection('courses')
      .findOne({ _id: new ObjectId(courseId) });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const currentOrder = course.order;

    // Find the adjacent course to swap with
    const adjacentCourse = await db
      .collection('courses')
      .findOne({
        order: direction === 'up' ? currentOrder - 1 : currentOrder + 1,
      });

    if (!adjacentCourse) {
      // Already at the top/bottom
      return NextResponse.json({ success: true, message: 'No reordering needed' });
    }

    // Swap the order values
    await db.collection('courses').updateOne(
      { _id: new ObjectId(courseId) },
      { $set: { order: adjacentCourse.order, updatedAt: new Date() } }
    );

    await db.collection('courses').updateOne(
      { _id: adjacentCourse._id },
      { $set: { order: currentOrder, updatedAt: new Date() } }
    );

    // Log admin event
    await db.collection('admin_events').insertOne({
      type: 'course_reordered',
      courseId: new ObjectId(courseId),
      userId: new ObjectId(session.user.id),
      data: {
        direction,
        oldOrder: currentOrder,
        newOrder: adjacentCourse.order,
      },
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering course:', error);
    return NextResponse.json(
      { error: 'Failed to reorder course' },
      { status: 500 }
    );
  }
}
