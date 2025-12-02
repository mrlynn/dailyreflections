import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToMongoose } from '@/lib/mongoose';
import GeneratedArt from '@/lib/models/GeneratedArt';

/**
 * POST /api/admin/agents/art-director/reject
 *
 * Reject generated art (mark for regeneration)
 */
export async function POST(request) {
  try {
    console.log('[Reject API] Starting rejection process...');

    // Check authentication
    const session = await getSession(request);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    // Check for admin role
    const isAdmin = session.user.roles?.includes('admin') || session.user.isAdmin;
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Connect to database
    await connectToMongoose();

    // Parse request body
    const body = await request.json();
    const { art_id, reason } = body;

    if (!art_id) {
      return NextResponse.json(
        { error: 'Missing required field: art_id' },
        { status: 400 }
      );
    }

    console.log(`[Reject API] Rejecting art: ${art_id}`);

    // Get the generated art
    const generatedArt = await GeneratedArt.findOne({ asset_id: art_id });

    if (!generatedArt) {
      return NextResponse.json(
        { error: 'Generated art not found' },
        { status: 404 }
      );
    }

    // Update the art with rejection
    generatedArt.quality_review.approved = false;
    generatedArt.quality_review.approved_by = session.user.id;
    generatedArt.quality_review.approved_at = new Date();
    generatedArt.quality_review.rejection_reason = reason || 'Quality does not meet standards';
    generatedArt.status = 'archived';
    generatedArt.usage.active = false;

    await generatedArt.save();

    console.log(`[Reject API] Art rejected: ${art_id}`);

    return NextResponse.json({
      success: true,
      message: 'Art rejected successfully',
      art_id,
      reason: generatedArt.quality_review.rejection_reason,
    });

  } catch (error) {
    console.error('[Reject API] ERROR:', error);
    return NextResponse.json(
      {
        error: 'Failed to reject art',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
