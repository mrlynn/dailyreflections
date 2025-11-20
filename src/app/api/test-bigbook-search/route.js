import { NextResponse } from 'next/server';
import { searchBigBookPages } from '@/lib/bigbook/vectorSearch';
import { searchCombinedSources, formatCitations } from '@/lib/chatbotSearch';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Test endpoint to verify Big Book search functionality
 *
 * @param {Request} request - Next.js request object
 * @returns {Promise<Response>} - JSON response with search results
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: 'Missing query parameter (q)' },
        { status: 400 }
      );
    }

    // Test both direct Big Book search and combined search
    const [bigBookResults, combinedResults] = await Promise.all([
      // Direct search in Big Book pages
      searchBigBookPages(query, {
        limit: 5,
        minScore: 0.65,
      }),
      // Combined search across all sources
      searchCombinedSources(query, {
        limit: 10,
        minScore: 0.65,
      }),
    ]);

    // Format citations for display
    const formattedBigBookResults = formatCitations(bigBookResults);
    const formattedCombinedResults = formatCitations(combinedResults);

    return NextResponse.json({
      query,
      bigBookResults: formattedBigBookResults,
      combinedResults: formattedCombinedResults,
      stats: {
        bigBookResultCount: bigBookResults.length,
        combinedResultCount: combinedResults.length,
        bigBookResultsInCombined: combinedResults.filter(r => r.source === 'Big Book Reader').length,
      },
    });
  } catch (error) {
    console.error('Error in test-bigbook-search endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to execute search', details: error.message },
      { status: 500 }
    );
  }
}