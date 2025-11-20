import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireCirclesAccess } from '@/lib/circles/guards';
import {
  incrementMemberCount,
  membershipResponse,
  requireAdminMembership,
  requireCircle,
} from '@/lib/circles/membership';
import { getCirclesCollection } from '@/lib/circles/db';
import { CIRCLE_MEMBER_STATUS, CIRCLE_ROLES } from '@/lib/circles/constants';

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

    await requireCircle(circleId);
    const adminMembership = await requireAdminMembership(circleId, adminUserId);

    const membersCollection = await getCirclesCollection('MEMBERS');
    const membership = await membersCollection.findOne({
      circleId,
      userId: memberId,
    });

    if (!membership) {
      return NextResponse.json(
        {
          error: 'Membership not found.',
          code: 'MEMBERSHIP_NOT_FOUND',
        },
        { status: 404 },
      );
    }

    if (membership.role === CIRCLE_ROLES.OWNER) {
      return NextResponse.json(
        {
          error: 'Circle owner cannot be removed. Transfer ownership instead.',
          code: 'OWNER_CANNOT_BE_REMOVED',
        },
        { status: 409 },
      );
    }

    if (
      membership.userId.equals(adminUserId) &&
      membership.role === CIRCLE_ROLES.ADMIN &&
      adminMembership.role !== CIRCLE_ROLES.OWNER
    ) {
      return NextResponse.json(
        {
          error: 'Admins cannot remove themselves. Ask the owner to adjust roles first.',
          code: 'ADMIN_REMOVE_SELF_FORBIDDEN',
        },
        { status: 409 },
      );
    }

    const now = new Date();
    const wasActive = membership.status === CIRCLE_MEMBER_STATUS.ACTIVE;

    const result = await membersCollection.findOneAndUpdate(
      { _id: membership._id },
      {
        $set: {
          status: CIRCLE_MEMBER_STATUS.REMOVED,
          updatedAt: now,
          removedAt: now,
          removedBy: adminUserId,
        },
      },
      { returnDocument: 'after' },
    );

    if (wasActive) {
      await incrementMemberCount(circleId, -1);
    }

    return NextResponse.json({
      membership: membershipResponse(result.value),
    });
  } catch (error) {
    console.error('Failed to remove circle member:', error);
    const status = error.status || 500;
    return NextResponse.json(
      {
        error: status === 500 ? 'Unable to remove member.' : error.message || 'Removal failed.',
        code: error.code || 'CIRCLE_REMOVE_FAILED',
      },
      { status },
    );
  }
}

