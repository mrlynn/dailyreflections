import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import GeneratedArt from '@/lib/models/GeneratedArt';

/**
 * GET /api/art/daily-reflection?date=YYYY-MM-DD
 *
 * Get the generated art for a specific daily reflection date
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    // Connect to database
    const client = await clientPromise;
    const db = client.db('dailyreflections');

    // Get active art for this date
    const artwork = await GeneratedArt.getActiveArt(
      'daily_reflection',
      'date',
      date
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
        altText: `Daily reflection for ${date}`,
        styleCharacteristics: artwork.style_characteristics,
        prompt: artwork.prompt.enhanced_prompt,
      },
    });
  } catch (error) {
    console.error('Error fetching daily reflection art:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch artwork',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
