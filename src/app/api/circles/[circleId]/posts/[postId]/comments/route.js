import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireCirclesAccess } from '@/lib/circles/guards';
import {
  requireActiveMembership,
  resolveCircleFromParams,
} from '@/lib/circles/membership';
import { getCirclesCollection } from '@/lib/circles/db';
import { normalizeCommentPayload } from '@/lib/circles/validation';
import { serializeCircleComment } from '@/lib/circles/transform';

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 75;

function toObjectId(id, errorMessage = 'Invalid identifier.') {
  if (id instanceof ObjectId) return id;
  if (!ObjectId.isValid(id)) {
    const error = new Error(errorMessage);
    error.status = 400;
    error.code = 'INVALID_ID';
    throw error;
  }
  return new ObjectId(id);
}

function parseLimit(searchParams) {
  const requested = Number.parseInt(searchParams.get('limit') ?? '', 10);
  if (Number.isNaN(requested) || requested <= 0) {
    return DEFAULT_LIMIT;
  }
  return Math.min(requested, MAX_LIMIT);
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

async function ensurePost(circleId, postId) {
  const postsCollection = await getCirclesCollection('POSTS');
  const post = await postsCollection.findOne({
    _id: postId,
    circleId,
    isDeleted: { $ne: true },
  });

  if (!post) {
    const error = new Error('Post not found.');
    error.status = 404;
    error.code = 'CIRCLE_POST_NOT_FOUND';
    throw error;
  }

  return post;
}

async function fetchComments(circleId, postId, viewerId, { limit, cursor }) {
  const commentsCollection = await getCirclesCollection('COMMENTS');
  const match = {
    circleId,
    postId,
    isDeleted: { $ne: true },
  };

  if (cursor) {
    match.createdAt = { $lt: cursor };
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
      },
    },
  ];

  const results = await commentsCollection.aggregate(pipeline).toArray();

  const hasMore = results.length > limit;
  const trimmed = hasMore ? results.slice(0, limit) : results;
  const nextCursor =
    hasMore && trimmed.length
      ? trimmed[trimmed.length - 1].createdAt?.toISOString() ?? null
      : null;

  const serialized = trimmed
    .map((doc) => serializeCircleComment(doc, viewerId.toString()))
    .reverse(); // return ascending order

  return {
    comments: serialized,
    nextCursor,
  };
}

export async function GET(request, context) {
  try {
    const { session } = await requireCirclesAccess();
    const viewerId = new ObjectId(session.user.id);

    const circle = await resolveCircleFromParams(context?.params);
    await requireActiveMembership(circle._id, viewerId);

    const params = typeof context?.params?.then === 'function' ? await context.params : context?.params;
    const postId = toObjectId(params?.postId, 'Post not found.');

    await ensurePost(circle._id, postId);

    const searchParams = request.nextUrl.searchParams;
    const limit = parseLimit(searchParams);
    const cursor = parseCursor(searchParams);

    const { comments, nextCursor } = await fetchComments(circle._id, postId, viewerId, {
      limit,
      cursor,
    });

    return NextResponse.json({ comments, nextCursor });
  } catch (error) {
    console.error('Failed to fetch circle comments:', error);
    const status = error.status || 500;
    return NextResponse.json(
      {
        error: status === 500 ? 'Unable to load comments.' : error.message || 'Request failed.',
        code: error.code || 'CIRCLE_COMMENTS_FETCH_FAILED',
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

    const params = typeof context?.params?.then === 'function' ? await context.params : context?.params;
    const postId = toObjectId(params?.postId, 'Post not found.');

    await ensurePost(circle._id, postId);

    let payload;
    try {
      payload = await request.json();
    } catch {
      const error = new Error('Invalid JSON payload.');
      error.status = 400;
      error.code = 'INVALID_JSON';
      throw error;
    }

    const normalized = normalizeCommentPayload(payload);
    if (!normalized.isValid) {
      return NextResponse.json(
        {
          error: normalized.errors[0],
          errors: normalized.errors,
          code: 'CIRCLE_COMMENT_INVALID',
        },
        { status: 400 },
      );
    }

    const { value } = normalized;
    const now = new Date();

    let parentId = null;
    if (value.parentId) {
      parentId = toObjectId(value.parentId, 'Parent comment not found.');
      const commentsCollection = await getCirclesCollection('COMMENTS');
      const parentComment = await commentsCollection.findOne({
        _id: parentId,
        postId,
        circleId: circle._id,
        isDeleted: { $ne: true },
      });
      if (!parentComment) {
        const error = new Error('Parent comment not found.');
        error.status = 404;
        error.code = 'CIRCLE_PARENT_COMMENT_MISSING';
        throw error;
      }
    }

    const commentsCollection = await getCirclesCollection('COMMENTS');
    const commentDoc = {
      circleId: circle._id,
      postId,
      authorId: viewerId,
      content: value.content,
      parentId,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    const insertResult = await commentsCollection.insertOne(commentDoc);

    await (await getCirclesCollection('POSTS')).updateOne(
      { _id: postId },
      { $inc: { commentCount: 1 }, $set: { updatedAt: now } },
    );

    const inserted = await commentsCollection
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
          },
        },
      ])
      .toArray();

    const comment = inserted.length
      ? serializeCircleComment(inserted[0], viewerId.toString())
      : serializeCircleComment({ ...commentDoc, _id: insertResult.insertedId }, viewerId.toString());

    return NextResponse.json({ comment });
  } catch (error) {
    console.error('Failed to create circle comment:', error);
    const status = error.status || 500;
    return NextResponse.json(
      {
        error:
          status === 500 ? 'Unable to add your comment.' : error.message || 'Request failed.',
        code: error.code || 'CIRCLE_COMMENT_CREATE_FAILED',
      },
      { status },
    );
  }
}

