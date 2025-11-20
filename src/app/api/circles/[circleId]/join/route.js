import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireCirclesAccess } from '@/lib/circles/guards';
import { membershipResponse, requireCircle } from '@/lib/circles/membership';
import { getCirclesCollection } from '@/lib/circles/db';
import { CIRCLE_MEMBER_STATUS, CIRCLE_ROLES, CIRCLE_VISIBILITY } from '@/lib/circles/constants';

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

    const circle = await requireCircle(circleId);
    if (circle.visibility !== CIRCLE_VISIBILITY.PUBLIC) {
      return NextResponse.json(
        {
          error: 'This circle is invite-only.',
          code: 'CIRCLE_PRIVATE',
        },
        { status: 403 },
      );
    }

    const membersCollection = await getCirclesCollection('MEMBERS');
    const currentMembership = await membersCollection.findOne({
      circleId,
      userId,
    });

    if (currentMembership && currentMembership.status === CIRCLE_MEMBER_STATUS.ACTIVE) {
      return NextResponse.json({
        membership: membershipResponse(currentMembership),
        message: 'You are already a member of this circle.',
      });
    }

    const now = new Date();
    const result = await membersCollection.findOneAndUpdate(
      { circleId, userId },
      {
        $set: {
          status: CIRCLE_MEMBER_STATUS.PENDING,
          requestedAt: now,
          updatedAt: now,
        },
        $setOnInsert: {
          circleId,
          userId,
          role: CIRCLE_ROLES.MEMBER,
          createdAt: now,
        },
      },
      { upsert: true, returnDocument: 'after' },
    );

    return NextResponse.json({
      membership: membershipResponse(result.value),
      message: 'Join request submitted. An admin will review it shortly.',
    });
  } catch (error) {
    console.error('Failed to request circle join:', error);
    const status = error.status || 500;
    return NextResponse.json(
      {
        error: status === 500 ? 'Unable to request join.' : error.message || 'Join failed.',
        code: error.code || 'CIRCLE_JOIN_REQUEST_FAILED',
      },
      { status },
    );
  }
}

