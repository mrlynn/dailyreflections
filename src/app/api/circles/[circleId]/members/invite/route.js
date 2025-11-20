import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';
import { requireCirclesAccess } from '@/lib/circles/guards';
import { requireAdminMembership, requireCircle } from '@/lib/circles/membership';
import { getCirclesCollection } from '@/lib/circles/db';
import { normalizeInvitePayload } from '@/lib/circles/validation';

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

function generateInviteToken() {
  return crypto.randomBytes(24).toString('base64url');
}

export async function POST(request, context) {
  try {
    const circleId = await resolveCircleId(context?.params);
    const { session } = await requireCirclesAccess();
    const userId = new ObjectId(session.user.id);

    const circle = await requireCircle(circleId);
    await requireAdminMembership(circleId, userId);

    const payload = await request.json();
    const { isValid, errors, value } = normalizeInvitePayload(payload);

    if (!isValid) {
      return NextResponse.json(
        {
          error: 'Invalid invite configuration.',
          details: errors,
        },
        { status: 400 },
      );
    }

    const invitesCollection = await getCirclesCollection('INVITES');

    const token = generateInviteToken();
    const now = new Date();
    const inviteDoc = {
      circleId,
      token,
      mode: value.mode,
      maxUses: value.maxUses,
      usedCount: 0,
      expiresAt: value.expiresAt,
      isRevoked: false,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    };

    await invitesCollection.insertOne(inviteDoc);

    return NextResponse.json(
      {
        invite: {
          token,
          mode: value.mode,
          maxUses: value.maxUses,
          expiresAt: value.expiresAt,
          joinUrl: `/circles/join?token=${token}`,
        },
        circle: {
          id: circle._id.toString(),
          name: circle.name,
          visibility: circle.visibility,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Failed to create circle invite:', error);
    const status = error.status || 500;
    return NextResponse.json(
      {
        error:
          status === 500 ? 'Unable to create invite.' : error.message || 'Invite creation failed.',
        code: error.code || 'CIRCLE_INVITE_FAILED',
      },
      { status },
    );
  }
}

