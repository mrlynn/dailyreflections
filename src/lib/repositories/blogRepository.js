import { marked } from 'marked';
import { connectToDatabase } from '@/lib/mongodb';
import { sanitizeRichText, stripHtmlToText } from '@/lib/sanitize';

const BLOG_COLLECTION = 'resources';
const BLOG_RESOURCE_TYPE = 'article';
const DEFAULT_PAGE_SIZE = 9;
const MAX_PAGE_SIZE = 48;
const DEFAULT_CATEGORY = 'Recovery';
const DEFAULT_AUTHOR_NAME = 'Daily Reflections';

const SANITIZE_OPTIONS = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'strong',
    'em',
    'b',
    'i',
    'u',
    'a',
    'ul',
    'ol',
    'li',
    'blockquote',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'pre',
    'code',
    'hr',
    'img',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'span',
  ],
  ALLOWED_ATTR: {
    a: ['href', 'rel', 'target', 'title'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    blockquote: ['cite'],
    code: ['class'],
    span: ['class'],
  },
  ADD_ATTR: ['target', 'rel'],
};

function buildBaseFilter({ includeDrafts = false } = {}) {
  const filter = {
    resourceType: BLOG_RESOURCE_TYPE,
  };

  if (!includeDrafts) {
    filter.status = 'published';
  } else {
    filter.status = { $in: ['draft', 'published'] };
  }

  // Prefer resources explicitly marked as blog entries but gracefully fall back to all articles.
  filter.$or = [
    { 'metadata.section': 'blog' },
    { 'metadata.collection': 'blog' },
    { 'metadata.contentType': 'blog' },
    { 'metadata.isBlog': true },
    { body: { $exists: true, $ne: '' } },
  ];

  return filter;
}

function coercePageSize(limit) {
  if (!limit) return DEFAULT_PAGE_SIZE;
  const numeric = Number(limit);
  if (Number.isNaN(numeric) || numeric <= 0) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.min(numeric, MAX_PAGE_SIZE);
}

function coercePage(page) {
  if (!page) return 1;
  const numeric = Number(page);
  if (Number.isNaN(numeric) || numeric <= 0) {
    return 1;
  }
  return Math.floor(numeric);
}

function normalizeString(value) {
  if (!value) return '';
  return String(value).trim();
}

function renderMarkdownToHtml(markdown = '') {
  if (!markdown) return '';
  try {
    return marked.parse(markdown, { async: false });
  } catch (error) {
    console.error('Error parsing markdown content:', error);
    return markdown;
  }
}

function buildArticleResponse(resource, { includeBody = false } = {}) {
  if (!resource) {
    return null;
  }

  const publishedAt = resource.publishedAt || resource.createdAt;
  const category =
    normalizeString(resource.metadata?.category) ||
    normalizeString(resource.aaType) ||
    DEFAULT_CATEGORY;

  const markdownBody = resource.body || '';
  const htmlBody = renderMarkdownToHtml(markdownBody);
  const sanitizedBody = sanitizeRichText(htmlBody || '', SANITIZE_OPTIONS);
  const textBody = stripHtmlToText(sanitizedBody);

  const authorName =
    normalizeString(resource.metadata?.authorName) || DEFAULT_AUTHOR_NAME;

  const author = {
    id: resource.metadata?.authorId || null,
    name: authorName,
    avatar: normalizeString(resource.metadata?.authorAvatar) || null,
    bio: normalizeString(resource.metadata?.authorBio) || null,
  };

  const excerptSource =
    normalizeString(resource.summary) ||
    textBody.slice(0, 320);

  const excerpt =
    excerptSource.length > 0
      ? excerptSource.length > 320
        ? `${excerptSource.slice(0, 317).trimEnd()}…`
        : excerptSource
      : '';

  const baseArticle = {
    id: resource._id?.toString?.() || resource._id || null,
    slug: resource.slug,
    title: resource.title,
    excerpt,
    status: resource.status || 'draft',
    coverImage:
      normalizeString(resource.metadata?.coverImage) ||
      normalizeString(resource.metadata?.imageUrl) ||
      null,
    author,
    category,
    tags: Array.isArray(resource.topics) ? resource.topics : [],
    publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
    isFeatured: Boolean(resource.isFeatured),
    readingTimeMinutes: null,
    body: null,
    rawBody: null,
  };

  if (includeBody) {
    const words = textBody ? textBody.split(/\s+/).filter(Boolean).length : 0;
    const readingTime = words > 0 ? Math.max(1, Math.round(words / 200)) : 3;

    baseArticle.body = sanitizedBody;
    baseArticle.rawBody = markdownBody;
    baseArticle.readingTimeMinutes = readingTime;
  }

  return baseArticle;
}

export async function fetchBlogArticles({
  page = 1,
  limit = DEFAULT_PAGE_SIZE,
  category,
  tag,
  search,
  includeDrafts = false,
} = {}) {
  const { db } = await connectToDatabase();
  const collection = db.collection(BLOG_COLLECTION);

  const safePage = coercePage(page);
  const safeLimit = coercePageSize(limit);
  const skip = (safePage - 1) * safeLimit;

  const filter = buildBaseFilter({ includeDrafts });

  if (category && category !== 'all') {
    filter['metadata.category'] = category;
  }

  if (tag && tag !== 'all') {
    filter.topics = tag;
  }

  let cursor;
  if (search) {
    filter.$text = { $search: search };
    cursor = collection
      .find(filter, { projection: { score: { $meta: 'textScore' } } })
      .sort({ score: { $meta: 'textScore' }, isFeatured: -1, publishedAt: -1, createdAt: -1 });
  } else {
    cursor = collection
      .find(filter)
      .sort({ isFeatured: -1, publishedAt: -1, createdAt: -1 });
  }

  const [total, resources] = await Promise.all([
    collection.countDocuments(filter),
    cursor.skip(skip).limit(safeLimit).toArray(),
  ]);

  const articles = resources.map((resource) => buildArticleResponse(resource));

  return {
    articles,
    total,
    page: safePage,
    limit: safeLimit,
    pageCount: Math.max(1, Math.ceil(total / safeLimit)),
  };
}

export async function fetchBlogArticleBySlug(slug, { includeDrafts = false, previewToken = null } = {}) {
  if (!slug) return null;

  const { db } = await connectToDatabase();
  const collection = db.collection(BLOG_COLLECTION);

  const filter = buildBaseFilter({ includeDrafts: includeDrafts || Boolean(previewToken) });
  filter.slug = slug;
  if (previewToken) {
    filter['metadata.previewToken'] = previewToken;
  }

  const resource = await collection.findOne(filter);
  const article = buildArticleResponse(resource, { includeBody: true });

  if (!article) return null;

  if (!previewToken && article.status !== 'published') {
    return null;
  }

  if (previewToken) {
    article.isPreview = article.status !== 'published';
  }

  return article;
}

export async function fetchRelatedBlogArticles({
  slug,
  category,
  tags = [],
  limit = 3,
} = {}) {
  const { db } = await connectToDatabase();
  const collection = db.collection(BLOG_COLLECTION);

  const filter = buildBaseFilter();
  filter.slug = { $ne: slug };

  const orConditions = [];
  if (category) {
    orConditions.push({ 'metadata.category': category });
  }
  if (tags.length > 0) {
    orConditions.push({ topics: { $in: tags } });
  }

  if (orConditions.length > 0) {
    filter.$and = [{ $or: orConditions }];
  }

  const relatedResources = await collection
    .find(filter)
    .sort({ isFeatured: -1, publishedAt: -1, createdAt: -1 })
    .limit(limit)
    .toArray();

  return relatedResources.map((resource) => buildArticleResponse(resource));
}

export async function fetchBlogCategories({ includeDrafts = false } = {}) {
  const { db } = await connectToDatabase();
  const collection = db.collection(BLOG_COLLECTION);

  const filter = buildBaseFilter({ includeDrafts });

  const categories = await collection.distinct('metadata.category', filter);
  return categories
    .map((category) => normalizeString(category))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

export async function fetchBlogTags({ includeDrafts = false } = {}) {
  const { db } = await connectToDatabase();
  const collection = db.collection(BLOG_COLLECTION);

  const filter = buildBaseFilter({ includeDrafts });

  const tags = await collection.distinct('topics', filter);
  return tags
    .map((tag) => normalizeString(tag))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

