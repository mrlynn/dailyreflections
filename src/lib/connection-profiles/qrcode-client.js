'use client';

/**
 * QR Code client-side utilities for connection profiles
 */

/**
 * Get the connection URL for a slug - client-side safe version
 *
 * @param {string} slug - The connection profile slug
 * @returns {string} - The connection URL
 */
export function getConnectionUrl(slug) {
  if (!slug) {
    return '';
  }

  // For development, use the current host with correct protocol
  let baseUrl = '';
  if (typeof window !== 'undefined') {
    baseUrl = window.location.protocol + '//' + window.location.host;
  } else {
    // Ensure we're using HTTP for localhost, not HTTPS
    const envBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://aacompanion.com';
    if (envBaseUrl.includes('localhost') && envBaseUrl.startsWith('https:')) {
      baseUrl = envBaseUrl.replace('https:', 'http:');
    } else {
      baseUrl = envBaseUrl;
    }
  }

  return `${baseUrl}/connect/${slug}`;
}