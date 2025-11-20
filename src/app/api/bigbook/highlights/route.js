import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  getBigBookCollections,
  BIG_BOOK_EDITION_ID,
  normalizeHighlightDocument,
  toObjectIdOrString,
} from '@/lib/bigbook/service';
import { stripHtmlToText } from '@/lib/sanitize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_TEXT_LENGTH = 1000;
const VALID_COLORS = ['yellow', 'lightblue', 'lightgreen', 'pink'];

function parsePageNumber(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function parseSelection(value) {
  if (value === undefined || value === null) return null;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) return null;
  return parsed;
}

function sanitizeHighlightText(text) {
  if (!text) return '';
  const cleanText = stripHtmlToText(text.toString());
  return cleanText.slice(0, MAX_TEXT_LENGTH).trim();
}

function validateColor(color) {
  if (!color || typeof color !== 'string') return 'yellow';
  const normalizedColor = color.toLowerCase().trim();
  return VALID_COLORS.includes(normalizedColor) ? normalizedColor : 'yellow';
}

function resolveSessionUserId(session) {
  return (
    session?.user?.id ||
    session?.user?.sub ||
    session?.user?.email ||
    null
  );
}

export async function GET(request) {
  try {
    const session = await getSession(request);

    const sessionUserId = resolveSessionUserId(session);

    if (!sessionUserId) {
      return NextResponse.json(
        { error: 'You must be signed in to view highlights.' },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const pageNumber = parsePageNumber(searchParams.get('pageNumber'));

    const userId = toObjectIdOrString(sessionUserId);
    const { highlights } = await getBigBookCollections();

    const filter = {
      editionId: BIG_BOOK_EDITION_ID,
      userId,
    };

    if (pageNumber) {
      filter.pageNumber = pageNumber;
    }

    const docs = await highlights
      .find(filter, { sort: { createdAt: -1 } })
      .toArray();

    return NextResponse.json({
      highlights: docs.map(normalizeHighlightDocument),
    });
  } catch (error) {
    console.error('Error fetching Big Book highlights:', error);
    return NextResponse.json(
      { error: 'Failed to load highlights.' },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const session = await getSession(request);

    const sessionUserId = resolveSessionUserId(session);

    if (!sessionUserId) {
      return NextResponse.json(
        { error: 'You must be signed in to save highlights.' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const pageNumber = parsePageNumber(body?.pageNumber);
    const highlightText = sanitizeHighlightText(body?.text);
    const color = validateColor(body?.color);
    const selectionStart = parseSelection(body?.selectionStart);
    const selectionEnd = parseSelection(body?.selectionEnd);

    if (!pageNumber) {
      return NextResponse.json(
        { error: 'A valid pageNumber is required.' },
        { status: 400 },
      );
    }

    if (!highlightText) {
      return NextResponse.json(
        { error: 'Highlight text must not be empty.' },
        { status: 400 },
      );
    }

    if (selectionStart === null || selectionEnd === null) {
      return NextResponse.json(
        { error: 'Valid selection positions are required.' },
        { status: 400 },
      );
    }

    let normalizedSelectionStart = selectionStart;
    let normalizedSelectionEnd = selectionEnd;

    if (normalizedSelectionEnd < normalizedSelectionStart) {
      [normalizedSelectionStart, normalizedSelectionEnd] = [
        normalizedSelectionEnd,
        normalizedSelectionStart,
      ];
    }

    const userId = toObjectIdOrString(sessionUserId);
    const { highlights } = await getBigBookCollections();

    const result = await highlights.insertOne({
      editionId: BIG_BOOK_EDITION_ID,
      userId,
      pageNumber,
      text: highlightText,
      color,
      selectionStart: normalizedSelectionStart,
      selectionEnd: normalizedSelectionEnd,
      createdAt: new Date(),
    });

    const created = await highlights.findOne({ _id: result.insertedId });

    return NextResponse.json(
      { highlight: normalizeHighlightDocument(created) },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error saving Big Book highlight:', error);
    return NextResponse.json(
      { error: 'Failed to save highlight.' },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    const session = await getSession(request);

    const sessionUserId = resolveSessionUserId(session);

    if (!sessionUserId) {
      return NextResponse.json(
        { error: 'You must be signed in to delete highlights.' },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const highlightId = searchParams.get('id');

    if (!highlightId) {
      return NextResponse.json(
        { error: 'A valid highlight ID is required.' },
        { status: 400 },
      );
    }

    const userId = toObjectIdOrString(sessionUserId);
    const { highlights } = await getBigBookCollections();

    const result = await highlights.deleteOne({
      _id: toObjectIdOrString(highlightId),
      userId,
      editionId: BIG_BOOK_EDITION_ID,
    });

    if (!result.deletedCount) {
      return NextResponse.json(
        { error: 'Highlight not found or you do not have permission to delete it.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting Big Book highlight:', error);
    return NextResponse.json(
      { error: 'Failed to delete highlight.' },
      { status: 500 },
    );
  }
}