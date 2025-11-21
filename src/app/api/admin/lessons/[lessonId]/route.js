/**
 * GET /api/admin/lessons/[lessonId]
 * Returns a single lesson with full details for editing
 *
 * PUT /api/admin/lessons/[lessonId]
 * Updates a lesson
 */

import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request, context) {
  try {
    const session = await auth();

    // Check if user is admin (check both role field and isAdmin field)
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

    if (!ObjectId.isValid(lessonId)) {
      return NextResponse.json({ error: 'Invalid lesson ID' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Fetch lesson with course and module info
    const lessonData = await db
      .collection('lessons')
      .aggregate([
        { $match: { _id: new ObjectId(lessonId) } },
        {
          $lookup: {
            from: 'modules',
            localField: 'moduleId',
            foreignField: '_id',
            as: 'module',
          },
        },
        {
          $lookup: {
            from: 'courses',
            localField: 'courseId',
            foreignField: '_id',
            as: 'course',
          },
        },
        {
          $unwind: '$module',
        },
        {
          $unwind: '$course',
        },
        {
          $project: {
            title: 1,
            subtitle: 1,
            slug: 1,
            order: 1,
            approximateDurationMinutes: 1,
            content: 1,
            blocks: 1,
            status: 1,
            courseId: 1,
            moduleId: 1,
            courseName: '$course.title',
            courseSlug: '$course.slug',
            moduleName: '$module.title',
            moduleSlug: '$module.slug',
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ])
      .toArray();

    if (!lessonData || lessonData.length === 0) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    return NextResponse.json(lessonData[0]);
  } catch (error) {
    console.error('Error fetching lesson for admin:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lesson' },
      { status: 500 }
    );
  }
}

export async function PUT(request, context) {
  try {
    const session = await auth();

    // Check if user is admin (check both role field and isAdmin field)
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

    if (!ObjectId.isValid(lessonId)) {
      return NextResponse.json({ error: 'Invalid lesson ID' }, { status: 400 });
    }

    const updates = await request.json();
    const { db } = await connectToDatabase();

    // Build update object
    const updateDoc = {
      $set: {
        updatedAt: new Date(),
      },
    };

    // Update allowed fields
    if (updates.title !== undefined) updateDoc.$set.title = updates.title;
    if (updates.subtitle !== undefined) updateDoc.$set.subtitle = updates.subtitle;
    if (updates.approximateDurationMinutes !== undefined) {
      updateDoc.$set.approximateDurationMinutes = updates.approximateDurationMinutes;
    }
    if (updates.content !== undefined) updateDoc.$set.content = updates.content;
    if (updates.status !== undefined) updateDoc.$set.status = updates.status;

    // Update lesson
    const result = await db.collection('lessons').updateOne(
      { _id: new ObjectId(lessonId) },
      updateDoc
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Log admin event
    await db.collection('admin_events').insertOne({
      type: 'lesson_updated',
      lessonId: new ObjectId(lessonId),
      userId: new ObjectId(session.user.id),
      changes: updates,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error updating lesson:', error);
    return NextResponse.json(
      { error: 'Failed to update lesson' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, context) {
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

    if (!ObjectId.isValid(lessonId)) {
      return NextResponse.json({ error: 'Invalid lesson ID' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Delete the lesson
    const result = await db
      .collection('lessons')
      .deleteOne({ _id: new ObjectId(lessonId) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Log admin event
    await db.collection('admin_events').insertOne({
      type: 'lesson_deleted',
      lessonId: new ObjectId(lessonId),
      userId: new ObjectId(session.user.id),
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json(
      { error: 'Failed to delete lesson' },
      { status: 500 }
    );
  }
}
