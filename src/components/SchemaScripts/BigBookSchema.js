'use client';

import Script from 'next/script';

/**
 * Renders JSON-LD structured data for Big Book pages
 * This helps search engines understand the content for rich results
 */
export default function BigBookSchema({
  pageNumber,
  chapterTitle,
  chapterSlug,
  pageText,
  url,
  imageUrl,
  datePublished = '2001-01-01', // 4th edition published in 2001
}) {
  // Create the JSON-LD data
  const bookData = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: 'Alcoholics Anonymous (Big Book)',
    alternateName: 'The Big Book',
    author: {
      '@type': 'Organization',
      name: 'Alcoholics Anonymous World Services, Inc.',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Alcoholics Anonymous World Services, Inc.',
    },
    isbn: '1893007162', // ISBN for the 4th edition
    datePublished,
    bookFormat: 'Hardcover',
    numberOfPages: 576,
    inLanguage: 'en-US',
  };

  // Add chapter information if available
  if (chapterTitle) {
    bookData.hasPart = {
      '@type': 'Chapter',
      name: chapterTitle,
      position: chapterSlug?.startsWith('personal-stories') ? 'Appendix' : 'Chapter',
      url: `${url.split('/').slice(0, -2).join('/')}/${chapterSlug || ''}`,
    };
  }

  // Add page information
  bookData.hasPart = {
    '@type': 'WebPage',
    name: `Page ${pageNumber}${chapterTitle ? ` - ${chapterTitle}` : ''}`,
    position: pageNumber,
    url,
    ...(imageUrl && { image: imageUrl }),
    ...(pageText && { text: pageText.substring(0, 500) }),
  };

  return (
    <Script
      id="bigbook-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(bookData) }}
    />
  );
}