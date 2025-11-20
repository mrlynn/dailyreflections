import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb';
import Step9Model from '@/lib/models/Step9';
import mongoose from 'mongoose';

// GET: Get a specific amends entry
export async function GET(request, { params }) {
  try {
    const session = await auth();
    const { entryId } = params;

    // Check authentication
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await clientPromise; // Ensure MongoDB connection is established

    // Find the user's inventory
    const inventory = await Step9Model.findOne({
      userId: new mongoose.Types.ObjectId(session.user.id),
      'amendsEntries._id': new mongoose.Types.ObjectId(entryId)
    });

    if (!inventory) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    // Find the specific entry
    const entry = inventory.amendsEntries.find(
      entry => entry._id.toString() === entryId
    );

    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(entry);

  } catch (error) {
    console.error('Error in GET /api/step9/entries/[entryId]:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve amends entry' },
      { status: 500 }
    );
  }
}

// PUT: Update a specific amends entry
export async function PUT(request, { params }) {
  try {
    const session = await auth();
    const { entryId } = params;

    // Check authentication
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const {
      person,
      harmDone,
      amendStatus,
      priority,
      planForAmends,
      notes,
      plannedDate,
      actualAmendsDate,
      amendsMethod,
      amendsDescription,
      outcome,
      followUpNeeded,
      followUpNotes
    } = data;

    // Validate required fields
    if (!person || !harmDone) {
      return NextResponse.json(
        { error: 'Person name and harm done are required fields' },
        { status: 400 }
      );
    }

    await clientPromise; // Ensure MongoDB connection is established

    // Find the user's inventory containing this entry
    const inventory = await Step9Model.findOne({
      userId: new mongoose.Types.ObjectId(session.user.id),
      'amendsEntries._id': new mongoose.Types.ObjectId(entryId)
    });

    if (!inventory) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    // Find the entry to update
    const entryIndex = inventory.amendsEntries.findIndex(
      entry => entry._id.toString() === entryId
    );

    if (entryIndex === -1) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    // Update the entry
    inventory.amendsEntries[entryIndex] = {
      ...inventory.amendsEntries[entryIndex].toObject(),
      person,
      harmDone,
      amendStatus: amendStatus || inventory.amendsEntries[entryIndex].amendStatus,
      priority: priority || inventory.amendsEntries[entryIndex].priority,
      planForAmends: planForAmends !== undefined ? planForAmends : inventory.amendsEntries[entryIndex].planForAmends,
      notes: notes !== undefined ? notes : inventory.amendsEntries[entryIndex].notes,
      plannedDate: plannedDate || inventory.amendsEntries[entryIndex].plannedDate,
      actualAmendsDate: actualAmendsDate || inventory.amendsEntries[entryIndex].actualAmendsDate,
      amendsMethod: amendsMethod || inventory.amendsEntries[entryIndex].amendsMethod,
      amendsDescription: amendsDescription !== undefined ? amendsDescription : inventory.amendsEntries[entryIndex].amendsDescription,
      outcome: outcome !== undefined ? outcome : inventory.amendsEntries[entryIndex].outcome,
      followUpNeeded: followUpNeeded !== undefined ? followUpNeeded : inventory.amendsEntries[entryIndex].followUpNeeded,
      followUpNotes: followUpNotes !== undefined ? followUpNotes : inventory.amendsEntries[entryIndex].followUpNotes,
      updatedAt: new Date()
    };

    await inventory.save();

    return NextResponse.json({ success: true, entry: inventory.amendsEntries[entryIndex] });

  } catch (error) {
    console.error('Error in PUT /api/step9/entries/[entryId]:', error);
    return NextResponse.json(
      { error: 'Failed to update amends entry' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a specific amends entry
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    const { entryId } = params;

    // Check authentication
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await clientPromise; // Ensure MongoDB connection is established

    // Find and update the inventory by removing the entry
    const result = await Step9Model.updateOne(
      {
        userId: new mongoose.Types.ObjectId(session.user.id)
      },
      {
        $pull: { amendsEntries: { _id: new mongoose.Types.ObjectId(entryId) } }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Entry not found or could not be deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in DELETE /api/step9/entries/[entryId]:', error);
    return NextResponse.json(
      { error: 'Failed to delete amends entry' },
      { status: 500 }
    );
  }
}