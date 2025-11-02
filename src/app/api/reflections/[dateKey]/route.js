import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { parseDateKey } from '@/utils/dateUtils';

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

    // Convert ObjectId to string for JSON serialization
    const result = {
      ...reflection,
      _id: reflection._id.toString(),
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

