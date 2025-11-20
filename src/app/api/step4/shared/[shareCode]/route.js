import { NextResponse } from 'next/server';
import { initMongoose } from '@/lib/mongoose';
import Step4 from '@/lib/models/Step4';
import ShareLink from '@/lib/models/ShareLink';
import bcrypt from 'bcryptjs';

/**
 * GET /api/step4/shared/[shareCode]
 * Retrieve a shared 4th step inventory
 *
 * URL Parameters:
 * - shareCode: The unique code for the shared inventory
 *
 * Query Parameters (optional):
 * - password: If the inventory is password protected
 */
export async function GET(request, { params }) {
  try {
    // Extract the shareCode from params
    let { shareCode } = params;
    const url = new URL(request.url);
    const providedPassword = url.searchParams.get('password');

    console.log('API Route Debug - params:', params);
    console.log('API Route Debug - shareCode from params:', shareCode);

    // If shareCode is not in params, try to extract it from URL pathname
    if (!shareCode) {
      const pathParts = url.pathname.split('/');
      shareCode = pathParts[pathParts.length - 1];
      console.log('API Route Debug - Extracted shareCode from URL:', shareCode);
    }

    console.log('API Route Debug - Final shareCode:', shareCode);

    if (!shareCode) {
      console.log('API Route Debug - Share code is missing!');
      return NextResponse.json({ error: 'Share code is required' }, { status: 400 });
    }

    // Initialize mongoose
    await initMongoose();

    // Find the share link and make sure it's valid
    const shareLink = await ShareLink.findOne({
      shareCode,
      status: 'active',
      expiresAt: { $gt: new Date() } // Not expired
    });

    if (!shareLink) {
      return NextResponse.json({
        error: 'This shared link was not found or has expired',
        errorType: 'link_invalid'
      }, { status: 404 });
    }

    // Find the inventory
    const inventory = await Step4.findById(shareLink.inventoryId);

    if (!inventory) {
      return NextResponse.json({
        error: 'The inventory associated with this link was not found',
        errorType: 'inventory_not_found'
      }, { status: 404 });
    }

    // If inventory is password protected, verify password
    if (inventory.isPasswordProtected) {
      // If no password provided, return password requirement info
      if (!providedPassword) {
        return NextResponse.json({
          needsPassword: true,
          passwordHint: inventory.passwordHint || '',
          metadata: {
            startedAt: inventory.startedAt,
            status: inventory.status
          }
        });
      }

      // Verify password
      const passwordIsValid = await bcrypt.compare(providedPassword, inventory.passwordHash);
      if (!passwordIsValid) {
        return NextResponse.json({
          error: 'Invalid password',
          errorType: 'invalid_password'
        }, { status: 403 });
      }
    }

    // Update access count
    await ShareLink.updateOne(
      { _id: shareLink._id },
      { $inc: { accessCount: 1 } }
    );

    // Return inventory data (excluding password hash)
    const inventoryObj = inventory.toObject();
    const { passwordHash, ...safeInventory } = inventoryObj;
    const sponsorFeedback = {
      resentments: Array.isArray(safeInventory?.sponsorFeedback?.resentments) ? safeInventory.sponsorFeedback.resentments : [],
      fears: Array.isArray(safeInventory?.sponsorFeedback?.fears) ? safeInventory.sponsorFeedback.fears : [],
      sexConduct: Array.isArray(safeInventory?.sponsorFeedback?.sexConduct) ? safeInventory.sponsorFeedback.sexConduct : [],
      harmsDone: Array.isArray(safeInventory?.sponsorFeedback?.harmsDone) ? safeInventory.sponsorFeedback.harmsDone : []
    };

    return NextResponse.json({
      inventory: {
        ...safeInventory,
        sponsorFeedback
      },
      shareInfo: {
        createdAt: shareLink.createdAt,
        expiresAt: shareLink.expiresAt,
        accessCount: shareLink.accessCount + 1,
        note: shareLink.note || ''
      }
    });
  } catch (error) {
    console.error('Error retrieving shared inventory:', error);
    return NextResponse.json({
      error: 'Failed to retrieve shared inventory',
      errorType: 'server_error'
    }, { status: 500 });
  }
}