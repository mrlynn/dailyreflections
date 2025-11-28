import { NextResponse } from 'next/server';
import Resource from '@/lib/models/Resource';
import mongoose from '@/lib/mongoose';

/**
 * POST /api/articles/search
 * Search published blog articles and resources
 *
 * Body parameters:
 * - query: String to search for
 * - limit: Maximum number of results (default: 10)
 * - resourceType: Optional filter by resource type (e.g., 'article', 'blog')
 *
 * Note: Only returns published articles (status: 'published')
 */
export async function POST(request) {
  console.log('🔍 API: Articles search request received');

  try {
    // Ensure mongoose is connected
    await mongoose.connect();

    // Parse request body
    const body = await request.json();
    const { query, limit = 10, resourceType = null } = body;

    console.log('📊 API: Articles search params', { query, limit, resourceType });

    // Validate inputs
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query string must not be empty' },
        { status: 400 }
      );
    }

    // Set up search options
    const searchLimit = Math.min(Math.max(1, parseInt(limit) || 10), 50); // Between 1-50

    // Build query - only published articles
    const searchQuery = {
      status: 'published',
      $text: { $search: query }
    };

    // Add resource type filter if provided
    if (resourceType) {
      searchQuery.resourceType = resourceType;
    }

    // Perform text search using MongoDB text index
    const results = await Resource
      .find(
        searchQuery,
        {
          score: { $meta: 'textScore' }
        }
      )
      .select('slug title summary resourceType topics publishedAt createdAt')
      .sort({ score: { $meta: 'textScore' } })
      .limit(searchLimit)
      .lean();

    console.log(`✅ Text search found ${results.length} results`);

    // Process results for API response
    const processedResults = results.map(article => {
      // Create excerpt from summary or truncate
      let excerpt = article.summary || '';
      if (excerpt.length > 200) {
        excerpt = excerpt.substring(0, 200) + '...';
      }

      return {
        _id: article._id.toString(),
        slug: article.slug,
        title: article.title,
        excerpt,
        resourceType: article.resourceType,
        topics: article.topics || [],
        publishedAt: article.publishedAt,
        score: parseFloat(article.score?.toFixed(4) || 0),
        url: `/blog/${article.slug}`
      };
    });

    const response = {
      query,
      results: processedResults,
      count: processedResults.length
    };

    console.log(`✅ API: Articles search successful, found ${processedResults.length} results`);
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ API: Error performing articles search:', error);
    console.error('Error details:', error.message, error.stack);

    // If text index doesn't exist, provide helpful error
    if (error.message?.includes('text index') || error.message?.includes('$text')) {
      return NextResponse.json(
        {
          error: 'Text search index not available for articles.',
          details: 'The text index may not be created yet. Check the Resource model schema.'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to perform articles search.',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// Cache for 5 minutes since articles are public and don't change often
export const revalidate = 300;
