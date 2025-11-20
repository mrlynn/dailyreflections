import { NextResponse } from 'next/server';
import mongoose from '@/lib/mongoose';
import { initMongoose } from '@/lib/mongoose';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { isAdmin } from '@/lib/adminUtils';
import Resource from '@/lib/models/Resource';

const toSlug = (value) =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const parseBooleanParam = (value, fallback = false) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  return ['true', '1', 'yes', 'on'].includes(value.toString().toLowerCase());
};

const parseArrayParam = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const toObjectIdOrNull = (value) => {
  if (!value) return null;
  return mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : null;
};

async function ensureUniqueSlug(baseSlug, excludeId = null) {
  let candidate = baseSlug;
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await Resource.findOne({
      slug: candidate,
      ...(excludeId
        ? {
            _id: {
              $ne: excludeId,
            },
          }
        : {}),
    })
      .select({ _id: 1 })
      .lean();

    if (!existing) {
      return candidate;
    }

    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }
}

function sanitizeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }
  return metadata;
}

// GET - Fetch resources with filters, pagination, and search
export async function GET(request) {
  try {
    await initMongoose();

    const url = new URL(request.url);
    const search = url.searchParams.get('q')?.trim();
    const resourceTypes = parseArrayParam(url.searchParams.get('type'));
    const topics = parseArrayParam(url.searchParams.get('topic'));
    const statusParam = url.searchParams.get('status');
    const featuredOnly = parseBooleanParam(url.searchParams.get('featured'), false);
    const page = Math.max(parseInt(url.searchParams.get('page') ?? '1', 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') ?? '20', 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const session = await auth();
    const userIsAdmin = isAdmin(session);

    const filters = {};

    if (userIsAdmin) {
      if (statusParam && statusParam !== 'all') {
        filters.status = statusParam;
      }
    } else {
      filters.status = 'published';
    }

    if (resourceTypes.length > 0) {
      filters.resourceType = {
        $in: resourceTypes,
      };
    }

    if (topics.length > 0) {
      filters.topics = {
        $in: topics,
      };
    }

    if (featuredOnly) {
      filters.isFeatured = true;
    }

    let query = Resource.find(filters);
    let countQuery = Resource.countDocuments(filters);

    let resources;
    let total;

    if (search) {
      const searchPipeline = [
        {
          $search: {
            index: 'default',
            compound: {
              should: [
                {
                  text: {
                    query: search,
                    path: 'title',
                    score: { boost: { value: 6 } },
                  },
                },
                {
                  text: {
                    query: search,
                    path: 'summary',
                    score: { boost: { value: 4 } },
                  },
                },
                {
                  text: {
                    query: search,
                    path: 'body',
                    score: { boost: { value: 2 } },
                    fuzzy: {
                      maxEdits: 1,
                      prefixLength: 2,
                    },
                  },
                },
                {
                  text: {
                    query: search,
                    path: 'topics',
                    score: { boost: { value: 3 } },
                  },
                },
                {
                  text: {
                    query: search,
                    path: 'resourceType',
                    score: { boost: { value: 1 } },
                  },
                },
              ],
            },
            highlight: {
              path: ['title', 'summary', 'body'],
            },
          },
        },
        {
          $addFields: {
            score: { $meta: 'searchScore' },
            highlights: { $meta: 'searchHighlights' },
          },
        },
        { $match: filters },
        { $sort: { score: -1, isFeatured: -1, publishedAt: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ];

      const totalPipeline = [
        {
          $search: {
            index: 'default',
            compound: {
              should: [
                {
                  text: {
                    query: search,
                    path: 'title',
                    fuzzy: {
                      maxEdits: 1,
                      prefixLength: 2,
                    },
                  },
                },
                {
                  text: {
                    query: search,
                    path: 'summary',
                  },
                },
                {
                  text: {
                    query: search,
                    path: 'body',
                  },
                },
                {
                  text: {
                    query: search,
                    path: 'topics',
                  },
                },
              ],
            },
          },
        },
        { $match: filters },
        { $count: 'total' },
      ];

      const [searchResults, totalResults] = await Promise.all([
        Resource.aggregate(searchPipeline),
        Resource.aggregate(totalPipeline),
      ]);

      resources = searchResults;
      total = totalResults[0]?.total ?? 0;
    } else {
      query = query.sort({ isFeatured: -1, publishedAt: -1, createdAt: -1 });
      resources = await query.skip(skip).limit(limit).lean();
      total = await countQuery;
    }

    return NextResponse.json({
      resources,
      pagination: {
        total,
        page,
        pageCount: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
  }
}

// POST - Create a new resource (admin only)
export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await initMongoose();

    const body = await request.json();

    const {
      title,
      summary = '',
      body: content = '',
      resourceType,
      topics = [],
      aaType = '',
      link = '',
      isFeatured = false,
      status = 'draft',
      publishedAt,
      metadata = {},
      slug: providedSlug,
    } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
    }

    if (!resourceType || typeof resourceType !== 'string') {
      return NextResponse.json({ error: 'resourceType is required.' }, { status: 400 });
    }

    if (link && typeof link === 'string') {
      try {
        new URL(link);
      } catch (error) {
        return NextResponse.json({ error: 'Link must be a valid URL.' }, { status: 400 });
      }
    }

    const baseSlug = providedSlug ? toSlug(providedSlug) : toSlug(title);
    const uniqueSlug = await ensureUniqueSlug(baseSlug);

    const createdBy = toObjectIdOrNull(session.user.id);

    const resource = await Resource.create({
      slug: uniqueSlug,
      title: title.trim(),
      summary: summary?.trim?.() ?? '',
      body: content ?? '',
      resourceType: resourceType.trim(),
      topics: Array.isArray(topics)
        ? topics.map((topic) => topic?.toString?.().trim()).filter(Boolean)
        : [],
      aaType: aaType?.trim?.() ?? '',
      link: link?.trim?.() ?? '',
      isFeatured: Boolean(isFeatured),
      status: ['draft', 'published', 'archived'].includes(status) ? status : 'draft',
      publishedAt: status === 'published' ? (publishedAt ? new Date(publishedAt) : new Date()) : null,
      metadata: sanitizeMetadata(metadata),
      createdBy,
      updatedBy: createdBy,
    });

    return NextResponse.json({ resource }, { status: 201 });
  } catch (error) {
    console.error('Error creating resource:', error);
    return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 });
  }
}

