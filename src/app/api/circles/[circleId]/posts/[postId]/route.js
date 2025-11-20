import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireCirclesAccess } from '@/lib/circles/guards';
import {
  requireActiveMembership,
  resolveCircleFromParams,
} from '@/lib/circles/membership';
import { getCirclesCollection } from '@/lib/circles/db';
import { normalizePostPayload } from '@/lib/circles/validation';
import { serializeCirclePost } from '@/lib/circles/transform';

function toObjectId(value, message = 'Invalid identifier') {
  if (value instanceof ObjectId) return value;
  if (!ObjectId.isValid(value)) {
    const error = new Error(message);
    error.status = 400;
    error.code = 'INVALID_ID';
    throw error;
  }
  return new ObjectId(value);
}

export async function PATCH(request, context) {
  try {
    const { session } = await requireCirclesAccess();
    const viewerId = new ObjectId(session.user.id);

    const circle = await resolveCircleFromParams(context?.params);
    await requireActiveMembership(circle._id, viewerId);

    const params =
      typeof context?.params?.then === 'function' ? await context.params : context?.params;
    const postId = toObjectId(params?.postId, 'Post not found.');

    const postsCollection = await getCirclesCollection('POSTS');
    const existingPost = await postsCollection.findOne({
      _id: postId,
      circleId: circle._id,
      isDeleted: { $ne: true },
    });

    if (!existingPost) {
      const error = new Error('Post not found.');
      error.status = 404;
      error.code = 'CIRCLE_POST_NOT_FOUND';
      throw error;
    }

    if (!existingPost.authorId?.equals(viewerId)) {
      const error = new Error('Only the author can edit this post.');
      error.status = 403;
      error.code = 'CIRCLE_POST_EDIT_FORBIDDEN';
      throw error;
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      const error = new Error('Invalid JSON payload.');
      error.status = 400;
      error.code = 'INVALID_JSON';
      throw error;
    }

    const mergedPayload = {
      type: payload.type ?? existingPost.type,
      content: payload.content ?? existingPost.content,
      stepTag:
        payload.stepTag !== undefined ? payload.stepTag : existingPost.stepTag ?? null,
      tags: payload.tags ?? existingPost.tags ?? [],
      linkedSource: payload.linkedSource ?? existingPost.linkedSource ?? null,
    };

    const normalized = normalizePostPayload(mergedPayload);
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

    await postsCollection.updateOne(
      { _id: postId },
      {
        $set: {
          type: value.type,
          content: value.content,
          stepTag: value.stepTag ?? null,
          tags: value.tags,
          linkedSource: value.linkedSource ?? null,
          updatedAt: now,
        },
      },
    );

    await (await getCirclesCollection('CIRCLES')).updateOne(
      { _id: circle._id },
      { $set: { updatedAt: now } },
    );

    const updatedPostDocs = await postsCollection
      .aggregate([
        { $match: { _id: postId } },
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

    const updatedPost = updatedPostDocs.length
      ? updatedPostDocs[0]
      : await postsCollection.findOne({ _id: postId });

    return NextResponse.json({
      post: serializeCirclePost(updatedPost, viewerId.toString()),
    });
  } catch (error) {
    console.error('Failed to update circle post:', error);
    const status = error.status || 500;
    return NextResponse.json(
      {
        error:
          status === 500 ? 'Unable to update post.' : error.message || 'Request failed.',
        code: error.code || 'CIRCLE_POST_UPDATE_FAILED',
      },
      { status },
    );
  }
}

