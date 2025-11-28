import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getJournalCollection } from '@/lib/models/journalEntry';
import { ObjectId } from 'mongodb';

/**
 * POST /api/journal/search
 * Search user's journal entries
 *
 * Body parameters:
 * - query: String to search for
 * - limit: Maximum number of results (default: 10)
 *
 * Note: Only returns entries belonging to the authenticated user
 */
export async function POST(request) {
  console.log('🔍 API: Journal search request received');

  try {
    // Require authentication for journal search
    const session = await getSession(request);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Parse request body
    const body = await request.json();
    const { query, limit = 10 } = body;

    console.log('📊 API: Journal search params', { query, limit, userId });

    // Validate inputs
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query string must not be empty' },
        { status: 400 }
      );
    }

    // Get journal collection (with encryption)
    const collection = await getJournalCollection(true);

    // Set up search options
    const searchLimit = Math.min(Math.max(1, parseInt(limit) || 10), 50); // Between 1-50

    // Try text search first (MongoDB text index)
    let results = [];

    try {
      const textSearchResults = await collection
        .find(
          {
            userId: new ObjectId(userId),
            $text: { $search: query }
          },
          {
            projection: {
              score: { $meta: 'textScore' },
              date: 1,
              mood: 1,
              reflections: 1,
              inventory: 1,
              promises: 1,
              improvements: 1,
              tags: 1,
              entryType: 1,
              createdAt: 1
            }
          }
        )
        .sort({ score: { $meta: 'textScore' } })
        .limit(searchLimit)
        .toArray();

      results = textSearchResults;
      console.log(`✅ Text search found ${results.length} results`);
    } catch (textSearchError) {
      console.log('Text search not available, falling back to regex search:', textSearchError.message);

      // Fallback to regex search if text index doesn't exist
      const regexPattern = { $regex: query, $options: 'i' };
      const regexResults = await collection
        .find({
          userId: new ObjectId(userId),
          $or: [
            { reflections: regexPattern },
            { 'inventory.resentments': regexPattern },
            { 'inventory.fears': regexPattern },
            { 'inventory.honesty': regexPattern },
            { 'inventory.amends': regexPattern },
            { 'inventory.service': regexPattern },
            { 'inventory.prayer': regexPattern },
            { 'inventory.selfishness': regexPattern },
            { 'inventory.dishonesty': regexPattern },
            { 'inventory.self_seeking': regexPattern },
            { promises: regexPattern },
            { tags: regexPattern }
          ]
        })
        .sort({ date: -1 })
        .limit(searchLimit)
        .toArray();

      results = regexResults.map(entry => ({
        ...entry,
        score: 0.5 // Default score for regex matches
      }));

      console.log(`✅ Regex search found ${results.length} results`);
    }

    // Process results for API response
    const processedResults = results.map(entry => {
      // Create excerpt from the most relevant field
      let excerpt = '';
      const queryLower = query.toLowerCase();

      // Find which field contains the match
      if (entry.reflections && entry.reflections.toLowerCase().includes(queryLower)) {
        excerpt = entry.reflections;
      } else if (entry.promises && entry.promises.toLowerCase().includes(queryLower)) {
        excerpt = entry.promises;
      } else if (entry.inventory) {
        // Check inventory fields
        for (const [key, value] of Object.entries(entry.inventory)) {
          if (value && typeof value === 'string' && value.toLowerCase().includes(queryLower)) {
            excerpt = value;
            break;
          }
        }
      }

      // Truncate excerpt to ~200 characters around the match
      if (excerpt) {
        const matchIndex = excerpt.toLowerCase().indexOf(queryLower);
        if (matchIndex >= 0) {
          const start = Math.max(0, matchIndex - 100);
          const end = Math.min(excerpt.length, matchIndex + 100);
          excerpt = (start > 0 ? '...' : '') +
                   excerpt.substring(start, end) +
                   (end < excerpt.length ? '...' : '');
        } else {
          excerpt = excerpt.substring(0, 200) + (excerpt.length > 200 ? '...' : '');
        }
      }

      return {
        _id: entry._id.toString(),
        date: entry.date,
        entryType: entry.entryType,
        excerpt,
        tags: entry.tags || [],
        mood: entry.mood,
        score: parseFloat(entry.score?.toFixed(4) || 0.5),
        url: `/journal/${entry._id.toString()}`
      };
    });

    const response = {
      query,
      results: processedResults,
      count: processedResults.length,
      userId
    };

    console.log(`✅ API: Journal search successful, found ${processedResults.length} results`);
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ API: Error performing journal search:', error);
    console.error('Error details:', error.message, error.stack);

    return NextResponse.json(
      {
        error: 'Failed to perform journal search.',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// No caching for personal journal search
export const revalidate = 0;
