'use client';

import Script from 'next/script';

/**
 * Renders JSON-LD structured data for Big Book landing page
 */
export default function BigBookLandingSchema({
  url = typeof window !== 'undefined' ? window.location.href : 'https://aacompanion.com/big-book',
  datePublished = '2001-01-01', // 4th edition published in 2001
}) {
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
    description: 'The primary text of Alcoholics Anonymous, known as the "Big Book," which includes the core principles of AA\'s recovery program and personal stories of recovery.',
    url,
    // Add book edition information
    bookEdition: '4th Edition',
    // Define audience
    audience: {
      '@type': 'Audience',
      audienceType: ['People seeking recovery from alcoholism', 'Family members of alcoholics', 'Treatment professionals']
    },
    // Add web page representation
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url
    },
    // Add creative work series
    isPartOf: {
      '@type': 'CreativeWorkSeries',
      name: 'Alcoholics Anonymous Literature',
      url: 'https://aacompanion.com'
    }
  };

  return (
    <Script
      id="bigbook-landing-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(bookData) }}
    />
  );
}