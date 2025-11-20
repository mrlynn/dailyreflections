import { NextResponse } from 'next/server';
import { getAllMeetings, generateMeetingGuideJson } from '@/lib/models/meeting';

/**
 * Meeting Guide JSON API endpoint
 * Serves data in the standard Meeting Guide format:
 * https://github.com/code4recovery/spec
 *
 * Used by TSML-UI for rendering meetings on the frontend
 * Can also be registered with the official Meeting Guide app
 */

// This API route requires dynamic server-side rendering due to search parameters
export const dynamic = 'force-dynamic';

// Enable ISR-style caching
export const revalidate = 300; // 5 min cache

/**
 * GET /api/meeting-guide
 * Returns a Meeting Guide compliant JSON array of meetings
 */
export async function GET(request) {
  try {
    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);

    // Prepare filter options
    const filters = {};

    // Day of week filter (0=Sunday, 6=Saturday)
    const day = searchParams.get('day');
    if (day !== null) {
      const dayNum = parseInt(day, 10);
      if (!isNaN(dayNum) && dayNum >= 0 && dayNum <= 6) {
        filters.day = dayNum;
      }
    }

    // City filter
    const city = searchParams.get('city');
    if (city) {
      filters.city = city;
    }

    // State filter
    const state = searchParams.get('state');
    if (state) {
      filters.state = state;
    }

    // Meeting type filter
    const type = searchParams.get('type');
    if (type) {
      filters.type = type;
    }

    // Get active meetings with applied filters
    const meetings = await getAllMeetings(filters);

    // Format meetings to Meeting Guide JSON spec
    const meetingGuideJson = generateMeetingGuideJson(meetings);

    // Return JSON with caching headers
    return NextResponse.json(meetingGuideJson, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=600',
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error generating Meeting Guide JSON:', error);

    // Return error in a predictable format
    return NextResponse.json(
      { error: 'Failed to retrieve meeting data' },
      { status: 500 }
    );
  }
}