import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongodb';
import Step4 from '@/lib/models/Step4';
import mongoose, { initMongoose } from '@/lib/mongoose';

/**
 * POST /api/step4/restart
 * Create a new 4th step inventory, optionally archiving the old one
 */
export async function POST(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const data = await request.json();
    const { oldInventoryId, archiveOld = true } = data;

    // Connect to database
    await connectToDatabase();

    // Initialize mongoose connection
    await initMongoose();

    // If specified, archive the old inventory
    if (oldInventoryId && archiveOld) {
      await Step4.updateOne(
        {
          _id: new mongoose.Types.ObjectId(oldInventoryId),
          userId: new mongoose.Types.ObjectId(userId)
        },
        { $set: { status: 'archived' } }
      );
    }

    // Create a new blank inventory
    const newInventory = new Step4({
      userId: new mongoose.Types.ObjectId(userId),
      startedAt: new Date(),
      lastActive: new Date(),
      status: 'in_progress',
      progress: {
        currentStep: 0,
        resentmentsComplete: false,
        fearsComplete: false,
        sexConductComplete: false,
        harmsDoneComplete: false
      },
      resentments: [],
      fears: [],
      sexConduct: {
        relationships: [],
        patterns: '',
        idealBehavior: ''
      },
      harmsDone: [],
      isPasswordProtected: false
    });

    await newInventory.save();

    return NextResponse.json({
      success: true,
      inventoryId: newInventory._id,
      inventory: newInventory.toObject()
    });
  } catch (error) {
    console.error('Error restarting 4th step inventory:', error);
    return NextResponse.json({ error: 'Failed to restart inventory' }, { status: 500 });
  }
}