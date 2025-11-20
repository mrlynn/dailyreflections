import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireCirclesAccess } from '@/lib/circles/guards';
import {
  requireActiveMembership,
  resolveCircleFromParams,
  isAdminMembership,
} from '@/lib/circles/membership';
import { getCirclesCollection } from '@/lib/circles/db';
import {
  CIRCLE_FEED_DEFAULT_PAGE_SIZE,
  CIRCLE_FEED_MAX_PAGE_SIZE,
} from '@/lib/circles/constants';
import { normalizePostPayload } from '@/lib/circles/validation';
import { serializeCirclePost } from '@/lib/circles/transform';

function parseLimit(searchParams) {
  const requested = Number.parseInt(searchParams.get('limit') ?? '', 10);
  if (Number.isNaN(requested) || requested <= 0) {
    return CIRCLE_FEED_DEFAULT_PAGE_SIZE;
  }
  return Math.min(requested, CIRCLE_FEED_MAX_PAGE_SIZE);
}

function parseCursor(searchParams) {
  const cursor = searchParams.get('cursor');
  if (!cursor) return null;
  const date = new Date(cursor);
  if (Number.isNaN(date.getTime())) {
    const error = new Error('Invalid cursor provided.');
    error.status = 400;
    error.code = 'INVALID_CURSOR';
    throw error;
  }
  return date;
}

function parseStepTag(searchParams) {
  const value = searchParams.get('stepTag');
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1 || parsed > 12) {
    const error = new Error('stepTag must be between 1 and 12.');
    error.status = 400;
    error.code = 'INVALID_STEP_TAG';
    throw error;
  }
  return parsed;
}

async function fetchPosts(circleId, viewerId, { limit, cursor, stepTag, excludeIds = [], canPin = false }) {
  const postsCollection = await getCirclesCollection('POSTS');

  const match = {
    circleId,
    isDeleted: { $ne: true },
    isPinned: { $ne: true },
  };

  if (cursor) {
    match.createdAt = { $lt: cursor };
  }

  if (stepTag) {
    match.stepTag = stepTag;
  }

  if (excludeIds.length) {
    match._id = { $nin: excludeIds };
  }

  const pipeline = [
    { $match: match },
    { $sort: { createdAt: -1, _id: -1 } },
    { $limit: limit + 1 },
    {
      $lookup: {
        from: 'users',
        localField: 'authorId',
        foreignField: '_id',
        pipeline: [
          {
            $project: {
              displayName: 1,
              name: 1,
              image: 1,
            },
          },
        ],
        as: 'author',
      },
    },
    {
      $set: {
        author: { $first: '$author' },
        commentCount: { $ifNull: ['$commentCount', 0] },
      },
    },
  ];

  const results = await postsCollection.aggregate(pipeline).toArray();

  const hasMore = results.length > limit;
  const trimmed = hasMore ? results.slice(0, limit) : results;
  const nextCursor =
    hasMore && trimmed.length
      ? trimmed[trimmed.length - 1].createdAt?.toISOString() ?? null
      : null;

  return {
    posts: trimmed.map((doc) => {
      if (canPin) {
        doc.canPin = true;
      }
      return serializeCirclePost(doc, viewerId.toString());
    }),
    nextCursor,
  };
}

async function fetchPinnedPosts(circleId, viewerId, { limit = 3, canPin = false }) {
  const postsCollection = await getCirclesCollection('POSTS');
  const pipeline = [
    {
      $match: {
        circleId,
        isDeleted: { $ne: true },
        isPinned: true,
      },
    },
    { $sort: { pinnedAt: -1, createdAt: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: 'authorId',
        foreignField: '_id',
        pipeline: [
          {
            $project: {
              displayName: 1,
              name: 1,
              image: 1,
            },
          },
        ],
        as: 'author',
      },
    },
    {
      $set: {
        author: { $first: '$author' },
        commentCount: { $ifNull: ['$commentCount', 0] },
      },
    },
  ];

  const results = await postsCollection.aggregate(pipeline).toArray();
  const serialized = results.map((doc) => {
    doc.isPinned = true;
    if (canPin) {
      doc.canPin = true;
    }
    return serializeCirclePost(doc, viewerId.toString());
  });

  const excludeIds = results.map((doc) => doc._id);
  return { pinned: serialized, excludeIds };
}

export async function GET(request, context) {
  try {
    const { session } = await requireCirclesAccess();
    const viewerId = new ObjectId(session.user.id);

    const circle = await resolveCircleFromParams(context?.params);
    const membership = await requireActiveMembership(circle._id, viewerId);
    const canPin = isAdminMembership(membership);

    const searchParams = request.nextUrl.searchParams;
    const limit = parseLimit(searchParams);
    const cursor = parseCursor(searchParams);
    const stepTag = parseStepTag(searchParams);

    const { pinned, excludeIds } = await fetchPinnedPosts(circle._id, viewerId, {
      limit: 3,
      canPin,
    });

    const { posts, nextCursor } = await fetchPosts(circle._id, viewerId, {
      limit,
      cursor,
      stepTag,
      excludeIds,
      canPin,
    });

    return NextResponse.json({ pinned, posts, nextCursor });
  } catch (error) {
    console.error('Failed to fetch circle posts:', error);
    const status = error.status || 500;
    return NextResponse.json(
      {
        error: status === 500 ? 'Unable to load posts.' : error.message || 'Request failed.',
        code: error.code || 'CIRCLE_POSTS_FETCH_FAILED',
      },
      { status },
    );
  }
}

export async function POST(request, context) {
  try {
    const { session } = await requireCirclesAccess();
    const viewerId = new ObjectId(session.user.id);

    const circle = await resolveCircleFromParams(context?.params);
    await requireActiveMembership(circle._id, viewerId);

    let payload;
    try {
      payload = await request.json();
    } catch (parseError) {
      const error = new Error('Invalid JSON payload.');
      error.status = 400;
      error.code = 'INVALID_JSON';
      throw error;
    }

    const normalized = normalizePostPayload(payload);
    if (!normalized.isValid) {
      return NextResponse.json(
        {
          error: normalized.errors[0],
          errors: normalized.errors,
          code: 'CIRCLE_POST_INVALID',
        },
        { status: 400 },
      );
    }

    const { value } = normalized;
    const now = new Date();

    const postDoc = {
      circleId: circle._id,
      authorId: viewerId,
      type: value.type,
      content: value.content,
      stepTag: value.stepTag ?? null,
      tags: value.tags,
      linkedSource: value.linkedSource,
      commentCount: 0,
      isDeleted: false,
      isPinned: false,
      pinnedAt: null,
      pinnedBy: null,
      createdAt: now,
      updatedAt: now,
    };

    const postsCollection = await getCirclesCollection('POSTS');
    const insertResult = await postsCollection.insertOne(postDoc);

    await (await getCirclesCollection('CIRCLES')).updateOne(
      { _id: circle._id },
      { $set: { updatedAt: now } },
    );

    const inserted = await postsCollection
      .aggregate([
        { $match: { _id: insertResult.insertedId } },
        {
          $lookup: {
            from: 'users',
            localField: 'authorId',
            foreignField: '_id',
            pipeline: [
              {
                $project: {
                  displayName: 1,
                  name: 1,
                  image: 1,
                },
              },
            ],
            as: 'author',
          },
        },
        {
          $set: {
            author: { $first: '$author' },
            commentCount: { $ifNull: ['$commentCount', 0] },
          },
        },
      ])
      .toArray();

    const post = inserted.length
      ? serializeCirclePost(inserted[0], viewerId.toString())
      : serializeCirclePost({ ...postDoc, _id: insertResult.insertedId }, viewerId.toString());

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Failed to create circle post:', error);
    const status = error.status || 500;
    return NextResponse.json(
      {
        error: status === 500 ? 'Unable to share with your circle.' : error.message || 'Request failed.',
        code: error.code || 'CIRCLE_POST_CREATE_FAILED',
      },
      { status },
    );
  }
}

