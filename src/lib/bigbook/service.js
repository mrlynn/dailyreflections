import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import {
  BIG_BOOK_CHAPTERS,
  BIG_BOOK_COPYRIGHT_NOTICE,
  BIG_BOOK_EDITION_ID,
  BIG_BOOK_EDITION_LABEL,
  BIG_BOOK_VECTOR_INDEX,
} from './config';

const DB_NAME = 'dailyreflections';

export function getChapterForPageNumber(pageNumber) {
  return (
    BIG_BOOK_CHAPTERS.find(
      (chapter) => pageNumber >= chapter.startPage && pageNumber <= chapter.endPage,
    ) || null
  );
}

export async function getBigBookCollections() {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  return {
    db,
    chapters: db.collection('bigbook_chapters'),
    pages: db.collection('bigbook_pages'),
    vectors: db.collection('bigbook_page_vectors'),
    bookmarks: db.collection('user_bigbook_bookmarks'),
    notes: db.collection('user_bigbook_notes'),
    highlights: db.collection('user_bigbook_highlights'),
    comments: db.collection('bigbook_comments'),
  };
}

export function normalizeChapterDocument(doc) {
  if (!doc) return null;

  return {
    id: doc._id ? doc._id.toString() : undefined,
    slug: doc.slug,
    title: doc.title,
    order: doc.order,
    startPage: doc.startPage,
    endPage: doc.endPage,
    editionId: doc.editionId,
  };
}

export function normalizePageDocument(doc) {
  if (!doc) return null;

  return {
    pageNumber: doc.pageNumber,
    pdfPageIndex: doc.pdfPageIndex,
    chapterId: doc.chapterId ? doc.chapterId.toString() : null,
    chapterTitle: doc.chapterTitle || null,
    chapterSlug: doc.chapterSlug || getChapterForPageNumber(doc.pageNumber)?.slug || null,
    text: doc.text,
    html: doc.html,
    anchors: Array.isArray(doc.anchors) ? doc.anchors : [],
    editionId: doc.editionId,
    editionLabel: doc.editionLabel || BIG_BOOK_EDITION_LABEL,
    copyrightNotice: doc.copyrightNotice || BIG_BOOK_COPYRIGHT_NOTICE,
    updatedAt: doc.updatedAt,
    createdAt: doc.createdAt,
  };
}

export function normalizeBookmarkDocument(doc) {
  return {
    id: doc._id.toString(),
    pageNumber: doc.pageNumber,
    label: doc.label || null,
    createdAt: doc.createdAt,
    editionId: doc.editionId,
  };
}

export function normalizeNoteDocument(doc) {
  return {
    id: doc._id.toString(),
    pageNumber: doc.pageNumber,
    quote: doc.quote || null,
    selectionStart: typeof doc.selectionStart === 'number' ? doc.selectionStart : null,
    selectionEnd: typeof doc.selectionEnd === 'number' ? doc.selectionEnd : null,
    note: doc.note,
    createdAt: doc.createdAt,
    editionId: doc.editionId,
  };
}

export function normalizeHighlightDocument(doc) {
  return {
    id: doc._id.toString(),
    pageNumber: doc.pageNumber,
    text: doc.text || '',
    color: doc.color || 'yellow',
    selectionStart: typeof doc.selectionStart === 'number' ? doc.selectionStart : null,
    selectionEnd: typeof doc.selectionEnd === 'number' ? doc.selectionEnd : null,
    createdAt: doc.createdAt,
    editionId: doc.editionId,
  };
}

export function normalizeCommentDocument(doc) {
  if (!doc) return null;

  return {
    id: doc._id.toString(),
    pageNumber: doc.pageNumber,
    parentId: doc.parentId ? doc.parentId.toString() : null,
    path: doc.path?.map(id => id.toString()) || [],
    author: doc.author,
    quote: doc.quote || null,
    body: doc.body,
    userId: doc.userId || null,
    createdAt: doc.createdAt,
    editionId: doc.editionId,
  };
}

export function toObjectIdOrString(value) {
  if (!value) return null;
  if (value instanceof ObjectId) return value;
  if (ObjectId.isValid(value)) {
    try {
      return new ObjectId(value);
    } catch (error) {
      return value;
    }
  }
  return value;
}

export function createSearchSnippet(fullText, query, snippetLength = 220) {
  if (!fullText) return '';

  const normalizedText = fullText.replace(/\s+/g, ' ').trim();
  if (!query) {
    return normalizedText.slice(0, snippetLength) + (normalizedText.length > snippetLength ? '…' : '');
  }

  const lowerText = normalizedText.toLowerCase();
  const terms = query
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean);

  let bestIndex = -1;

  for (const term of terms) {
    const index = lowerText.indexOf(term.toLowerCase());
    if (index !== -1 && (bestIndex === -1 || index < bestIndex)) {
      bestIndex = index;
    }
  }

  if (bestIndex === -1) {
    return normalizedText.slice(0, snippetLength) + (normalizedText.length > snippetLength ? '…' : '');
  }

  const half = Math.floor(snippetLength / 2);
  const start = Math.max(0, bestIndex - half);
  const end = Math.min(normalizedText.length, start + snippetLength);

  const prefix = start > 0 ? '…' : '';
  const suffix = end < normalizedText.length ? '…' : '';

  return `${prefix}${normalizedText.slice(start, end).trim()}${suffix}`;
}

export function dedupeSources(results) {
  const seen = new Set();
  return results.filter((result) => {
    const key = `${result.pageNumber}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function normalizeVectorResult(doc) {
  return {
    chunkId: doc._id ? doc._id.toString() : undefined,
    pageId: doc.pageId,
    pageNumber: doc.pageNumber,
    chapterTitle: doc.chapterTitle || null,
    text: doc.text,
    score: typeof doc.score === 'number' ? doc.score : null,
  };
}

export {
  BIG_BOOK_CHAPTERS,
  BIG_BOOK_COPYRIGHT_NOTICE,
  BIG_BOOK_EDITION_ID,
  BIG_BOOK_EDITION_LABEL,
  BIG_BOOK_VECTOR_INDEX,
};


