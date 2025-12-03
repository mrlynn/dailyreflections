import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { parseDateKey } from '@/utils/dateUtils';
import { connectToMongoose } from '@/lib/mongoose';
import GeneratedArt from '@/lib/models/GeneratedArt';

/**
 * Check if an image exists for a specific dateKey
 * Checks GeneratedArt model first, then falls back to legacy location
 * @param {string} dateKey - Date key in MM-DD format (e.g., "12-02")
 * @returns {Promise<{exists: boolean, format: string, url: string}>} - Image info
 */
async function getImageInfo(dateKey) {
  try {
    // Connect to mongoose to query GeneratedArt model
    await connectToMongoose();

    // Convert MM-DD to YYYY-MM-DD format for the current year
    const currentYear = new Date().getFullYear();
    const fullDate = `${currentYear}-${dateKey}`;

    // Check if there's generated art for this date
    const generatedArt = await GeneratedArt.findOne({
      art_type: 'daily_reflection',
      'content_reference.reference_value': fullDate,
      status: 'completed',
      'usage.active': true,
    })
      .sort({ version: -1, createdAt: -1 })
      .lean();

    if (generatedArt && generatedArt.image) {
      // Use stored_url (permanent storage) if available, otherwise fall back to OpenAI CDN url
      const imageUrl = generatedArt.image.stored_url || generatedArt.image.url;

      return {
        exists: true,
        format: generatedArt.image.format || 'png',
        url: imageUrl,
      };
    }
  } catch (error) {
    console.error('Error checking GeneratedArt:', error);
    // Continue to fallback below
  }

  // Fallback: Legacy image location
  const jpgUrl = `/reflections/${dateKey}.jpg`;

  return {
    exists: true, // We assume it exists and let the frontend handle any load failures
    format: 'jpg',
    url: jpgUrl
  };
}

/**
 * GET /api/reflections/[dateKey]
 * Fetch a single reflection by dateKey (MM-DD format)
 */
export async function GET(request, { params }) {
  try {
    const { dateKey } = await params;

    // Validate dateKey format
    if (!/^\d{2}-\d{2}$/.test(dateKey)) {
      return NextResponse.json(
        { error: 'Invalid dateKey format. Expected MM-DD.' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('dailyreflections');
    const { month, day } = parseDateKey(dateKey);

    const reflection = await db.collection('reflections').findOne({
      month,
      day,
    });

    if (!reflection) {
      return NextResponse.json(
        { error: 'Reflection not found for this date.' },
        { status: 404 }
      );
    }

    // Get image info without filesystem checks
    const imageInfo = await getImageInfo(dateKey);

    // Convert ObjectId to string for JSON serialization
    const result = {
      ...reflection,
      _id: reflection._id.toString(),
      image: {
        url: imageInfo.url,
        exists: imageInfo.exists,
        format: imageInfo.format
      }
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching reflection:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reflection.' },
      { status: 500 }
    );
  }
}

// Enable revalidation for ISR (Incremental Static Regeneration)
export const revalidate = 3600; // Revalidate every hour