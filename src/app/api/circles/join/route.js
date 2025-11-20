import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { CIRCLE_MEMBER_STATUS, CIRCLE_ROLES } from '@/lib/circles/constants';
import { requireCirclesAccess } from '@/lib/circles/guards';
import {
  countActiveMembers,
  ensureCircleCapacity,
  incrementMemberCount,
  membershipResponse,
  requireCircle,
} from '@/lib/circles/membership';
import { getCirclesCollection } from '@/lib/circles/db';

export async function POST(request) {
  try {
    const { session } = await requireCirclesAccess();
    const userId = new ObjectId(session.user.id);

    const body = await request.json();
    const token = body?.token?.toString?.().trim();

    if (!token) {
      return NextResponse.json(
        {
          error: 'Invite token is required.',
          code: 'INVITE_TOKEN_REQUIRED',
        },
        { status: 400 },
      );
    }

    const invitesCollection = await getCirclesCollection('INVITES');
    const invite = await invitesCollection.findOne({ token, isRevoked: { $ne: true } });

    if (!invite) {
      return NextResponse.json(
        {
          error: 'Invite token is invalid or has been revoked.',
          code: 'INVITE_INVALID',
        },
        { status: 404 },
      );
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return NextResponse.json(
        {
          error: 'Invite link has expired.',
          code: 'INVITE_EXPIRED',
        },
        { status: 410 },
      );
    }

    const circleId = invite.circleId;
    const circle = await requireCircle(circleId);

    const membersCollection = await getCirclesCollection('MEMBERS');
    const existing = await membersCollection.findOne({
      circleId,
      userId,
    });

    if (existing && existing.status === CIRCLE_MEMBER_STATUS.ACTIVE) {
      return NextResponse.json({
        membership: membershipResponse(existing),
        circle: {
          id: circle._id.toString(),
          name: circle.name,
          visibility: circle.visibility,
        },
      });
    }

    const activeCount =
      circle.memberCount ??
      (await countActiveMembers(circleId));

    ensureCircleCapacity(circle, {
      activeCount,
      additional: existing && existing.status === CIRCLE_MEMBER_STATUS.ACTIVE ? 0 : 1,
    });

    const now = new Date();
    const result = await membersCollection.findOneAndUpdate(
      { circleId, userId },
      {
        $set: {
          role:
            existing?.role && existing.role !== CIRCLE_ROLES.MEMBER
              ? existing.role
              : CIRCLE_ROLES.MEMBER,
          status: CIRCLE_MEMBER_STATUS.ACTIVE,
          joinedAt: existing?.joinedAt ?? now,
          updatedAt: now,
          leftAt: null,
        },
        $setOnInsert: {
          circleId,
          userId,
          createdAt: now,
        },
      },
      { upsert: true, returnDocument: 'after' },
    );

    const becameActive = existing?.status !== CIRCLE_MEMBER_STATUS.ACTIVE;
    if (becameActive) {
      await incrementMemberCount(circleId, 1);
    }

    const inviteUpdate = {
      $set: { updatedAt: now },
      $inc: { usedCount: 1 },
    };

    const previousUses = invite.usedCount ?? 0;
    if (invite.maxUses && previousUses + 1 >= invite.maxUses) {
      inviteUpdate.$set.isRevoked = true;
    }

    await invitesCollection.updateOne({ _id: invite._id }, inviteUpdate);

    return NextResponse.json({
      membership: membershipResponse(result.value),
      circle: {
        id: circle._id.toString(),
        name: circle.name,
        visibility: circle.visibility,
      },
    });
  } catch (error) {
    console.error('Failed to join circle via invite:', error);
    const status = error.status || 500;
    return NextResponse.json(
      {
        error: status === 500 ? 'Unable to join circle.' : error.message || 'Join failed.',
        code: error.code || 'CIRCLE_JOIN_FAILED',
      },
      { status },
    );
  }
}

