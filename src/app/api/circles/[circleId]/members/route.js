import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireCirclesAccess } from '@/lib/circles/guards';
import {
  isAdminMembership,
  requireActiveMembership,
  requireCircle,
} from '@/lib/circles/membership';
import { getCirclesCollection } from '@/lib/circles/db';
import { CIRCLE_MEMBER_STATUS } from '@/lib/circles/constants';

function resolveCircleId(paramsPromise) {
  const params = typeof paramsPromise?.then === 'function' ? paramsPromise : Promise.resolve(paramsPromise);
  return params.then((paramsObj) => {
    const circleId = paramsObj?.circleId;
    if (!circleId || !ObjectId.isValid(circleId)) {
      const error = new Error('Circle not found.');
      error.status = 404;
      error.code = 'CIRCLE_INVALID_ID';
      throw error;
    }
    return new ObjectId(circleId);
  });
}

function mapMember(doc) {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    role: doc.role,
    status: doc.status,
    joinedAt: doc.joinedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    leftAt: doc.leftAt ?? null,
    displayName: doc.user?.displayName ?? doc.user?.name ?? 'Member',
    image: doc.user?.image ?? null,
  };
}

export async function GET(request, context) {
  try {
    const circleId = await resolveCircleId(context?.params);
    const { session } = await requireCirclesAccess();
    const userId = new ObjectId(session.user.id);

    await requireCircle(circleId);
    const viewerMembership = await requireActiveMembership(circleId, userId);
    const isAdmin = isAdminMembership(viewerMembership);

    const membersCollection = await getCirclesCollection('MEMBERS');

    const members = await membersCollection
      .aggregate([
        { $match: { circleId } },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
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
            as: 'user',
          },
        },
        {
          $set: {
            user: { $first: '$user' },
          },
        },
      ])
      .toArray();

    const activeMembers = members
      .filter((member) => member.status === CIRCLE_MEMBER_STATUS.ACTIVE)
      .map(mapMember);

    const pendingMembers = isAdmin
      ? members
          .filter((member) => member.status === CIRCLE_MEMBER_STATUS.PENDING)
          .map(mapMember)
      : undefined;

    return NextResponse.json({
      members: activeMembers,
      pending: pendingMembers,
    });
  } catch (error) {
    console.error('Failed to list circle members:', error);
    const status = error.status || 500;
    return NextResponse.json(
      {
        error: status === 500 ? 'Unable to load members.' : error.message || 'Request failed.',
        code: error.code || 'CIRCLE_MEMBERS_FAILED',
      },
      { status },
    );
  }
}

