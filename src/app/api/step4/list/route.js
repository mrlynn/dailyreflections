import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongodb';
import Step4 from '@/lib/models/Step4';
import mongoose, { initMongoose } from '@/lib/mongoose';

/**
 * GET /api/step4/list
 * List all user's 4th step inventories
 */
export async function GET(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const url = new URL(request.url);
    const includeArchived = url.searchParams.get('includeArchived') === 'true';

    // Connect to database
    await connectToDatabase();

    // Initialize mongoose connection
    await initMongoose();

    // Query conditions
    const query = { userId: new mongoose.Types.ObjectId(userId) };

    // Exclude archived inventories unless explicitly requested
    if (!includeArchived) {
      query.status = { $ne: 'archived' };
    }

    // Get all user's inventories (summaries only)
    const inventories = await Step4.find(
      query,
      {
        _id: 1,
        startedAt: 1,
        lastActive: 1,
        status: 1,
        progress: 1,
        isPasswordProtected: 1,
        passwordHint: 1
      }
    ).sort({ lastActive: -1 });

    return NextResponse.json({ inventories });
  } catch (error) {
    console.error('Error listing 4th step inventories:', error);
    return NextResponse.json({ error: 'Failed to retrieve inventory list' }, { status: 500 });
  }
}