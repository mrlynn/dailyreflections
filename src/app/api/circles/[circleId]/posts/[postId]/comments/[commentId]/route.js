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
    const commentId = toObjectId(params?.commentId, 'Comment not found.');

    const commentsCollection = await getCirclesCollection('COMMENTS');
    const existingComment = await commentsCollection.findOne({
      _id: commentId,
      postId,
      circleId: circle._id,
      isDeleted: { $ne: true },
    });

    if (!existingComment) {
      const error = new Error('Comment not found.');
      error.status = 404;
      error.code = 'CIRCLE_COMMENT_NOT_FOUND';
      throw error;
    }

    if (!existingComment.authorId?.equals(viewerId)) {
      const error = new Error('Only the author can edit this comment.');
      error.status = 403;
      error.code = 'CIRCLE_COMMENT_EDIT_FORBIDDEN';
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

    await commentsCollection.updateOne(
      { _id: commentId },
      {
        $set: {
          content: value.content,
          updatedAt: now,
        },
      },
    );

    const updatedCommentDocs = await commentsCollection
      .aggregate([
        { $match: { _id: commentId } },
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

    const updatedComment = updatedCommentDocs.length
      ? updatedCommentDocs[0]
      : await commentsCollection.findOne({ _id: commentId });

    return NextResponse.json({
      comment: serializeCircleComment(updatedComment, viewerId.toString()),
    });
  } catch (error) {
    console.error('Failed to update circle comment:', error);
    const status = error.status || 500;
    return NextResponse.json(
      {
        error:
          status === 500
            ? 'Unable to update comment.'
            : error.message || 'Request failed.',
        code: error.code || 'CIRCLE_COMMENT_UPDATE_FAILED',
      },
      { status },
    );
  }
}

