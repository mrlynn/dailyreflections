import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import GeneratedArt from '@/lib/models/GeneratedArt';

/**
 * GET /api/art/step?number=1
 *
 * Get the generated art for a specific step (1-12)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const stepNumber = searchParams.get('number');

    if (!stepNumber) {
      return NextResponse.json(
        { error: 'Step number parameter is required' },
        { status: 400 }
      );
    }

    const num = parseInt(stepNumber, 10);
    if (isNaN(num) || num < 1 || num > 12) {
      return NextResponse.json(
        { error: 'Step number must be between 1 and 12' },
        { status: 400 }
      );
    }

    // Connect to database
    const client = await clientPromise;
    const db = client.db('dailyreflections');

    // Get active art for this step
    const artwork = await GeneratedArt.getActiveArt(
      'step_illustration',
      'step_number',
      stepNumber
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
        altText: `Step ${stepNumber} illustration`,
        styleCharacteristics: artwork.style_characteristics,
        prompt: artwork.prompt.enhanced_prompt,
      },
    });
  } catch (error) {
    console.error('Error fetching step art:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch artwork',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
