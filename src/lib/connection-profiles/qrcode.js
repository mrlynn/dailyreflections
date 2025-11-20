/**
 * QR Code utilities for connection profiles
 */
import QRCode from 'qrcode';

/**
 * Generate a QR code data URL for a connection slug
 *
 * @param {string} slug - The connection profile slug
 * @param {Object} options - QR code generation options
 * @param {number} [options.size=300] - QR code size in pixels
 * @param {number} [options.margin=1] - QR code margin in modules
 * @param {string} [options.colorDark='#5d88a6'] - QR code dark color
 * @param {string} [options.colorLight='#FFFFFF'] - QR code light color
 * @returns {Promise<string>} - Data URL of the QR code
 */
export async function generateQRCodeForSlug(slug, options = {}) {
  if (!slug) {
    throw new Error('Slug is required');
  }

  const {
    size = 300,
    margin = 1,
    colorDark = '#5d88a6',
    colorLight = '#FFFFFF'
  } = options;

  // Generate the URL to encode
  let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://aacompanion.com';

  // Ensure we're using HTTP for localhost, not HTTPS
  if (baseUrl.includes('localhost') && baseUrl.startsWith('https:')) {
    baseUrl = baseUrl.replace('https:', 'http:');
  }
  const connectionUrl = `${baseUrl}/connect/${slug}`;

  // QR code options
  const qrOptions = {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    width: size,
    margin: margin,
    color: {
      dark: colorDark,
      light: colorLight
    }
  };

  // Generate QR code as data URL
  return await QRCode.toDataURL(connectionUrl, qrOptions);
}

/**
 * Generate a QR code as a SVG string for a connection slug
 *
 * @param {string} slug - The connection profile slug
 * @param {Object} options - QR code generation options
 * @param {number} [options.size=300] - QR code size in pixels
 * @param {number} [options.margin=1] - QR code margin in modules
 * @param {string} [options.colorDark='#5d88a6'] - QR code dark color
 * @param {string} [options.colorLight='#FFFFFF'] - QR code light color
 * @returns {Promise<string>} - SVG string of the QR code
 */
export async function generateQRCodeSVGForSlug(slug, options = {}) {
  if (!slug) {
    throw new Error('Slug is required');
  }

  const {
    size = 300,
    margin = 1,
    colorDark = '#5d88a6',
    colorLight = '#FFFFFF'
  } = options;

  // Generate the URL to encode
  let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://aacompanion.com';

  // Ensure we're using HTTP for localhost, not HTTPS
  if (baseUrl.includes('localhost') && baseUrl.startsWith('https:')) {
    baseUrl = baseUrl.replace('https:', 'http:');
  }
  const connectionUrl = `${baseUrl}/connect/${slug}`;

  // QR code options
  const qrOptions = {
    errorCorrectionLevel: 'M',
    type: 'svg',
    width: size,
    margin: margin,
    color: {
      dark: colorDark,
      light: colorLight
    }
  };

  // Generate QR code as SVG string
  return await QRCode.toString(connectionUrl, qrOptions);
}

/**
 * Get the connection URL for a slug
 *
 * @param {string} slug - The connection profile slug
 * @returns {string} - The connection URL
 */
export function getConnectionUrl(slug) {
  if (!slug) {
    throw new Error('Slug is required');
  }

  let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://aacompanion.com';

  // Ensure we're using HTTP for localhost, not HTTPS
  if (baseUrl.includes('localhost') && baseUrl.startsWith('https:')) {
    baseUrl = baseUrl.replace('https:', 'http:');
  }
  return `${baseUrl}/connect/${slug}`;
}