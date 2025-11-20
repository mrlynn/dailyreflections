import { NextResponse } from 'next/server';
import { auth } from "../../../auth/[...nextauth]/route";
import {
  findOrCreateStep8ForUser,
  updateAmendsEntry,
  deleteAmendsEntry
} from '@/lib/models/Step8';

// Update a specific amends entry
export async function PUT(request, { params }) {
  try {
    // Ensure the user is authenticated
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entryId } = params;
    const updateData = await request.json();

    // Find the user's inventory
    const inventory = await findOrCreateStep8ForUser(session.user.id);

    // Update the entry
    try {
      const updatedInventory = await updateAmendsEntry(
        inventory._id,
        session.user.id,
        entryId,
        updateData
      );
      return NextResponse.json(updatedInventory);
    } catch (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error updating Step 8 amends entry:', error);
    return NextResponse.json(
      { error: 'Failed to update amends entry' },
      { status: 500 }
    );
  }
}

// Delete a specific amends entry
export async function DELETE(request, { params }) {
  try {
    // Ensure the user is authenticated
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entryId } = params;

    // Find the user's inventory
    const inventory = await findOrCreateStep8ForUser(session.user.id);

    // Delete the entry
    try {
      const updatedInventory = await deleteAmendsEntry(
        inventory._id,
        session.user.id,
        entryId
      );
      return NextResponse.json({ success: true, inventory: updatedInventory });
    } catch (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error deleting Step 8 amends entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete amends entry' },
      { status: 500 }
    );
  }
}