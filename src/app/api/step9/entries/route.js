import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb';
import Step9Model from '@/lib/models/Step9';
import mongoose from 'mongoose';

// POST: Add a new amends entry
export async function POST(request) {
  try {
    const session = await auth();

    // Check authentication
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { person, harmDone, amendStatus, priority, planForAmends, notes } = data;

    // Validate required fields
    if (!person || !harmDone) {
      return NextResponse.json(
        { error: 'Person name and harm done are required fields' },
        { status: 400 }
      );
    }

    await clientPromise; // Ensure MongoDB connection is established

    // Find the user's inventory
    let inventory = await Step9Model.findOne({
      userId: new mongoose.Types.ObjectId(session.user.id)
    });

    // If no inventory exists, create one
    if (!inventory) {
      inventory = new Step9Model({
        userId: new mongoose.Types.ObjectId(session.user.id),
        amendsEntries: []
      });
    }

    // Create new amends entry
    const newEntry = {
      person,
      harmDone,
      amendStatus: amendStatus || 'not_started',
      priority: priority || 'medium',
      planForAmends: planForAmends || '',
      notes: notes || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add to amendsEntries array
    inventory.amendsEntries.push(newEntry);
    await inventory.save();

    return NextResponse.json({ success: true, entry: newEntry });

  } catch (error) {
    console.error('Error in POST /api/step9/entries:', error);
    return NextResponse.json(
      { error: 'Failed to add amends entry' },
      { status: 500 }
    );
  }
}

// GET: List all amends entries
export async function GET(request) {
  try {
    const session = await auth();

    // Check authentication
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await clientPromise; // Ensure MongoDB connection is established

    // Find the user's inventory
    const inventory = await Step9Model.findOne({
      userId: new mongoose.Types.ObjectId(session.user.id)
    });

    if (!inventory) {
      return NextResponse.json({ entries: [] });
    }

    return NextResponse.json({ entries: inventory.amendsEntries || [] });

  } catch (error) {
    console.error('Error in GET /api/step9/entries:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve amends entries' },
      { status: 500 }
    );
  }
}