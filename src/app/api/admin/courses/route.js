/**
 * GET /api/admin/courses
 * Returns all courses with counts
 *
 * POST /api/admin/courses
 * Creates a new course
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

    const { db } = await connectToDatabase();

    // Fetch all courses with module and lesson counts
    const courses = await db
      .collection('courses')
      .aggregate([
        {
          $lookup: {
            from: 'modules',
            localField: '_id',
            foreignField: 'courseId',
            as: 'modules',
          },
        },
        {
          $lookup: {
            from: 'lessons',
            localField: '_id',
            foreignField: 'courseId',
            as: 'lessons',
          },
        },
        {
          $project: {
            slug: 1,
            title: 1,
            description: 1,
            isActive: 1,
            order: 1,
            moduleCount: { $size: '$modules' },
            lessonCount: { $size: '$lessons' },
            createdAt: 1,
            updatedAt: 1,
          },
        },
        { $sort: { order: 1 } },
      ])
      .toArray();

    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
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
    const { db } = await connectToDatabase();

    // Get the highest order number
    const lastCourse = await db
      .collection('courses')
      .findOne({}, { sort: { order: -1 } });

    const newOrder = (lastCourse?.order || 0) + 1;

    // Create course
    const now = new Date();
    const course = {
      slug: data.slug,
      title: data.title,
      description: data.description || '',
      isActive: data.isActive !== undefined ? data.isActive : true,
      order: newOrder,
      modules: [],
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection('courses').insertOne(course);

    // Log event
    await db.collection('admin_events').insertOne({
      type: 'course_created',
      courseId: result.insertedId,
      userId: new ObjectId(session.user.id),
      data: course,
      createdAt: now,
    });

    return NextResponse.json({ id: result.insertedId, ...course });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}
