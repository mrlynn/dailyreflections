import sanitizeHtml from 'sanitize-html';

const DEFAULT_ALLOWED_TAGS = (sanitizeHtml.defaults.allowedTags || []).concat([
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'pre',
  'code',
  'hr',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'span',
  'img',
]);

const DEFAULT_ALLOWED_ATTR = {
  ...sanitizeHtml.defaults.allowedAttributes,
  a: ['href', 'rel', 'target', 'title'],
  img: ['src', 'alt', 'title', 'width', 'height'],
  blockquote: ['cite'],
  code: ['class'],
  span: ['class'],
};

const DEFAULT_SELF_CLOSING = sanitizeHtml.defaults.selfClosing.concat(['img']);

export function sanitizeRichText(input, options = {}) {
  if (typeof input !== 'string') {
    return '';
  }

  const sanitized = sanitizeHtml(input, {
    allowedTags: DEFAULT_ALLOWED_TAGS,
    allowedAttributes: DEFAULT_ALLOWED_ATTR,
    selfClosing: DEFAULT_SELF_CLOSING,
    enforceHtmlBoundary: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
    },
    ...options,
  });

  return sanitized.trim();
}

export function stripHtmlToText(input = '') {
  if (!input) return '';
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Common HTML entities used in reflection quotes (smart quotes, apostrophes, etc.)
 */
const HTML_ENTITY_MAP = {
  '&ldquo;': '"',
  '&rdquo;': '"',
  '&lsquo;': "'",
  '&rsquo;': "'",
  '&quot;': '"',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&nbsp;': ' ',
  '&mdash;': '—',
  '&ndash;': '–',
  '&hellip;': '…',
  '&#039;': "'",
  '&#8216;': "'",
  '&#8217;': "'",
  '&#8220;': '"',
  '&#8221;': '"',
};

/**
 * Cleans quote text for display: strips HTML tags and decodes HTML entities.
 * Use for reflection quotes that may contain raw HTML/entities from the database.
 * @param {string} quote - Raw quote text (may contain <p>, &ldquo;, etc.)
 * @returns {string} - Clean plain text suitable for display
 */
export function cleanQuoteForDisplay(quote) {
  if (!quote || typeof quote !== 'string') return '';
  // 1. Strip HTML tags first (prevents any HTML interpretation)
  let cleaned = stripHtmlToText(quote);
  // 2. Decode named HTML entities
  Object.entries(HTML_ENTITY_MAP).forEach(([entity, char]) => {
    cleaned = cleaned.replace(new RegExp(entity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), char);
  });
  // 3. Decode numeric entities (&#123; and &#x7B;)
  cleaned = cleaned.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
  cleaned = cleaned.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  return cleaned.trim();
}

