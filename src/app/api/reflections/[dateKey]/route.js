import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { parseDateKey } from '@/utils/dateUtils';

/**
 * Check if an image exists for a specific dateKey
 * This version is production-safe and doesn't use filesystem checks
 * @param {string} dateKey - Date key in MM-DD format
 * @returns {Promise<{exists: boolean, format: string, url: string}>} - Image info
 */
async function getImageInfo(dateKey) {
  // First, check for JPG format (preferred)
  const jpgUrl = `/reflections/${dateKey}.jpg`;

  // We assume the file exists if it's in the expected format
  // This is safe because in both development and production:
  // - If the file exists at this path, it will load
  // - If not, the Image component will handle the error and fall back
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