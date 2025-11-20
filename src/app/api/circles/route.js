import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import {
  CIRCLE_MEMBER_STATUS,
  CIRCLE_ROLES,
  CIRCLE_COLLECTIONS,
  CIRCLE_VISIBILITY,
} from '@/lib/circles/constants';
import { getCirclesCollection, getCirclesDb } from '@/lib/circles/db';
import { requireCirclesAccess } from '@/lib/circles/guards';
import {
  assertCanCreateAnotherCircle,
  normalizeCirclePayload,
} from '@/lib/circles/validation';
import { serializeCircle, serializeCircleSummary } from '@/lib/circles/transform';
import { generateUniqueCircleSlug } from '@/lib/circles/slug';

export async function GET() {
  try {
    const { session } = await requireCirclesAccess();
    const userId = new ObjectId(session.user.id);

    const membersCollection = await getCirclesCollection('MEMBERS');
    const memberships = await membersCollection
      .find({
        userId,
        status: CIRCLE_MEMBER_STATUS.ACTIVE,
      })
      .toArray();

    if (!memberships.length) {
      return NextResponse.json({ circles: [] });
    }

    const circleIds = memberships.map((m) => m.circleId);
    const membershipMap = new Map(
      memberships.map((m) => [m.circleId.toString(), m]),
    );

    const db = await getCirclesDb();

    const circles = await db
      .collection(CIRCLE_COLLECTIONS.CIRCLES)
      .aggregate([
        {
          $match: {
            _id: { $in: circleIds },
            isDeleted: { $ne: true },
          },
        },
        {
          $lookup: {
            from: CIRCLE_COLLECTIONS.MEMBERS,
            localField: '_id',
            foreignField: 'circleId',
            pipeline: [
              { $match: { status: CIRCLE_MEMBER_STATUS.ACTIVE } },
              { $count: 'count' },
            ],
            as: 'memberStats',
          },
        },
        {
          $addFields: {
            memberCount: {
              $ifNull: [{ $first: '$memberStats.count' }, 0],
            },
          },
        },
        {
          $project: {
            memberStats: 0,
            allowMultipleInvites: 0,
          },
        },
        {
          $sort: {
            updatedAt: -1,
          },
        },
      ])
      .toArray();

    const response = circles.map((circle) =>
      serializeCircleSummary(circle, membershipMap.get(circle._id.toString())),
    );

    return NextResponse.json({ circles: response });
  } catch (error) {
    console.error('Failed to list circles:', error);
    const status = error.status || 500;
    const message =
      status === 500 ? 'Unable to load circles.' : error.message || 'Request failed.';
    return NextResponse.json(
      {
        error: message,
        code: error.code || 'CIRCLES_LIST_FAILED',
      },
      { status },
    );
  }
}

export async function POST(request) {
  try {
    const { session } = await requireCirclesAccess();
    const userId = new ObjectId(session.user.id);

    const payload = await request.json();
    const { isValid, errors, value } = normalizeCirclePayload(payload);

    if (!isValid) {
      return NextResponse.json(
        {
          error: 'Invalid circle data.',
          details: errors,
        },
        { status: 400 },
      );
    }

    const circlesCollection = await getCirclesCollection('CIRCLES');
    const membersCollection = await getCirclesCollection('MEMBERS');

    const existingCount = await circlesCollection.countDocuments({
      createdBy: userId,
      isDeleted: { $ne: true },
    });

    assertCanCreateAnotherCircle(existingCount);

    const now = new Date();
    const circleId = new ObjectId();
    const slug = await generateUniqueCircleSlug(value.name, circleId);
    const circleDoc = {
      _id: circleId,
      name: value.name,
      description: value.description,
      type: value.type,
      maxMembers: value.maxMembers,
      allowMultipleInvites: value.allowMultipleInvites,
      visibility: value.visibility,
      slug,
      createdBy: userId,
      memberCount: 1,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    await circlesCollection.insertOne(circleDoc);

    await membersCollection.insertOne({
      circleId,
      userId,
      role: CIRCLE_ROLES.OWNER,
      status: CIRCLE_MEMBER_STATUS.ACTIVE,
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    const createdCircle = await circlesCollection.findOne({ _id: circleId });

    return NextResponse.json(
      {
        circle: serializeCircle(createdCircle, {
          role: CIRCLE_ROLES.OWNER,
          status: CIRCLE_MEMBER_STATUS.ACTIVE,
          joinedAt: now,
        }),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Failed to create circle:', error);
    const status = error.code === 'CIRCLE_LIMIT_REACHED' ? 400 : error.status || 500;
    const response = {
      error:
        status === 500 ? 'Unable to create circle.' : error.message || 'Invalid request.',
      code: error.code || 'CIRCLE_CREATE_FAILED',
    };

    if (Array.isArray(error.details)) {
      response.details = error.details;
    }

    if (!response.details && error.details) {
      response.details = [error.details];
    }

    return NextResponse.json(response, { status });
  }
}

