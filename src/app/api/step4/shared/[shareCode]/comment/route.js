import { NextResponse } from 'next/server';
import ShareLink from '@/lib/models/ShareLink';
import Step4 from '@/lib/models/Step4';
import { initMongoose } from '@/lib/mongoose';

const ALLOWED_SECTIONS = new Set(['resentments', 'fears', 'sexConduct', 'harmsDone']);

export async function POST(request, { params }) {
  try {
    const resolvedParams = typeof params?.then === 'function' ? await params : params;
    const { shareCode } = resolvedParams || {};

    if (!shareCode) {
      return NextResponse.json({ error: 'Share code is required' }, { status: 400 });
    }

    const body = await request.json();
    const section = (body.section || '').toString();
    const rawComment = (body.comment || '').toString();
    const rawAuthor = (body.authorName || '').toString();

    if (!ALLOWED_SECTIONS.has(section)) {
      return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
    }

    const comment = rawComment.trim();
    if (!comment) {
      return NextResponse.json({ error: 'Comment is required' }, { status: 400 });
    }

    if (comment.length > 4000) {
      return NextResponse.json({ error: 'Comment is too long (max 4000 characters)' }, { status: 400 });
    }

    const authorName = rawAuthor.trim().slice(0, 120) || 'Sponsor';

    await initMongoose();

    const shareLink = await ShareLink.findOne({
      shareCode,
      status: 'active',
      expiresAt: { $gt: new Date() }
    });

    if (!shareLink) {
      return NextResponse.json({ error: 'Shared link is invalid or expired' }, { status: 404 });
    }

    const feedbackEntry = {
      authorName,
      body: comment,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const pushPath = `sponsorFeedback.${section}`;

    const updatedInventory = await Step4.findByIdAndUpdate(
      shareLink.inventoryId,
      {
        $push: {
          [pushPath]: {
            $each: [feedbackEntry],
            $position: 0,
            $slice: -20
          }
        },
        $set: {
          updatedAt: new Date()
        }
      },
      {
        new: true,
        runValidators: true
      }
    ).lean();

    if (!updatedInventory) {
      return NextResponse.json({ error: 'Inventory not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      sponsorFeedback: updatedInventory.sponsorFeedback
    });
  } catch (error) {
    console.error('Error saving sponsor feedback:', error);
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }
}

