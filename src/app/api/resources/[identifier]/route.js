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

const toObjectIdOrNull = (value) => {
  if (!value) return null;
  return mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : null;
};

const parseTopics = (topics) => {
  if (!topics) return [];
  if (Array.isArray(topics)) {
    return topics.map((topic) => topic?.toString?.().trim()).filter(Boolean);
  }
  return [];
};

const parseBooleanParam = (value, fallback = false) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  return ['true', '1', 'yes', 'on'].includes(value.toString().toLowerCase());
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

async function resolveIdentifier(paramsPromise) {
  const params = typeof paramsPromise?.then === 'function' ? await paramsPromise : paramsPromise;
  const identifier = params?.identifier;
  if (!identifier || typeof identifier !== 'string') {
    return { filter: null, identifier: null };
  }

  const trimmed = identifier.trim();
  const objectId = toObjectIdOrNull(trimmed);
  if (objectId) {
    return { filter: { _id: objectId }, identifier: trimmed };
  }

  return { filter: { slug: trimmed.toLowerCase() }, identifier: trimmed.toLowerCase() };
}

export async function GET(request, context) {
  try {
    await initMongoose();

    const { filter, identifier } = await resolveIdentifier(context?.params);
    if (!filter) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    const resource = await Resource.findOne(filter).lean();
    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    if (resource.status !== 'published') {
      const session = await auth();
      if (!isAdmin(session)) {
        return NextResponse.json({ error: 'Resource not available' }, { status: 404 });
      }
    }

    return NextResponse.json({ resource, identifier });
  } catch (error) {
    console.error('Error fetching resource:', error);
    return NextResponse.json({ error: 'Failed to fetch resource' }, { status: 500 });
  }
}

export async function PUT(request, context) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await initMongoose();

    const { filter } = await resolveIdentifier(context?.params);
    if (!filter) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    const body = await request.json();

    const {
      title,
      summary,
      body: content,
      resourceType,
      topics,
      aaType,
      link,
      isFeatured,
      status,
      publishedAt,
      metadata,
      slug: providedSlug,
    } = body;

    const update = {};

    if (title !== undefined) {
      if (!title || typeof title !== 'string') {
        return NextResponse.json({ error: 'Title must be a non-empty string.' }, { status: 400 });
      }
      update.title = title.trim();
    }

    if (summary !== undefined) {
      update.summary = summary?.trim?.() ?? '';
    }

    if (content !== undefined) {
      update.body = content ?? '';
    }

    if (resourceType !== undefined) {
      if (!resourceType || typeof resourceType !== 'string') {
        return NextResponse.json({ error: 'resourceType must be provided.' }, { status: 400 });
      }
      update.resourceType = resourceType.trim();
    }

    if (topics !== undefined) {
      update.topics = parseTopics(topics);
    }

    if (aaType !== undefined) {
      update.aaType = aaType?.trim?.() ?? '';
    }

    if (link !== undefined) {
      if (link) {
        try {
          new URL(link);
        } catch (error) {
          return NextResponse.json({ error: 'Link must be a valid URL.' }, { status: 400 });
        }
      }
      update.link = link?.trim?.() ?? '';
    }

    if (isFeatured !== undefined) {
      update.isFeatured = Boolean(isFeatured);
    }

    if (status !== undefined) {
      if (!['draft', 'published', 'archived'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status value.' }, { status: 400 });
      }
      update.status = status;
      update.publishedAt =
        status === 'published' ? (publishedAt ? new Date(publishedAt) : new Date()) : null;
    } else if (publishedAt !== undefined) {
      update.publishedAt = publishedAt ? new Date(publishedAt) : null;
    }

    if (metadata !== undefined) {
      update.metadata = sanitizeMetadata(metadata);
    }

    if (providedSlug !== undefined) {
      const newSlug = toSlug(providedSlug || update.title || '');
      if (!newSlug) {
        return NextResponse.json({ error: 'Slug cannot be empty.' }, { status: 400 });
      }

      const identifierDoc = await Resource.findOne(filter).select({ _id: 1, slug: 1 }).lean();
      if (!identifierDoc) {
        return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
      }

      const uniqueSlug = await ensureUniqueSlug(newSlug, identifierDoc._id);
      update.slug = uniqueSlug;
    }

    const updatedBy = toObjectIdOrNull(session.user.id);
    if (updatedBy) {
      update.updatedBy = updatedBy;
    }

    const resource = await Resource.findOneAndUpdate(
      filter,
      { $set: update },
      { new: true, runValidators: true }
    ).lean();

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    return NextResponse.json({ resource });
  } catch (error) {
    console.error('Error updating resource:', error);
    return NextResponse.json({ error: 'Failed to update resource' }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const session = await getSession(request);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await initMongoose();

    const { filter } = await resolveIdentifier(context?.params);
    if (!filter) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    const url = new URL(request.url);
    const hardDelete = parseBooleanParam(url.searchParams.get('hard'), false);
    const softDelete = !hardDelete;

    if (softDelete) {
      const resource = await Resource.findOneAndUpdate(
        filter,
        {
          $set: {
            status: 'archived',
            updatedAt: new Date(),
            updatedBy: toObjectIdOrNull(session.user.id),
          },
        },
        { new: true }
      ).lean();

      if (!resource) {
        return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
      }

      return NextResponse.json({ resource, softDeleted: true });
    }

    const result = await Resource.deleteOne(filter);
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deleted: true });
  } catch (error) {
    console.error('Error deleting resource:', error);
    return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 });
  }
}

