import { NextResponse } from 'next/server';
import {
  getBigBookCollections,
  BIG_BOOK_CHAPTERS,
  BIG_BOOK_EDITION_ID,
  normalizePageDocument,
  getChapterForPageNumber,
} from '@/lib/bigbook/service';

function parsePageNumber(param) {
  const parsed = Number.parseInt(param, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function getChapterSlug(pageNumber) {
  return getChapterForPageNumber(pageNumber)?.slug || null;
}

export async function GET(request, context) {
  try {
    const { params } = context;
    const resolvedParams = typeof params?.then === 'function' ? await params : params;
    const pageNumber = parsePageNumber(resolvedParams?.pageNumber);

    if (!pageNumber) {
      return NextResponse.json(
        { error: 'A valid pageNumber must be provided.' },
        { status: 400 },
      );
    }

    const { pages } = await getBigBookCollections();

    const doc = await pages.findOne({
      editionId: BIG_BOOK_EDITION_ID,
      pageNumber,
    });

    if (!doc) {
      return NextResponse.json(
        {
          error: `Page ${pageNumber} was not found for Big Book edition ${BIG_BOOK_EDITION_ID}.`,
        },
        { status: 404 },
      );
    }

    const [hasPrevious, hasNext] = await Promise.all([
      pages.findOne(
        { editionId: BIG_BOOK_EDITION_ID, pageNumber: pageNumber - 1 },
        { projection: { _id: 1 } },
      ),
      pages.findOne(
        { editionId: BIG_BOOK_EDITION_ID, pageNumber: pageNumber + 1 },
        { projection: { _id: 1 } },
      ),
    ]);

    const normalized = normalizePageDocument({
      ...doc,
      chapterSlug: doc.chapterSlug || getChapterSlug(pageNumber),
    });

    const chapter = BIG_BOOK_CHAPTERS.find(
      (item) => pageNumber >= item.startPage && pageNumber <= item.endPage,
    );

    return NextResponse.json({
      page: {
        ...normalized,
        spans: doc.spans || [],
        lines: doc.lines || [],
        fullText: doc.fullText || doc.text || '',
        imageUrl: doc.imageUrl || null,
        pageWidth: doc.pageWidth || null,
        pageHeight: doc.pageHeight || null,
        chapter: chapter
          ? {
              slug: chapter.slug,
              title: chapter.title,
              order: chapter.order,
              startPage: chapter.startPage,
              endPage: chapter.endPage,
            }
          : null,
      },
      previousPageNumber: hasPrevious ? pageNumber - 1 : null,
      nextPageNumber: hasNext ? pageNumber + 1 : null,
    });
  } catch (error) {
    console.error('Error fetching Big Book page:', error);
    return NextResponse.json(
      { error: 'Failed to load requested page.' },
      { status: 500 },
    );
  }
}


