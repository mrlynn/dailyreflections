import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

/**
 * API handler to list all daily thoughts
 * Supports pagination and optional filtering
 *
 * @param {Request} request - The request object with query parameters
 * @returns {Object} List of daily thoughts with pagination info
 */
export async function GET(request) {
  try {
    const url = new URL(request.url);

    // Parse pagination parameters
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Parse optional month filter
    const monthParam = url.searchParams.get('month');
    const month = monthParam ? parseInt(monthParam, 10) : null;

    const { db } = await connectToDatabase();

    // Build query filters
    const query = { active: true };
    if (month !== null && !isNaN(month)) {
      query.month = month;
    }

    // Get total count for pagination
    const total = await db.collection('dailyThoughts').countDocuments(query);

    // Get thoughts with pagination
    const thoughts = await db.collection('dailyThoughts')
      .find(query)
      .sort({ month: 1, day: 1 }) // Sort by date
      .skip(skip)
      .limit(limit)
      .toArray();

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Return thoughts with pagination info
    return NextResponse.json({
      success: true,
      data: {
        thoughts,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage,
          hasPrevPage
        }
      }
    });

  } catch (error) {
    console.error('Error listing daily thoughts:', error);

    // Return error with appropriate status
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to list daily thoughts'
      },
      { status: 500 }
    );
  }
}