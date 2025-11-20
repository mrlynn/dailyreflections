import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb';
import { CIRCLE_COLLECTIONS, CIRCLE_MEMBER_STATUS } from '@/lib/circles/constants';

function formatUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user._id?.toString(),
    name: user.name ?? null,
    displayName: user.displayName ?? null,
    email: user.email ?? null,
    profile: user.profile ?? null,
    image: user.image ?? null,
  };
}

export async function GET(request, context) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = typeof context?.params?.then === 'function' ? await context.params : context?.params;
    const circleId = params?.circleId;

    if (!circleId || !ObjectId.isValid(circleId)) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    const circleObjectId = new ObjectId(circleId);
    const client = await clientPromise;
    const db = client.db('dailyreflections');

    const circle = await db.collection(CIRCLE_COLLECTIONS.CIRCLES).findOne({
      _id: circleObjectId,
      isDeleted: { $ne: true },
    });

    if (!circle) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    const members = await db
      .collection(CIRCLE_COLLECTIONS.MEMBERS)
      .aggregate([
        { $match: { circleId: circleObjectId } },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
            pipeline: [
              {
                $project: {
                  name: 1,
                  displayName: 1,
                  email: 1,
                  profile: 1,
                  image: 1,
                  onboarding: 1,
                },
              },
            ],
          },
        },
        {
          $set: {
            user: { $first: '$user' },
          },
        },
        {
          $addFields: {
            statusSort: {
              $switch: {
                branches: [
                  { case: { $eq: ['$status', CIRCLE_MEMBER_STATUS.ACTIVE] }, then: 0 },
                  { case: { $eq: ['$status', CIRCLE_MEMBER_STATUS.PENDING] }, then: 1 },
                  { case: { $eq: ['$status', CIRCLE_MEMBER_STATUS.LEFT] }, then: 2 },
                ],
                default: 3,
              },
            },
          },
        },
        {
          $sort: { statusSort: 1, role: 1, createdAt: 1 },
        },
      ])
      .toArray();

    const formatted = members.map((member) => ({
      id: member._id?.toString(),
      userId: member.userId?.toString(),
      role: member.role,
      status: member.status,
      joinedAt: member.joinedAt,
      requestedAt: member.requestedAt ?? null,
      leftAt: member.leftAt ?? null,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
      removedAt: member.removedAt ?? null,
      removedBy: member.removedBy?.toString() ?? null,
      user: formatUser(member.user),
    }));

    return NextResponse.json({
      circle: {
        id: circle._id?.toString(),
        name: circle.name,
        visibility: circle.visibility,
        description: circle.description,
      },
      members: formatted,
    });
  } catch (error) {
    console.error('Failed to load circle members:', error);
    return NextResponse.json(
      { error: 'Failed to load members' },
      { status: 500 },
    );
  }
}

