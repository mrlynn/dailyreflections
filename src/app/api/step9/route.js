import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { connectToMongoose } from '@/lib/mongoose';
import Step9Model from '@/lib/models/Step9';
import mongoose from 'mongoose';
import { Step8, findOrCreateStep8ForUser } from '@/lib/models/Step8';

// GET: Retrieve or create a Step 9 inventory for the logged-in user
export async function GET(request) {
  try {
    const session = await auth();

    // Check authentication
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToMongoose(); // Ensure Mongoose connection is established

    // Attempt to find existing Step 9 inventory for this user
    let inventory = await Step9Model.findOne({
      userId: new mongoose.Types.ObjectId(session.user.id)
    });

    // If no inventory exists, create one
    if (!inventory) {
      // Check if user has a Step 8 inventory to import from
      const step8Inventory = await findOrCreateStep8ForUser(session.user.id);

      // Create new Step 9 inventory
      inventory = new Step9Model({
        userId: new mongoose.Types.ObjectId(session.user.id),
        amendsEntries: [],
      });

      // If Step 8 inventory exists, import eligible entries
      if (step8Inventory && step8Inventory.amendsEntries && step8Inventory.amendsEntries.length > 0) {
        // Only import entries where willingness status is "willing" or "completed"
        const eligibleEntries = step8Inventory.amendsEntries.filter(
          entry => ['willing', 'completed'].includes(entry.willingnessStatus)
        );

        // Map Step 8 entries to Step 9 format
        if (eligibleEntries.length > 0) {
          inventory.amendsEntries = eligibleEntries.map(entry => ({
            person: entry.person,
            harmDone: entry.harmDone,
            amendStatus: entry.willingnessStatus === 'completed' ? 'completed' : 'not_started',
            priority: entry.priority || 'medium',
            planForAmends: entry.planForAmends || '',
            notes: entry.notes || '',
            stepEightEntryId: entry._id,
          }));
        }
      }

      await inventory.save();
    }

    return NextResponse.json(inventory);

  } catch (error) {
    console.error('Error in GET /api/step9:', error);

    // Specific error handling for common MongoDB/Mongoose errors
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      return NextResponse.json(
        { error: 'Database connection error. Please try again later.' },
        { status: 503 } // Service Unavailable
      );
    }

    return NextResponse.json(
      { error: 'Failed to retrieve Step 9 inventory' },
      { status: 500 }
    );
  }
}

// PUT: Update the overall status of the Step 9 inventory
export async function PUT(request) {
  try {
    const session = await auth();

    // Check authentication
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { status } = data;

    await connectToMongoose(); // Ensure Mongoose connection is established

    // Find the user's inventory
    const inventory = await Step9Model.findOne({
      userId: new mongoose.Types.ObjectId(session.user.id)
    });

    if (!inventory) {
      return NextResponse.json(
        { error: 'Step 9 inventory not found' },
        { status: 404 }
      );
    }

    // Update status and related fields
    inventory.status = status;

    if (status === 'completed' && !inventory.completedAt) {
      inventory.completedAt = new Date();
    } else if (status === 'in_progress') {
      inventory.completedAt = null;
    }

    await inventory.save();

    return NextResponse.json({ success: true, inventory });

  } catch (error) {
    console.error('Error in PUT /api/step9:', error);

    // Specific error handling for common MongoDB/Mongoose errors
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      return NextResponse.json(
        { error: 'Database connection error. Please try again later.' },
        { status: 503 } // Service Unavailable
      );
    }

    return NextResponse.json(
      { error: 'Failed to update Step 9 inventory status' },
      { status: 500 }
    );
  }
}