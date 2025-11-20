import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireCirclesAccess } from '@/lib/circles/guards';
import { isAdminMembership, resolveCircleFromParams } from '@/lib/circles/membership';
import { CIRCLE_MEMBER_STATUS, CIRCLE_VISIBILITY } from '@/lib/circles/constants';
import { getCirclesCollection } from '@/lib/circles/db';
import { serializeCircle } from '@/lib/circles/transform';

export async function GET(request, context) {
  try {
    const circle = await resolveCircleFromParams(context?.params);
    const circleObjectId = circle._id;

    const { session } = await requireCirclesAccess();
    const userId = session?.user?.id ? new ObjectId(session.user.id) : null;

    const membersCollection = await getCirclesCollection('MEMBERS');
    const membership = userId
      ? await membersCollection.findOne({
          circleId: circleObjectId,
          userId,
        })
      : null;

    if (!membership || membership.status !== CIRCLE_MEMBER_STATUS.ACTIVE) {
      if (circle.visibility !== CIRCLE_VISIBILITY.PUBLIC) {
        const error = new Error('You do not have access to this circle.');
        error.status = 403;
        error.code = 'CIRCLE_ACCESS_DENIED';
        throw error;
      }
    }

    let memberCount = circle.memberCount ?? 0;
    if (!memberCount) {
      memberCount = await membersCollection.countDocuments({
        circleId: circleObjectId,
        status: CIRCLE_MEMBER_STATUS.ACTIVE,
      });
    }

    let pendingRequests;
    if (isAdminMembership(membership)) {
      pendingRequests = await membersCollection.countDocuments({
        circleId: circleObjectId,
        status: CIRCLE_MEMBER_STATUS.PENDING,
      });
    }

    const result = serializeCircle(
      { ...circle, memberCount },
      membership && membership.status === CIRCLE_MEMBER_STATUS.ACTIVE
        ? {
            role: membership.role,
            status: membership.status,
            joinedAt: membership.joinedAt,
          }
        : undefined,
    );

    if (pendingRequests !== undefined) {
      result.pendingRequests = pendingRequests;
    }

    if (membership && membership.status === CIRCLE_MEMBER_STATUS.PENDING) {
      result.membership = {
        role: membership.role,
        status: membership.status,
        requestedAt: membership.requestedAt,
      };
    }

    return NextResponse.json({ circle: result });
  } catch (error) {
    console.error('Failed to fetch circle:', error);
    const status = error.status || 500;
    const message =
      status === 500 ? 'Unable to load circle.' : error.message || 'Request failed.';

    return NextResponse.json(
      {
        error: message,
        code: error.code || 'CIRCLE_FETCH_FAILED',
      },
      { status },
    );
  }
}

