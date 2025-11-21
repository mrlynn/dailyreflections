/**
 * POST /api/admin/modules/[moduleId]/reorder
 * Reorders a module (moves it up or down in the list)
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

    const { moduleId } = await context.params;
    const { direction } = await request.json();

    if (!ObjectId.isValid(moduleId)) {
      return NextResponse.json({ error: 'Invalid module ID' }, { status: 400 });
    }

    if (!['up', 'down'].includes(direction)) {
      return NextResponse.json(
        { error: 'Direction must be "up" or "down"' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Get the current module
    const module = await db
      .collection('modules')
      .findOne({ _id: new ObjectId(moduleId) });

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    const currentOrder = module.order;
    const courseId = module.courseId;

    // Find the adjacent module to swap with (within the same course)
    const adjacentModule = await db
      .collection('modules')
      .findOne({
        courseId: courseId,
        order: direction === 'up' ? currentOrder - 1 : currentOrder + 1,
      });

    if (!adjacentModule) {
      // Already at the top/bottom
      return NextResponse.json({ success: true, message: 'No reordering needed' });
    }

    // Swap the order values
    await db.collection('modules').updateOne(
      { _id: new ObjectId(moduleId) },
      { $set: { order: adjacentModule.order, updatedAt: new Date() } }
    );

    await db.collection('modules').updateOne(
      { _id: adjacentModule._id },
      { $set: { order: currentOrder, updatedAt: new Date() } }
    );

    // Log admin event
    await db.collection('admin_events').insertOne({
      type: 'module_reordered',
      moduleId: new ObjectId(moduleId),
      userId: new ObjectId(session.user.id),
      data: {
        direction,
        oldOrder: currentOrder,
        newOrder: adjacentModule.order,
      },
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering module:', error);
    return NextResponse.json(
      { error: 'Failed to reorder module' },
      { status: 500 }
    );
  }
}
