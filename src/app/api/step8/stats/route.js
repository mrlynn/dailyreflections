import { NextResponse } from 'next/server';
import { auth } from "../../auth/[...nextauth]/route";
import { getStep8Stats } from '@/lib/models/Step8';

// Get statistics about the user's Step 8 progress
export async function GET(request) {
  try {
    // Ensure the user is authenticated
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get statistics for the user's Step 8 inventory
    const stats = await getStep8Stats(session.user.id);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error retrieving Step 8 statistics:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve Step 8 statistics' },
      { status: 500 }
    );
  }
}