import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  getBigBookCollections,
  BIG_BOOK_EDITION_ID,
  normalizeNoteDocument,
  toObjectIdOrString,
} from '@/lib/bigbook/service';
import { stripHtmlToText } from '@/lib/sanitize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_NOTE_LENGTH = 2000;
const MAX_QUOTE_LENGTH = 600;

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

function sanitizeNoteContent(note) {
  if (!note) return '';
  const text = stripHtmlToText(note.toString());
  return text.slice(0, MAX_NOTE_LENGTH).trim();
}

function sanitizeQuoteContent(quote) {
  if (!quote) return null;
  const text = stripHtmlToText(quote.toString());
  const trimmed = text.slice(0, MAX_QUOTE_LENGTH).trim();
  return trimmed || null;
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
        { error: 'You must be signed in to view notes.' },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const pageNumber = parsePageNumber(searchParams.get('pageNumber'));

    const userId = toObjectIdOrString(sessionUserId);
    const { notes } = await getBigBookCollections();

    const filter = {
      editionId: BIG_BOOK_EDITION_ID,
      userId,
    };

    if (pageNumber) {
      filter.pageNumber = pageNumber;
    }

    const docs = await notes
      .find(filter, { sort: { createdAt: -1 } })
      .toArray();

    return NextResponse.json({
      notes: docs.map(normalizeNoteDocument),
    });
  } catch (error) {
    console.error('Error fetching Big Book notes:', error);
    return NextResponse.json(
      { error: 'Failed to load notes.' },
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
        { error: 'You must be signed in to save notes.' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const pageNumber = parsePageNumber(body?.pageNumber);
    const cleanedNote = sanitizeNoteContent(body?.note);
    const quote = sanitizeQuoteContent(body?.quote);
    const selectionStart = parseSelection(body?.selectionStart);
    const selectionEnd = parseSelection(body?.selectionEnd);

    if (!pageNumber) {
      return NextResponse.json(
        { error: 'A valid pageNumber is required.' },
        { status: 400 },
      );
    }

    if (!cleanedNote) {
      return NextResponse.json(
        { error: 'Note content must not be empty.' },
        { status: 400 },
      );
    }

    let normalizedSelectionStart = selectionStart;
    let normalizedSelectionEnd = selectionEnd;

    if (
      typeof normalizedSelectionStart === 'number' &&
      typeof normalizedSelectionEnd === 'number' &&
      normalizedSelectionEnd < normalizedSelectionStart
    ) {
      [normalizedSelectionStart, normalizedSelectionEnd] = [
        normalizedSelectionEnd,
        normalizedSelectionStart,
      ];
    }

    const userId = toObjectIdOrString(sessionUserId);
    const { notes } = await getBigBookCollections();

    const result = await notes.insertOne({
      editionId: BIG_BOOK_EDITION_ID,
      userId,
      pageNumber,
      quote,
      selectionStart: typeof normalizedSelectionStart === 'number' ? normalizedSelectionStart : null,
      selectionEnd: typeof normalizedSelectionEnd === 'number' ? normalizedSelectionEnd : null,
      note: cleanedNote,
      createdAt: new Date(),
    });

    const created = await notes.findOne({ _id: result.insertedId });

    return NextResponse.json(
      { note: normalizeNoteDocument(created) },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error saving Big Book note:', error);
    return NextResponse.json(
      { error: 'Failed to save note.' },
      { status: 500 },
    );
  }
}


