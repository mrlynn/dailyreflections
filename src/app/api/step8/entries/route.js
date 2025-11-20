import { NextResponse } from 'next/server';
import { auth } from "../../auth/[...nextauth]/route";
import { findOrCreateStep8ForUser, addAmendsEntry } from '@/lib/models/Step8';

// Add a new amends entry
export async function POST(request) {
  try {
    // Ensure the user is authenticated
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entryData = await request.json();

    // Validate required fields
    if (!entryData.person || !entryData.harmDone) {
      return NextResponse.json(
        { error: 'Person name and harm done are required' },
        { status: 400 }
      );
    }

    // Find or create the user's Step 8 inventory
    let inventory = await findOrCreateStep8ForUser(session.user.id);

    // Add the new entry
    const updatedInventory = await addAmendsEntry(
      inventory._id,
      session.user.id,
      entryData
    );

    return NextResponse.json(updatedInventory);
  } catch (error) {
    console.error('Error adding Step 8 amends entry:', error);
    return NextResponse.json(
      { error: 'Failed to add amends entry' },
      { status: 500 }
    );
  }
}

// Get all amends entries (with optional filtering)
export async function GET(request) {
  try {
    // Ensure the user is authenticated
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the user's inventory
    const inventory = await findOrCreateStep8ForUser(session.user.id);

    // Get URL parameters for filtering
    const url = new URL(request.url);
    const willingnessStatus = url.searchParams.get('willingnessStatus');
    const priority = url.searchParams.get('priority');

    // Apply filters if present
    let entries = inventory.amendsEntries || [];

    if (willingnessStatus) {
      entries = entries.filter(entry => entry.willingnessStatus === willingnessStatus);
    }

    if (priority) {
      entries = entries.filter(entry => entry.priority === priority);
    }

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Error retrieving Step 8 amends entries:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve amends entries' },
      { status: 500 }
    );
  }
}