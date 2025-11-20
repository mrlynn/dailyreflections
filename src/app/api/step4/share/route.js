import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { nanoid } from 'nanoid';
import { initMongoose } from '@/lib/mongoose';
import Step4 from '@/lib/models/Step4';
import ShareLink from '@/lib/models/ShareLink';
import mongoose from '@/lib/mongoose';

/**
 * POST /api/step4/share
 * Create a shareable link for a 4th step inventory
 *
 * Required body parameters:
 * - inventoryId: ID of the inventory to share
 *
 * Optional parameters:
 * - expiresInDays: Number of days until link expires (default: 7)
 * - note: Optional note to include with the share
 */
export async function POST(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { inventoryId, expiresInDays = 7, note = '' } = body;

    if (!inventoryId) {
      return NextResponse.json({ error: 'Inventory ID is required' }, { status: 400 });
    }

    // Initialize mongoose
    await initMongoose();

    // Verify inventory exists and belongs to user
    const inventory = await Step4.findOne({
      _id: new mongoose.Types.ObjectId(inventoryId),
      userId: new mongoose.Types.ObjectId(session.user.id)
    });

    if (!inventory) {
      return NextResponse.json({ error: 'Inventory not found' }, { status: 404 });
    }

    // Generate a unique share code (will be part of URL)
    const shareCode = nanoid(10);

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create share link record
    const shareLink = new ShareLink({
      shareCode,
      inventoryId: new mongoose.Types.ObjectId(inventoryId),
      userId: new mongoose.Types.ObjectId(session.user.id),
      createdAt: new Date(),
      expiresAt,
      isPasswordProtected: inventory.isPasswordProtected,
      note
    });

    await shareLink.save();

    // Create the share URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}`;
    const shareUrl = `${baseUrl}/step4/shared/${shareCode}`;

    return NextResponse.json({
      shareCode,
      shareUrl,
      isPasswordProtected: inventory.isPasswordProtected,
      expiresAt
    });
  } catch (error) {
    console.error('Error creating share link:', error);
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 });
  }
}

/**
 * GET /api/step4/share
 * List all share links created by the current user
 */
export async function GET(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Initialize mongoose
    await initMongoose();

    // Get all share links for user
    const shareLinks = await ShareLink.find({
      userId: new mongoose.Types.ObjectId(session.user.id)
    }).sort({ createdAt: -1 });

    // Format share links with URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}`;

    const formattedLinks = shareLinks.map(link => {
      const linkObj = link.toObject();
      return {
        ...linkObj,
        shareUrl: `${baseUrl}/step4/shared/${link.shareCode}`,
        isActive: link.status === 'active' && new Date(link.expiresAt) > new Date()
      };
    });

    return NextResponse.json({ shareLinks: formattedLinks });
  } catch (error) {
    console.error('Error listing share links:', error);
    return NextResponse.json({ error: 'Failed to list share links' }, { status: 500 });
  }
}

/**
 * DELETE /api/step4/share
 * Revoke a share link
 *
 * Required body parameters:
 * - shareCode: The code of the share link to revoke
 */
export async function DELETE(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { shareCode } = body;

    if (!shareCode) {
      return NextResponse.json({ error: 'Share code is required' }, { status: 400 });
    }

    // Initialize mongoose
    await initMongoose();

    // Find and update the share link
    const result = await ShareLink.updateOne(
      {
        shareCode,
        userId: new mongoose.Types.ObjectId(session.user.id)
      },
      {
        $set: { status: 'revoked' }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error revoking share link:', error);
    return NextResponse.json({ error: 'Failed to revoke share link' }, { status: 500 });
  }
}