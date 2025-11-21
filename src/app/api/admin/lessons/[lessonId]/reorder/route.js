/**
 * POST /api/admin/lessons/[lessonId]/reorder
 * Reorders a lesson (moves it up or down in the list)
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

    const { lessonId } = await context.params;
    const { direction } = await request.json();

    if (!ObjectId.isValid(lessonId)) {
      return NextResponse.json({ error: 'Invalid lesson ID' }, { status: 400 });
    }

    if (!['up', 'down'].includes(direction)) {
      return NextResponse.json(
        { error: 'Direction must be "up" or "down"' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Get the current lesson
    const lesson = await db
      .collection('lessons')
      .findOne({ _id: new ObjectId(lessonId) });

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    const currentOrder = lesson.order;
    const moduleId = lesson.moduleId;

    // Find the adjacent lesson to swap with (within the same module)
    const adjacentLesson = await db
      .collection('lessons')
      .findOne({
        moduleId: moduleId,
        order: direction === 'up' ? currentOrder - 1 : currentOrder + 1,
      });

    if (!adjacentLesson) {
      // Already at the top/bottom
      return NextResponse.json({ success: true, message: 'No reordering needed' });
    }

    // Swap the order values
    await db.collection('lessons').updateOne(
      { _id: new ObjectId(lessonId) },
      { $set: { order: adjacentLesson.order, updatedAt: new Date() } }
    );

    await db.collection('lessons').updateOne(
      { _id: adjacentLesson._id },
      { $set: { order: currentOrder, updatedAt: new Date() } }
    );

    // Log admin event
    await db.collection('admin_events').insertOne({
      type: 'lesson_reordered',
      lessonId: new ObjectId(lessonId),
      userId: new ObjectId(session.user.id),
      data: {
        direction,
        oldOrder: currentOrder,
        newOrder: adjacentLesson.order,
      },
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering lesson:', error);
    return NextResponse.json(
      { error: 'Failed to reorder lesson' },
      { status: 500 }
    );
  }
}
