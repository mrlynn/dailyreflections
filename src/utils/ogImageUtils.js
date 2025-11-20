/**
 * Open Graph Image Utilities
 * Helper functions for generating Open Graph images for social sharing
 */

/**
 * Builds an OG image URL for a Big Book page
 * @param {number} pageNumber - The Big Book page number
 * @param {Object} chapter - Optional chapter object
 * @returns {string} URL to the OG image
 */
export function buildBigBookOgImage(pageNumber, chapter = null) {
  // Use dynamic OG image API route
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'https://aacompanion.com';

  // Build query params
  const params = new URLSearchParams();
  params.append('page', pageNumber);

  if (chapter?.title) {
    params.append('title', chapter.title);
  }

  return `${baseUrl}/api/og/big-book?${params.toString()}`;
}

/**
 * Builds an OG image URL for a Big Book chapter landing page
 * @param {string} chapterTitle - The chapter title
 * @returns {string} URL to the OG image
 */
export function buildChapterOgImage(chapterTitle) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'https://aacompanion.com';

  const params = new URLSearchParams();
  params.append('title', chapterTitle);
  params.append('type', 'chapter');

  return `${baseUrl}/api/og/big-book?${params.toString()}`;
}

/**
 * Gets default Open Graph dimensions for Big Book images
 * @returns {Object} Object with width and height properties
 */
export function getBigBookOgDimensions() {
  return {
    width: 1200,
    height: 630
  };
}