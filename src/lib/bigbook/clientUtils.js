/**
 * Client-safe utility functions for the Big Book
 * This file does not import any server-only code
 */
import { BIG_BOOK_CHAPTERS } from './config';

/**
 * Find which chapter a page number belongs to
 * @param {number} pageNumber - The page number to check
 * @returns {Object|null} - The chapter object or null if not found
 */
export function getChapterForPageNumber(pageNumber) {
  return (
    BIG_BOOK_CHAPTERS.find(
      (chapter) => pageNumber >= chapter.startPage && pageNumber <= chapter.endPage,
    ) || null
  );
}