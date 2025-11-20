import { NextResponse } from 'next/server';
import {
  getBigBookCollections,
  BIG_BOOK_CHAPTERS,
  BIG_BOOK_EDITION_ID,
  normalizeChapterDocument,
} from '@/lib/bigbook/service';

function fallbackChapters() {
  return BIG_BOOK_CHAPTERS.map((chapter) => ({
    id: `${BIG_BOOK_EDITION_ID}:${chapter.slug}`,
    slug: chapter.slug,
    title: chapter.title,
    order: chapter.order,
    startPage: chapter.startPage,
    endPage: chapter.endPage,
    editionId: BIG_BOOK_EDITION_ID,
  }));
}

export async function GET() {
  try {
    const { chapters } = await getBigBookCollections();

    const results = await chapters
      .find({ editionId: BIG_BOOK_EDITION_ID })
      .sort({ order: 1 })
      .toArray();

    if (!results.length) {
      return NextResponse.json({ chapters: fallbackChapters(), source: 'config' });
    }

    return NextResponse.json({
      chapters: results.map(normalizeChapterDocument),
      source: 'database',
    });
  } catch (error) {
    console.error('Error fetching Big Book chapters:', error);
    return NextResponse.json(
      { error: 'Failed to load Big Book chapters.' },
      { status: 500 },
    );
  }
}


