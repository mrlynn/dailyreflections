import { NextResponse } from 'next/server';
import { auth } from "../auth/[...nextauth]/route";
import { findOrCreateStep8ForUser, updateStep8 } from '@/lib/models/Step8';

// Create or get a user's Step 8 inventory
export async function GET(request) {
  try {
    // Ensure the user is authenticated
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find or create the user's Step 8 inventory
    const inventory = await findOrCreateStep8ForUser(session.user.id);

    return NextResponse.json(inventory);
  } catch (error) {
    console.error('Error retrieving Step 8 inventory:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve Step 8 inventory' },
      { status: 500 }
    );
  }
}

// Update overall inventory status/metadata
export async function PUT(request) {
  try {
    // Ensure the user is authenticated
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Find or create the user's inventory (this ensures we have an ID to update)
    let inventory = await findOrCreateStep8ForUser(session.user.id);

    // Update the inventory
    const updatedInventory = await updateStep8(
      inventory._id,
      session.user.id,
      data
    );

    return NextResponse.json(updatedInventory);
  } catch (error) {
    console.error('Error updating Step 8 inventory:', error);
    return NextResponse.json(
      { error: 'Failed to update Step 8 inventory' },
      { status: 500 }
    );
  }
}