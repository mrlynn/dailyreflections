/**
 * GET /api/admin/lessons?moduleId=xxx
 * Returns all lessons with course and module information for admin
 * Optionally filtered by moduleId
 *
 * POST /api/admin/lessons
 * Creates a new lesson
 */

import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request) {
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

    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');

    const { db } = await connectToDatabase();

    // Build match criteria
    const matchCriteria = {};
    if (moduleId && ObjectId.isValid(moduleId)) {
      matchCriteria.moduleId = new ObjectId(moduleId);
    }

    // Fetch all lessons with aggregation to include course/module names
    const lessons = await db
      .collection('lessons')
      .aggregate([
        ...(Object.keys(matchCriteria).length > 0 ? [{ $match: matchCriteria }] : []),
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
            status: 1,
            courseId: 1,
            moduleId: 1,
            courseName: '$course.title',
            courseSlug: '$course.slug',
            moduleName: '$module.title',
            moduleSlug: '$module.slug',
            updatedAt: 1,
          },
        },
        {
          $sort: { 'course.order': 1, 'module.order': 1, order: 1 },
        },
      ])
      .toArray();

    return NextResponse.json(lessons);
  } catch (error) {
    console.error('Error fetching lessons for admin:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lessons' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
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

    const data = await request.json();
    const { courseId, moduleId, title, subtitle, slug, approximateDurationMinutes, status } = data;

    if (!courseId || !ObjectId.isValid(courseId)) {
      return NextResponse.json({ error: 'Valid courseId is required' }, { status: 400 });
    }

    if (!moduleId || !ObjectId.isValid(moduleId)) {
      return NextResponse.json({ error: 'Valid moduleId is required' }, { status: 400 });
    }

    if (!title || !slug) {
      return NextResponse.json(
        { error: 'Title and slug are required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Get the highest order number for this module
    const lastLesson = await db
      .collection('lessons')
      .findOne({ moduleId: new ObjectId(moduleId) }, { sort: { order: -1 } });

    const newOrder = (lastLesson?.order || 0) + 1;

    // Create lesson with empty markdown content
    const now = new Date();
    const lesson = {
      courseId: new ObjectId(courseId),
      moduleId: new ObjectId(moduleId),
      slug,
      title,
      subtitle: subtitle || '',
      order: newOrder,
      approximateDurationMinutes: approximateDurationMinutes || 5,
      status: status || 'draft',
      content: {
        body: '# ' + title + '\n\nStart writing your lesson content here...',
      },
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection('lessons').insertOne(lesson);

    // Log event
    await db.collection('admin_events').insertOne({
      type: 'lesson_created',
      lessonId: result.insertedId,
      moduleId: new ObjectId(moduleId),
      courseId: new ObjectId(courseId),
      userId: new ObjectId(session.user.id),
      data: lesson,
      createdAt: now,
    });

    return NextResponse.json({ id: result.insertedId, ...lesson });
  } catch (error) {
    console.error('Error creating lesson:', error);
    return NextResponse.json(
      { error: 'Failed to create lesson' },
      { status: 500 }
    );
  }
}
