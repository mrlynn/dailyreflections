/**
 * SEO Utilities
 * Helper functions for generating SEO metadata across the application
 */

/**
 * Get the base URL for the site
 * Uses NEXT_PUBLIC_BASE_URL or NEXTAUTH_URL environment variable, or constructs from request
 * @returns {string} The base URL without a trailing slash
 */
export function getBaseUrl(request) {
  let baseUrl = '';

  if (typeof window !== 'undefined') {
    // Client-side
    baseUrl = window.location.origin;
  }
  // Server-side
  else if (process.env.NEXT_PUBLIC_BASE_URL) {
    baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  }
  else if (process.env.NEXTAUTH_URL) {
    baseUrl = process.env.NEXTAUTH_URL;
  }
  // Fallback: construct from request
  else if (request) {
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    baseUrl = `${protocol}://${host}`;
  }
  else {
    baseUrl = 'https://aacompanion.com'; // Default fallback - aligned with canonical domain in HTML
  }

  // Ensure consistent format without trailing slash
  return baseUrl.replace(/\/$/, '');
}

/**
 * Generate canonical URL
 */
export function getCanonicalUrl(path, request) {
  const baseUrl = getBaseUrl(request);

  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // Ensure baseUrl doesn't have trailing slash
  const formattedBaseUrl = baseUrl.replace(/\/$/, '');

  return `${formattedBaseUrl}${cleanPath}`;
}

/**
 * Generate default Open Graph image URL
 */
export function getDefaultOgImage() {
  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'https://aacompanion.com');

  // Ensure baseUrl doesn't have trailing slash
  const formattedBaseUrl = baseUrl.replace(/\/$/, '');

  return `${formattedBaseUrl}/logo.png`;
}

/**
 * Helper function to unescape HTML entities in text
 */
function unescapeHtml(text) {
  if (!text) return '';

  return text
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&lsquo;/g, '\'')
    .replace(/&rsquo;/g, '\'');
}

/**
 * Create comprehensive metadata object
 * Note: request is optional - if not provided, will use environment variables or defaults
 */
export function createMetadata({
  title,
  description,
  path = '/',
  keywords = [],
  ogImage,
  ogType = 'website',
  noindex = false,
  request,
  additionalMetadata = {}
}) {
  // Clean title and description to remove HTML entities
  const cleanTitle = unescapeHtml(title);
  const cleanDescription = unescapeHtml(description);

  const siteName = 'Daily Reflections - AA Literature';

  // Get base URL (works without request in static context)
  let canonicalUrl;
  if (request) {
    canonicalUrl = getCanonicalUrl(path, request);
  } else {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
                    process.env.NEXTAUTH_URL ||
                    'https://aacompanion.com';
    canonicalUrl = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }

  const defaultOgImage = ogImage || (() => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
                    process.env.NEXTAUTH_URL ||
                    'https://aacompanion.com';
    return `${baseUrl}/logo.png`;
  })();

  // Determine image dimensions based on whether it's a reflection image or default logo
  // Reflection images are 1792x1024 (widescreen banner), but OG recommends 1200x630
  // We'll use the actual image dimensions for reflection images, default for logo
  const isReflectionImage = ogImage && ogImage.includes('/reflections/');
  const imageWidth = isReflectionImage ? 1792 : 1200;
  const imageHeight = isReflectionImage ? 1024 : 630;

  // Combine title with site name if not already included
  const fullTitle = cleanTitle.includes(siteName) ? cleanTitle : `${cleanTitle} | ${siteName}`;

  // Prepare standard metadata object
  const metadata = {
    title: fullTitle,
    description: cleanDescription,
    keywords: keywords.length > 0 ? keywords.join(', ') : undefined,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: fullTitle,
      description: cleanDescription,
      url: canonicalUrl,
      siteName,
      images: [
        {
          url: defaultOgImage,
          width: imageWidth,
          height: imageHeight,
          alt: cleanTitle,
        },
      ],
      type: ogType,
      locale: 'en_US',
      // Add article-specific metadata for reflection pages
      ...(ogType === 'article' && {
        publishedTime: new Date().toISOString(), // Could be enhanced with actual publication date
        section: 'Daily Reflections',
        tags: keywords.length > 0 ? keywords : undefined,
      }),
      // Merge any additional OpenGraph properties
      ...(additionalMetadata?.openGraph || {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: cleanDescription,
      images: [defaultOgImage],
    },
    robots: {
      index: !noindex,
      follow: !noindex,
      googleBot: {
        index: !noindex,
        follow: !noindex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };

  // Add any additional custom metadata tags - avoiding duplicates
  if (additionalMetadata?.other) {
    // Create a filtered version of additionalMetadata.other to avoid duplicates
    const filteredOther = { ...additionalMetadata.other };

    // Remove duplicate twitter tags that might be already in the twitter object
    ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'].forEach(tag => {
      delete filteredOther[tag];
    });

    // Remove duplicate OpenGraph tags
    ['og:title', 'og:description', 'og:url', 'og:image', 'og:type', 'og:locale'].forEach(tag => {
      delete filteredOther[tag];
    });

    metadata.other = filteredOther;
  }

  return metadata;
}

/**
 * Format dateKey for display (e.g., "01-08" -> "January 8")
 */
export function formatDateKeyForSEO(dateKey) {
  const [month, day] = dateKey.split('-').map(Number);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${months[month - 1]} ${day}`;
}
