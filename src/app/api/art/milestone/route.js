import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import GeneratedArt from '@/lib/models/GeneratedArt';

/**
 * GET /api/art/milestone?type=30_days
 *
 * Get the generated art for a specific milestone badge
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const milestoneType = searchParams.get('type');

    if (!milestoneType) {
      return NextResponse.json(
        { error: 'Milestone type parameter is required' },
        { status: 400 }
      );
    }

    // Connect to database
    const client = await clientPromise;
    const db = client.db('dailyreflections');

    // Get active art for this milestone
    const artwork = await GeneratedArt.getActiveArt(
      'milestone_badge',
      'milestone_type',
      milestoneType
    );

    if (!artwork) {
      return NextResponse.json(
        { hasArt: false },
        { status: 200 }
      );
    }

    // Record usage
    await artwork.recordUsage();

    return NextResponse.json({
      hasArt: true,
      artwork: {
        imageUrl: artwork.current_image_url,
        altText: `${milestoneType.replace('_', ' ')} milestone badge`,
        styleCharacteristics: artwork.style_characteristics,
        prompt: artwork.prompt.enhanced_prompt,
      },
    });
  } catch (error) {
    console.error('Error fetching milestone art:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch artwork',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
