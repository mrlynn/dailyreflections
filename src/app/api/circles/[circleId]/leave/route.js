import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireCirclesAccess } from '@/lib/circles/guards';
import {
  incrementMemberCount,
  membershipResponse,
  requireActiveMembership,
  requireCircle,
} from '@/lib/circles/membership';
import { getCirclesCollection } from '@/lib/circles/db';
import { CIRCLE_MEMBER_STATUS, CIRCLE_ROLES } from '@/lib/circles/constants';

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

export async function POST(request, context) {
  try {
    const circleId = await resolveCircleId(context?.params);
    const { session } = await requireCirclesAccess();
    const userId = new ObjectId(session.user.id);

    await requireCircle(circleId);
    const membership = await requireActiveMembership(circleId, userId);

    if (membership.role === CIRCLE_ROLES.OWNER) {
      return NextResponse.json(
        {
          error: 'Circle owner cannot leave. Transfer ownership or archive the circle instead.',
          code: 'OWNER_CANNOT_LEAVE',
        },
        { status: 409 },
      );
    }

    const membersCollection = await getCirclesCollection('MEMBERS');
    const now = new Date();

    const result = await membersCollection.findOneAndUpdate(
      { _id: membership._id },
      {
        $set: {
          status: CIRCLE_MEMBER_STATUS.LEFT,
          leftAt: now,
          updatedAt: now,
        },
      },
      { returnDocument: 'after' },
    );

    await incrementMemberCount(circleId, -1);

    return NextResponse.json({
      membership: membershipResponse(result.value),
    });
  } catch (error) {
    console.error('Failed to leave circle:', error);
    const status = error.status || 500;
    return NextResponse.json(
      {
        error: status === 500 ? 'Unable to leave circle.' : error.message || 'Leave failed.',
        code: error.code || 'CIRCLE_LEAVE_FAILED',
      },
      { status },
    );
  }
}

