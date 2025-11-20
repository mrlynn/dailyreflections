import { NextResponse } from 'next/server';
import {
  getBigBookCollections,
  BIG_BOOK_EDITION_ID,
  createSearchSnippet,
  getChapterForPageNumber,
} from '@/lib/bigbook/service';

const MIN_QUERY_LENGTH = 2;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 25;

function parseLimit(searchParams) {
  const limitParam = searchParams.get('limit');
  if (!limitParam) return DEFAULT_LIMIT;
  const parsed = Number.parseInt(limitParam, 10);
  if (Number.isNaN(parsed)) return DEFAULT_LIMIT;
  return Math.min(Math.max(parsed, 1), MAX_LIMIT);
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim();

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required.' },
        { status: 400 },
      );
    }

    if (query.length < MIN_QUERY_LENGTH) {
      return NextResponse.json(
        { error: `Query must be at least ${MIN_QUERY_LENGTH} characters.` },
        { status: 400 },
      );
    }

    const limit = parseLimit(searchParams);
    const { pages } = await getBigBookCollections();

    let results = [];

    try {
      results = await pages
        .find(
          {
            editionId: BIG_BOOK_EDITION_ID,
            $text: { $search: query },
          },
          {
            projection: {
              pageNumber: 1,
              text: 1,
              chapterTitle: 1,
              score: { $meta: 'textScore' },
            },
          },
        )
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit)
        .toArray();
    } catch (textSearchError) {
      console.warn('Big Book text search failed, falling back to regex:', textSearchError.message);
      const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      results = await pages
        .find(
          { editionId: BIG_BOOK_EDITION_ID, text: regex },
          {
            projection: {
              pageNumber: 1,
              text: 1,
              chapterTitle: 1,
            },
          },
        )
        .limit(limit)
        .toArray();
    }

    const normalized = results.map((doc) => {
      const snippet = createSearchSnippet(doc.text, query);
      const chapter = getChapterForPageNumber(doc.pageNumber);

      return {
        pageNumber: doc.pageNumber,
        snippet,
        chapterTitle: doc.chapterTitle || chapter?.title || null,
        chapterSlug: chapter?.slug || null,
        relevance: typeof doc.score === 'number' ? Number(doc.score.toFixed(2)) : null,
      };
    });

    return NextResponse.json({ query, results: normalized });
  } catch (error) {
    console.error('Error searching Big Book pages:', error);
    return NextResponse.json(
      { error: 'Failed to search Big Book content.' },
      { status: 500 },
    );
  }
}


