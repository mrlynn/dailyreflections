import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireCirclesAccess } from '@/lib/circles/guards';
import {
  countActiveMembers,
  ensureCircleCapacity,
  incrementMemberCount,
  membershipResponse,
  requireAdminMembership,
  requireCircle,
} from '@/lib/circles/membership';
import { getCirclesCollection } from '@/lib/circles/db';
import { CIRCLE_MEMBER_STATUS } from '@/lib/circles/constants';

function resolveIds(paramsPromise) {
  const params = typeof paramsPromise?.then === 'function' ? paramsPromise : Promise.resolve(paramsPromise);
  return params.then((paramsObj) => {
    const circleId = paramsObj?.circleId;
    const memberId = paramsObj?.memberId;
    if (!circleId || !ObjectId.isValid(circleId)) {
      const error = new Error('Circle not found.');
      error.status = 404;
      error.code = 'CIRCLE_INVALID_ID';
      throw error;
    }
    if (!memberId || !ObjectId.isValid(memberId)) {
      const error = new Error('Member not found.');
      error.status = 404;
      error.code = 'MEMBER_INVALID_ID';
      throw error;
    }
    return { circleId: new ObjectId(circleId), memberId: new ObjectId(memberId) };
  });
}

export async function POST(request, context) {
  try {
    const { circleId, memberId } = await resolveIds(context?.params);
    const { session } = await requireCirclesAccess();
    const adminUserId = new ObjectId(session.user.id);

    const circle = await requireCircle(circleId);
    await requireAdminMembership(circleId, adminUserId);

    const membersCollection = await getCirclesCollection('MEMBERS');
    const membership = await membersCollection.findOne({
      circleId,
      userId: memberId,
    });

    if (!membership) {
      return NextResponse.json(
        {
          error: 'Membership request not found.',
          code: 'MEMBERSHIP_NOT_FOUND',
        },
        { status: 404 },
      );
    }

    if (membership.status === CIRCLE_MEMBER_STATUS.ACTIVE) {
      return NextResponse.json({
        membership: membershipResponse(membership),
      });
    }

    if (membership.status !== CIRCLE_MEMBER_STATUS.PENDING) {
      return NextResponse.json(
        {
          error: 'Only pending members can be approved.',
          code: 'MEMBERSHIP_NOT_PENDING',
        },
        { status: 409 },
      );
    }

    const activeCount =
      circle.memberCount ??
      (await countActiveMembers(circleId));

    ensureCircleCapacity(circle, { activeCount, additional: 1 });

    const now = new Date();
    const result = await membersCollection.findOneAndUpdate(
      {
        _id: membership._id,
      },
      {
        $set: {
          status: CIRCLE_MEMBER_STATUS.ACTIVE,
          joinedAt: now,
          updatedAt: now,
        },
        $unset: {
          requestedAt: '',
        },
      },
      { returnDocument: 'after' },
    );

    await incrementMemberCount(circleId, 1);

    return NextResponse.json({
      membership: membershipResponse(result.value),
    });
  } catch (error) {
    console.error('Failed to approve circle member:', error);
    const status = error.status || 500;
    return NextResponse.json(
      {
        error: status === 500 ? 'Unable to approve member.' : error.message || 'Approval failed.',
        code: error.code || 'CIRCLE_APPROVE_FAILED',
      },
      { status },
    );
  }
}

