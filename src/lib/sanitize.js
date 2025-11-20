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

