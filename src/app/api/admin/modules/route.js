/**
 * GET /api/admin/modules?courseId=xxx
 * Returns all modules for a course with lesson counts
 *
 * POST /api/admin/modules
 * Creates a new module
 */

import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request) {
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

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId || !ObjectId.isValid(courseId)) {
      return NextResponse.json({ error: 'Valid courseId is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Fetch all modules for this course with lesson counts
    const modules = await db
      .collection('modules')
      .aggregate([
        { $match: { courseId: new ObjectId(courseId) } },
        {
          $lookup: {
            from: 'lessons',
            localField: '_id',
            foreignField: 'moduleId',
            as: 'lessons',
          },
        },
        {
          $project: {
            slug: 1,
            title: 1,
            description: 1,
            order: 1,
            lessonCount: { $size: '$lessons' },
            createdAt: 1,
            updatedAt: 1,
          },
        },
        { $sort: { order: 1 } },
      ])
      .toArray();

    return NextResponse.json(modules);
  } catch (error) {
    console.error('Error fetching modules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch modules' },
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
    const { courseId, title, slug, description } = data;

    if (!courseId || !ObjectId.isValid(courseId)) {
      return NextResponse.json({ error: 'Valid courseId is required' }, { status: 400 });
    }

    if (!title || !slug) {
      return NextResponse.json(
        { error: 'Title and slug are required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Get the highest order number for this course
    const lastModule = await db
      .collection('modules')
      .findOne({ courseId: new ObjectId(courseId) }, { sort: { order: -1 } });

    const newOrder = (lastModule?.order || 0) + 1;

    // Create module
    const now = new Date();
    const module = {
      courseId: new ObjectId(courseId),
      slug,
      title,
      description: description || '',
      order: newOrder,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection('modules').insertOne(module);

    // Log event
    await db.collection('admin_events').insertOne({
      type: 'module_created',
      moduleId: result.insertedId,
      courseId: new ObjectId(courseId),
      userId: new ObjectId(session.user.id),
      data: module,
      createdAt: now,
    });

    return NextResponse.json({ id: result.insertedId, ...module });
  } catch (error) {
    console.error('Error creating module:', error);
    return NextResponse.json(
      { error: 'Failed to create module' },
      { status: 500 }
    );
  }
}
