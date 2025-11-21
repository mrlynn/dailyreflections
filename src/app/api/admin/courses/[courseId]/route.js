/**
 * GET /api/admin/courses/[courseId]
 * Returns a single course with full details
 *
 * PUT /api/admin/courses/[courseId]
 * Updates a course
 *
 * DELETE /api/admin/courses/[courseId]
 * Deletes a course and all its modules and lessons
 */

import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request, context) {
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

    if (!ObjectId.isValid(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    const course = await db
      .collection('courses')
      .findOne({ _id: new ObjectId(courseId) });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}

export async function PUT(request, context) {
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

    if (!ObjectId.isValid(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
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
    if (updates.slug !== undefined) updateDoc.$set.slug = updates.slug;
    if (updates.description !== undefined) updateDoc.$set.description = updates.description;
    if (updates.isActive !== undefined) updateDoc.$set.isActive = updates.isActive;

    // Update course
    const result = await db.collection('courses').updateOne(
      { _id: new ObjectId(courseId) },
      updateDoc
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Log admin event
    await db.collection('admin_events').insertOne({
      type: 'course_updated',
      courseId: new ObjectId(courseId),
      userId: new ObjectId(session.user.id),
      changes: updates,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: 'Failed to update course' },
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

    const { courseId } = await context.params;

    if (!ObjectId.isValid(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Delete all lessons for this course
    const lessonsResult = await db
      .collection('lessons')
      .deleteMany({ courseId: new ObjectId(courseId) });

    // Delete all modules for this course
    const modulesResult = await db
      .collection('modules')
      .deleteMany({ courseId: new ObjectId(courseId) });

    // Delete the course itself
    const courseResult = await db
      .collection('courses')
      .deleteOne({ _id: new ObjectId(courseId) });

    if (courseResult.deletedCount === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Log admin event
    await db.collection('admin_events').insertOne({
      type: 'course_deleted',
      courseId: new ObjectId(courseId),
      userId: new ObjectId(session.user.id),
      data: {
        deletedLessons: lessonsResult.deletedCount,
        deletedModules: modulesResult.deletedCount,
      },
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      deletedCourse: 1,
      deletedModules: modulesResult.deletedCount,
      deletedLessons: lessonsResult.deletedCount,
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}
