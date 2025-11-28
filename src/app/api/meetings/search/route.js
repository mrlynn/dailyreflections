import { NextResponse } from 'next/server';
import { getMeetingsCollection } from '@/lib/models/meeting';

/**
 * POST /api/meetings/search
 * Search AA meetings
 *
 * Body parameters:
 * - query: String to search for
 * - limit: Maximum number of results (default: 10)
 * - city: Optional filter by city
 * - state: Optional filter by state
 * - day: Optional filter by day of week (0-6, where 0=Sunday)
 *
 * Note: Only returns active meetings
 */
export async function POST(request) {
  console.log('🔍 API: Meetings search request received');

  try {
    // Parse request body
    const body = await request.json();
    const { query, limit = 10, city = null, state = null, day = null } = body;

    console.log('📊 API: Meetings search params', { query, limit, city, state, day });

    // Validate inputs
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query string must not be empty' },
        { status: 400 }
      );
    }

    // Get meetings collection
    const collection = await getMeetingsCollection();

    // Set up search options
    const searchLimit = Math.min(Math.max(1, parseInt(limit) || 10), 50); // Between 1-50

    // Build base query - only active meetings
    const searchQuery = {
      active: { $ne: false },
      $text: { $search: query }
    };

    // Add optional filters
    if (city) {
      searchQuery.city = city;
    }
    if (state) {
      searchQuery.state = state;
    }
    if (day !== null && day !== undefined) {
      searchQuery.day = parseInt(day);
    }

    // Perform text search
    let results = [];

    try {
      results = await collection
        .find(
          searchQuery,
          {
            projection: {
              score: { $meta: 'textScore' },
              name: 1,
              slug: 1,
              day: 1,
              time: 1,
              end_time: 1,
              formatted_address: 1,
              address: 1,
              city: 1,
              state: 1,
              location: 1,
              location_notes: 1,
              group: 1,
              notes: 1,
              types: 1,
              conference_url: 1,
              conference_phone: 1,
              latitude: 1,
              longitude: 1
            }
          }
        )
        .sort({ score: { $meta: 'textScore' } })
        .limit(searchLimit)
        .toArray();

      console.log(`✅ Text search found ${results.length} results`);
    } catch (textSearchError) {
      console.log('Text search failed, falling back to regex:', textSearchError.message);

      // Fallback to regex search
      const regexPattern = { $regex: query, $options: 'i' };
      const regexQuery = {
        active: { $ne: false },
        $or: [
          { name: regexPattern },
          { location: regexPattern },
          { group: regexPattern },
          { notes: regexPattern },
          { formatted_address: regexPattern },
          { city: regexPattern }
        ]
      };

      // Add optional filters
      if (city) regexQuery.city = city;
      if (state) regexQuery.state = state;
      if (day !== null && day !== undefined) regexQuery.day = parseInt(day);

      results = await collection
        .find(regexQuery)
        .limit(searchLimit)
        .toArray();

      // Add default score
      results = results.map(meeting => ({ ...meeting, score: 0.5 }));

      console.log(`✅ Regex search found ${results.length} results`);
    }

    // Process results for API response
    const processedResults = results.map(meeting => {
      // Create excerpt from notes or location info
      let excerpt = meeting.notes || meeting.location_notes || '';
      if (excerpt.length > 200) {
        excerpt = excerpt.substring(0, 200) + '...';
      }

      // Format day of week
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = Array.isArray(meeting.day)
        ? meeting.day.map(d => daysOfWeek[d]).join(', ')
        : daysOfWeek[meeting.day];

      // Create address string
      const address = meeting.formatted_address ||
        [meeting.address, meeting.city, meeting.state].filter(Boolean).join(', ');

      return {
        _id: meeting._id.toString(),
        slug: meeting.slug,
        name: meeting.name,
        day: meeting.day,
        dayName,
        time: meeting.time,
        endTime: meeting.end_time,
        address,
        location: meeting.location,
        excerpt,
        types: meeting.types || [],
        isOnline: !!(meeting.conference_url || meeting.conference_phone),
        conferenceUrl: meeting.conference_url,
        score: parseFloat(meeting.score?.toFixed(4) || 0.5),
        url: `/meetings/${meeting.slug}`
      };
    });

    const response = {
      query,
      results: processedResults,
      count: processedResults.length,
      filters: { city, state, day }
    };

    console.log(`✅ API: Meetings search successful, found ${processedResults.length} results`);
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ API: Error performing meetings search:', error);
    console.error('Error details:', error.message, error.stack);

    return NextResponse.json(
      {
        error: 'Failed to perform meetings search.',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// Cache for 10 minutes since meetings don't change often
export const revalidate = 600;
