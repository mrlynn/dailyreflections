import { NextResponse } from 'next/server';
import { searchReflections, findSimilarReflections } from '@/lib/vectorSearch';
import { getSession } from '@/lib/auth';

/**
 * POST /api/reflections/search
 * Semantic search for reflections using vector embeddings
 *
 * Body parameters:
 * - query: String to search for
 * - limit: Maximum number of results (default: 10)
 * - minScore: Minimum similarity score (default: 0.7)
 * - sourceDate: Optional date key (MM-DD) to find similar reflections to
 *
 * Note: This endpoint does not require authentication
 */
export async function POST(request) {
  console.log('🔍 API: Search request received');

  try {
    // Try to get session but don't require authentication for search
    try {
      const session = await getSession(request);
      console.log('Search request from user:', session?.user?.email || 'Unauthenticated user');
    } catch (authError) {
      // Just log auth errors, but allow the search to proceed
      console.log('Auth error in search, continuing as unauthenticated:', authError.message);
    }

    // Parse request body
    const body = await request.json();
    const { query, limit = 10, minScore = 0.7, sourceDate } = body;
    console.log('📊 API: Search params', { query, limit, minScore, sourceDate });

    // Validate inputs
    if (!query && !sourceDate) {
      return NextResponse.json(
        { error: 'Either query or sourceDate must be provided' },
        { status: 400 }
      );
    }

    if (query && (typeof query !== 'string' || query.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Query string must not be empty' },
        { status: 400 }
      );
    }

    // Set up search options
    const options = {
      limit: Math.min(Math.max(1, parseInt(limit) || 10), 20), // Between 1-20
      minScore: Math.min(Math.max(0, parseFloat(minScore) || 0.7), 1), // Between 0-1
    };

    // Perform search based on input type
    let results;

    if (sourceDate) {
      // Find similar reflections to a specific date
      results = await findSimilarReflections(sourceDate, options);
    } else {
      // Search by text query
      results = await searchReflections(query, options);
    }

    // Process results for the API response
    const processedResults = results.map(reflection => ({
      ...reflection,
      _id: reflection._id.toString(), // Convert ObjectId to string
      score: parseFloat(reflection.score?.toFixed(4) || 0), // Format score to 4 decimal places
    }));

    const response = {
      query: query || `Similar to date: ${sourceDate}`,
      results: processedResults,
      count: processedResults.length,
      minScore: options.minScore
    };

    console.log(`✅ API: Search successful, found ${processedResults.length} results`);
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ API: Error performing vector search:', error);
    console.error('Error details:', error.message, error.stack);

    // Handle specific errors
    if (error.message?.includes('reflections_vector_index') || error.message?.includes('index')) {
      return NextResponse.json(
        {
          error: 'Vector search index issue. Please check the reflections_vector_index in MongoDB Atlas.',
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Check if this might be an auth-related error
    if (error.name === 'AuthError' ||
        error.message?.includes('auth') ||
        error.message?.includes('unauthorized') ||
        error.message?.includes('unauthenticated')) {
      console.log('Auth-related error but continuing with empty results');

      // Return a 200 response with empty results rather than failing
      return NextResponse.json({
        warning: 'Authentication issue detected but search was attempted',
        query: body?.query || body?.sourceDate || 'unknown',
        results: [],
        count: 0,
      });
    }

    // For other errors, return a 500 error response
    return NextResponse.json(
      {
        error: 'Failed to perform search.',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// Revalidate cache
export const revalidate = 3600; // Revalidate every hour

