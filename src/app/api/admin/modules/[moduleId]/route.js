/**
 * GET /api/admin/modules/[moduleId]
 * Returns a single module with full details
 *
 * PUT /api/admin/modules/[moduleId]
 * Updates a module
 *
 * DELETE /api/admin/modules/[moduleId]
 * Deletes a module and all its lessons
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

    const { moduleId } = await context.params;

    if (!ObjectId.isValid(moduleId)) {
      return NextResponse.json({ error: 'Invalid module ID' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    const module = await db
      .collection('modules')
      .findOne({ _id: new ObjectId(moduleId) });

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    return NextResponse.json(module);
  } catch (error) {
    console.error('Error fetching module:', error);
    return NextResponse.json(
      { error: 'Failed to fetch module' },
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

    const { moduleId } = await context.params;

    if (!ObjectId.isValid(moduleId)) {
      return NextResponse.json({ error: 'Invalid module ID' }, { status: 400 });
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

    // Update module
    const result = await db.collection('modules').updateOne(
      { _id: new ObjectId(moduleId) },
      updateDoc
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Log admin event
    await db.collection('admin_events').insertOne({
      type: 'module_updated',
      moduleId: new ObjectId(moduleId),
      userId: new ObjectId(session.user.id),
      changes: updates,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error updating module:', error);
    return NextResponse.json(
      { error: 'Failed to update module' },
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

    const { moduleId } = await context.params;

    if (!ObjectId.isValid(moduleId)) {
      return NextResponse.json({ error: 'Invalid module ID' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Delete all lessons for this module
    const lessonsResult = await db
      .collection('lessons')
      .deleteMany({ moduleId: new ObjectId(moduleId) });

    // Delete the module itself
    const moduleResult = await db
      .collection('modules')
      .deleteOne({ _id: new ObjectId(moduleId) });

    if (moduleResult.deletedCount === 0) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Log admin event
    await db.collection('admin_events').insertOne({
      type: 'module_deleted',
      moduleId: new ObjectId(moduleId),
      userId: new ObjectId(session.user.id),
      data: {
        deletedLessons: lessonsResult.deletedCount,
      },
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      deletedModule: 1,
      deletedLessons: lessonsResult.deletedCount,
    });
  } catch (error) {
    console.error('Error deleting module:', error);
    return NextResponse.json(
      { error: 'Failed to delete module' },
      { status: 500 }
    );
  }
}
