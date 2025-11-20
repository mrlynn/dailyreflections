import { ObjectId } from 'mongodb';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';

const BLOG_COLLECTION = 'resources';
const VERSION_HISTORY_LIMIT = 20;

const BASE_FILTER = {
  resourceType: 'article',
  'metadata.isBlog': true,
};

const DEFAULT_CREATE_VALUES = {
  title: 'Untitled Article',
  summary: '',
  body: '',
  resourceType: 'article',
  topics: [],
  aaType: '',
  link: '',
  isFeatured: false,
  status: 'draft',
  publishedAt: null,
};

function slugify(value = '') {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeArray(input) {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map((item) => item?.toString?.().trim()).filter(Boolean);
  }
  if (typeof input === 'string') {
    return input
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return [];
}

async function ensureUniqueSlug(collection, slug, excludeId = null) {
  if (!slug) {
    slug = 'untitled';
  }
  let candidate = slug;
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const filter = {
      ...BASE_FILTER,
      slug: candidate,
    };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    const existing = await collection.findOne(filter, { projection: { _id: 1 } });
    if (!existing) {
      return candidate;
    }
    suffix += 1;
    candidate = `${slug}-${suffix}`;
  }
}

function mapResourceToAdminArticle(doc) {
  if (!doc) return null;
  const metadata = doc.metadata || {};
  return {
    id: doc._id?.toString() ?? null,
    title: doc.title ?? '',
    slug: doc.slug ?? '',
    summary: doc.summary ?? '',
    body: doc.body ?? '',
    status: doc.status ?? 'draft',
    resourceType: doc.resourceType ?? 'article',
    topics: doc.topics ?? [],
    category: metadata.category ?? metadata.aaType ?? '',
    aaType: doc.aaType ?? '',
    coverImage: metadata.coverImage || metadata.imageUrl || '',
    heroImage: metadata.heroImage || '',
    featuredHero: Boolean(metadata.featuredHero),
    allowComments: Boolean(metadata.allowComments),
    isFeatured: Boolean(doc.isFeatured),
    link: doc.link || '',
    publishedAt: doc.publishedAt ? new Date(doc.publishedAt).toISOString() : null,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
    author: {
      id: metadata.authorId || null,
      name: metadata.authorName || '',
      avatar: metadata.authorAvatar || '',
      bio: metadata.authorBio || '',
    },
    seo: {
      title: metadata.seoTitle || '',
      description: metadata.seoDescription || '',
      keywords: metadata.seoKeywords || [],
    },
    previewToken: metadata.previewToken || null,
    versionHistory: (metadata.versionHistory || []).map((entry) => ({
      id: entry.id || entry._id || crypto.randomUUID(),
      createdAt: entry.createdAt ? new Date(entry.createdAt).toISOString() : null,
      authorName: entry.authorName || '',
      authorId: entry.authorId || null,
      summary: entry.summary || '',
      title: entry.title || '',
      status: entry.status || 'draft',
      slug: entry.slug || '',
    })),
  };
}

function buildMetadataUpdate(data = {}) {
  const update = {};
  if (data.category !== undefined) {
    update['metadata.category'] = data.category || '';
  }
  if (data.coverImage !== undefined) {
    update['metadata.coverImage'] = data.coverImage || '';
    update['metadata.imageUrl'] = data.coverImage || '';
  }
  if (data.heroImage !== undefined) {
    update['metadata.heroImage'] = data.heroImage || '';
  }
  if (data.featuredHero !== undefined) {
    update['metadata.featuredHero'] = Boolean(data.featuredHero);
  }
  if (data.allowComments !== undefined) {
    update['metadata.allowComments'] = Boolean(data.allowComments);
  }
  if (data.author) {
    if (data.author.name !== undefined) {
      update['metadata.authorName'] = data.author.name || '';
    }
    if (data.author.avatar !== undefined) {
      update['metadata.authorAvatar'] = data.author.avatar || '';
    }
    if (data.author.bio !== undefined) {
      update['metadata.authorBio'] = data.author.bio || '';
    }
    if (data.author.id !== undefined) {
      update['metadata.authorId'] = data.author.id || null;
    }
  }
  if (data.seo) {
    if (data.seo.title !== undefined) {
      update['metadata.seoTitle'] = data.seo.title || '';
    }
    if (data.seo.description !== undefined) {
      update['metadata.seoDescription'] = data.seo.description || '';
    }
    if (data.seo.keywords !== undefined) {
      const keywords = normalizeArray(data.seo.keywords);
      update['metadata.seoKeywords'] = keywords;
    }
  }
  update['metadata.isBlog'] = true;
  update['metadata.section'] = 'blog';
  return update;
}

export async function listBlogArticles({
  search,
  status = 'all',
  category,
  tag,
  limit = 200,
} = {}) {
  const { db } = await connectToDatabase();
  const collection = db.collection(BLOG_COLLECTION);

  const filter = { ...BASE_FILTER };

  if (status !== 'all') {
    filter.status = status;
  }

  if (category && category !== 'all') {
    filter['metadata.category'] = category;
  }

  if (tag && tag !== 'all') {
    filter.topics = tag;
  }

  const queryOptions = {
    sort: { updatedAt: -1, createdAt: -1 },
    limit: Math.min(Math.max(parseInt(limit, 10) || 50, 1), 500),
    projection: {
      title: 1,
      slug: 1,
      summary: 1,
      status: 1,
      topics: 1,
      isFeatured: 1,
      publishedAt: 1,
      updatedAt: 1,
      createdAt: 1,
      'metadata.category': 1,
      'metadata.coverImage': 1,
      'metadata.previewToken': 1,
    },
  };

  let cursor;
  if (search) {
    filter.$text = { $search: search };
    cursor = collection
      .find(filter, {
        ...queryOptions,
        projection: { ...queryOptions.projection, score: { $meta: 'textScore' } },
      })
      .sort({ score: { $meta: 'textScore' }, updatedAt: -1 });
  } else {
    cursor = collection.find(filter, queryOptions);
  }

  const items = await cursor.toArray();
  return items.map((doc) =>
    mapResourceToAdminArticle(doc)
  );
}

export async function createBlogArticle(data = {}, user = null) {
  const { db } = await connectToDatabase();
  const collection = db.collection(BLOG_COLLECTION);

  const now = new Date();
  const document = {
    ...DEFAULT_CREATE_VALUES,
    ...data,
    title: data.title?.trim() || DEFAULT_CREATE_VALUES.title,
    summary: data.summary ?? DEFAULT_CREATE_VALUES.summary,
    body: data.body ?? DEFAULT_CREATE_VALUES.body,
    topics: normalizeArray(data.topics || data.tags),
    status: data.status || 'draft',
    isFeatured: Boolean(data.isFeatured),
    createdAt: now,
    updatedAt: now,
    metadata: {
      isBlog: true,
      section: 'blog',
      category: data.category || '',
      coverImage: data.coverImage || '',
      imageUrl: data.coverImage || '',
      featuredHero: Boolean(data.featuredHero),
      allowComments: Boolean(data.allowComments),
      previewToken: crypto.randomBytes(16).toString('hex'),
      authorName: data.author?.name || user?.name || '',
      authorAvatar: data.author?.avatar || '',
      authorBio: data.author?.bio || '',
      authorId: data.author?.id || user?.id || null,
      seoTitle: data.seo?.title || '',
      seoDescription: data.seo?.description || '',
      seoKeywords: normalizeArray(data.seo?.keywords),
      versionHistory: [],
    },
  };

  document.slug = await ensureUniqueSlug(collection, data.slug ? slugify(data.slug) : slugify(document.title));

  const result = await collection.insertOne(document);
  const created = await collection.findOne({ _id: result.insertedId });
  return mapResourceToAdminArticle(created);
}

function buildVersionEntry(doc, user) {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date(),
    authorId: user?.id || null,
    authorName: user?.name || '',
    title: doc.title || '',
    summary: doc.summary || '',
    body: doc.body || '',
    status: doc.status || 'draft',
    slug: doc.slug || '',
  };
}

export async function getBlogArticleById(identifier) {
  if (!identifier) return null;

  const { db } = await connectToDatabase();
  const collection = db.collection(BLOG_COLLECTION);

  const filter = { ...BASE_FILTER };
  if (ObjectId.isValid(identifier)) {
    filter._id = new ObjectId(identifier);
  } else {
    filter.slug = identifier;
  }

  const doc = await collection.findOne(filter);
  return mapResourceToAdminArticle(doc);
}

export async function updateBlogArticle(identifier, data = {}, options = {}) {
  if (!identifier) {
    throw new Error('Article identifier is required');
  }

  const { autosave = false, recordVersion = false, restoreVersionId = null, user = null } = options;
  const { db } = await connectToDatabase();
  const collection = db.collection(BLOG_COLLECTION);

  const filter = { ...BASE_FILTER };
  let objectId = null;
  if (ObjectId.isValid(identifier)) {
    objectId = new ObjectId(identifier);
    filter._id = objectId;
  } else {
    filter.slug = identifier;
  }

  const existing = await collection.findOne(filter);
  if (!existing) {
    throw new Error('Article not found');
  }

  let updateDoc = {};
  const setDoc = {};

  if (restoreVersionId) {
    const versionEntry = (existing.metadata?.versionHistory || []).find(
      (entry) => entry.id === restoreVersionId || entry._id?.toString() === restoreVersionId
    );
    if (!versionEntry) {
      throw new Error('Version not found');
    }
    setDoc.title = versionEntry.title;
    setDoc.summary = versionEntry.summary;
    setDoc.body = versionEntry.body;
    setDoc.slug = await ensureUniqueSlug(collection, slugify(versionEntry.slug || versionEntry.title || existing.slug), existing._id);
    setDoc.updatedAt = new Date();
    updateDoc.$set = { ...setDoc };
  } else {
    if (data.title !== undefined) {
      setDoc.title = data.title;
    }
    if (data.summary !== undefined) {
      setDoc.summary = data.summary;
    }
    if (data.body !== undefined) {
      setDoc.body = data.body;
    }
    if (data.tags !== undefined || data.topics !== undefined) {
      setDoc.topics = normalizeArray(data.tags ?? data.topics);
    }
    if (data.link !== undefined) {
      setDoc.link = data.link || '';
    }
    if (data.isFeatured !== undefined) {
      setDoc.isFeatured = Boolean(data.isFeatured);
    }
    if (data.status !== undefined) {
      setDoc.status = data.status;
      if (data.status === 'published') {
        setDoc.publishedAt = data.publishedAt ? new Date(data.publishedAt) : new Date();
      } else if (data.status === 'draft') {
        setDoc.publishedAt = null;
      }
    }
    if (data.publishedAt !== undefined) {
      setDoc.publishedAt = data.publishedAt ? new Date(data.publishedAt) : null;
    }
    if (data.slug !== undefined) {
      const newSlug = slugify(data.slug || data.title || existing.slug);
      setDoc.slug = await ensureUniqueSlug(collection, newSlug, existing._id);
    }

    setDoc.updatedAt = new Date();
    if (user?.id && ObjectId.isValid(user.id)) {
      setDoc.updatedBy = new ObjectId(user.id);
    }

    const metadataUpdate = buildMetadataUpdate(data);
    updateDoc.$set = { ...setDoc, ...metadataUpdate };
  }

  updateDoc.$set = updateDoc.$set || {};
  updateDoc.$set['metadata.isBlog'] = true;
  updateDoc.$set['metadata.section'] = 'blog';
  updateDoc.$set.updatedAt = updateDoc.$set.updatedAt || new Date();

  if (autosave) {
    updateDoc.$set['metadata.draftUpdatedAt'] = new Date();
  }

  if (recordVersion) {
    const newSnapshot = buildVersionEntry(
      {
        ...existing,
        ...setDoc,
      },
      user
    );
    updateDoc.$push = {
      'metadata.versionHistory': {
        $each: [newSnapshot],
        $position: 0,
      },
    };
    updateDoc.$push['metadata.versionHistory'].$slice = VERSION_HISTORY_LIMIT;
  }

  const result = await collection.findOneAndUpdate(
    { _id: existing._id, ...BASE_FILTER },
    updateDoc,
    {
      returnDocument: 'after',
    }
  );

  return mapResourceToAdminArticle(result.value);
}

export async function createPreviewToken(identifier) {
  if (!identifier) {
    throw new Error('Article identifier is required');
  }
  const { db } = await connectToDatabase();
  const collection = db.collection(BLOG_COLLECTION);

  const filter = { ...BASE_FILTER };
  if (ObjectId.isValid(identifier)) {
    filter._id = new ObjectId(identifier);
  } else {
    filter.slug = identifier;
  }

  const token = crypto.randomBytes(16).toString('hex');
  const update = await collection.findOneAndUpdate(
    filter,
    {
      $set: {
        'metadata.previewToken': token,
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' }
  );

  if (!update.value) {
    throw new Error('Article not found');
  }

  return {
    token,
    article: mapResourceToAdminArticle(update.value),
  };
}

