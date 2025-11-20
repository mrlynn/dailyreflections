import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireCirclesAccess } from '@/lib/circles/guards';
import {
  resolveCircleFromParams,
  requireAdminMembership,
} from '@/lib/circles/membership';
import { getCirclesCollection } from '@/lib/circles/db';
import { serializeCirclePost } from '@/lib/circles/transform';

async function loadPostWithAuthor(circleId, postId, viewerId) {
  const postsCollection = await getCirclesCollection('POSTS');
  const results = await postsCollection
    .aggregate([
      {
        $match: {
          _id: postId,
          circleId,
          isDeleted: { $ne: true },
        },
      },
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

  if (!results.length) {
    return null;
  }

  return serializeCirclePost(results[0], viewerId.toString());
}

function parsePostId(params) {
  const raw = typeof params?.then === 'function' ? null : params?.postId;
  const value = raw ?? null;
  if (!value || !ObjectId.isValid(value)) {
    const error = new Error('Post not found.');
    error.status = 404;
    error.code = 'CIRCLE_POST_NOT_FOUND';
    throw error;
  }
  return new ObjectId(value);
}

export async function POST(request, context) {
  try {
    const { session } = await requireCirclesAccess();
    const viewerId = new ObjectId(session.user.id);

    const circle = await resolveCircleFromParams(context?.params);
    await requireAdminMembership(circle._id, viewerId);

    const params = typeof context?.params?.then === 'function' ? await context.params : context?.params;
    const postId = parsePostId(params);

    const postsCollection = await getCirclesCollection('POSTS');
    const existing = await postsCollection.findOne({
      _id: postId,
      circleId: circle._id,
      isDeleted: { $ne: true },
    });

    if (!existing) {
      const error = new Error('Post not found.');
      error.status = 404;
      error.code = 'CIRCLE_POST_NOT_FOUND';
      throw error;
    }

    if (!existing.isPinned) {
      const now = new Date();
      await postsCollection.updateOne(
        { _id: postId },
        {
          $set: {
            isPinned: true,
            pinnedAt: now,
            pinnedBy: viewerId,
            updatedAt: now,
          },
        },
      );
      await (
        await getCirclesCollection('CIRCLES')
      ).updateOne(
        { _id: circle._id },
        { $set: { updatedAt: now } },
      );
    }

    const post = await loadPostWithAuthor(circle._id, postId, viewerId);
    if (!post) {
      const error = new Error('Post not found.');
      error.status = 404;
      error.code = 'CIRCLE_POST_NOT_FOUND';
      throw error;
    }

    post.isPinned = true;
    post.canPin = true;

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Failed to pin post:', error);
    const status = error.status || 500;
    return NextResponse.json(
      {
        error: status === 500 ? 'Unable to pin post.' : error.message || 'Request failed.',
        code: error.code || 'CIRCLE_POST_PIN_FAILED',
      },
      { status },
    );
  }
}

export async function DELETE(request, context) {
  try {
    const { session } = await requireCirclesAccess();
    const viewerId = new ObjectId(session.user.id);

    const circle = await resolveCircleFromParams(context?.params);
    await requireAdminMembership(circle._id, viewerId);

    const params = typeof context?.params?.then === 'function' ? await context.params : context?.params;
    const postId = parsePostId(params);

    const postsCollection = await getCirclesCollection('POSTS');
    const existing = await postsCollection.findOne({
      _id: postId,
      circleId: circle._id,
      isDeleted: { $ne: true },
    });

    if (!existing) {
      const error = new Error('Post not found.');
      error.status = 404;
      error.code = 'CIRCLE_POST_NOT_FOUND';
      throw error;
    }

    if (existing.isPinned) {
      const now = new Date();
      await postsCollection.updateOne(
        { _id: postId },
        {
          $set: {
            isPinned: false,
            pinnedAt: null,
            pinnedBy: null,
            updatedAt: now,
          },
        },
      );
      await (
        await getCirclesCollection('CIRCLES')
      ).updateOne(
        { _id: circle._id },
        { $set: { updatedAt: now } },
      );
    }

    const post = await loadPostWithAuthor(circle._id, postId, viewerId);
    if (!post) {
      const error = new Error('Post not found.');
      error.status = 404;
      error.code = 'CIRCLE_POST_NOT_FOUND';
      throw error;
    }

    post.isPinned = false;
    post.canPin = true;

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Failed to unpin post:', error);
    const status = error.status || 500;
    return NextResponse.json(
      {
        error: status === 500 ? 'Unable to unpin post.' : error.message || 'Request failed.',
        code: error.code || 'CIRCLE_POST_UNPIN_FAILED',
      },
      { status },
    );
  }
}

