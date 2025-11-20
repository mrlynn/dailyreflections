import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb';
import {
  CIRCLE_COLLECTIONS,
  CIRCLE_DEFAULTS,
  CIRCLE_INVITE_MODES,
  CIRCLE_MEMBER_STATUS,
  CIRCLE_ROLES,
} from '@/lib/circles/constants';

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
  };
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('dailyreflections');

    const circles = await db
      .collection(CIRCLE_COLLECTIONS.CIRCLES)
      .aggregate([
        {
          $match: {
            isDeleted: { $ne: true },
          },
        },
        {
          $lookup: {
            from: CIRCLE_COLLECTIONS.MEMBERS,
            localField: '_id',
            foreignField: 'circleId',
            as: 'members',
          },
        },
        {
          $addFields: {
            memberStats: {
              active: {
                $size: {
                  $filter: {
                    input: '$members',
                    as: 'member',
                    cond: { $eq: ['$$member.status', CIRCLE_MEMBER_STATUS.ACTIVE] },
                  },
                },
              },
              pending: {
                $size: {
                  $filter: {
                    input: '$members',
                    as: 'member',
                    cond: { $eq: ['$$member.status', CIRCLE_MEMBER_STATUS.PENDING] },
                  },
                },
              },
              admins: {
                $size: {
                  $filter: {
                    input: '$members',
                    as: 'member',
                    cond: {
                      $and: [
                        { $eq: ['$$member.status', CIRCLE_MEMBER_STATUS.ACTIVE] },
                        { $in: ['$$member.role', [CIRCLE_ROLES.OWNER, CIRCLE_ROLES.ADMIN]] },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'creator',
            pipeline: [
              {
                $project: {
                  name: 1,
                  displayName: 1,
                  email: 1,
                  profile: 1,
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: CIRCLE_COLLECTIONS.INVITES,
            localField: '_id',
            foreignField: 'circleId',
            as: 'invites',
          },
        },
        {
          $project: {
            name: 1,
            description: 1,
            type: 1,
            visibility: 1,
            maxMembers: 1,
            allowMultipleInvites: 1,
            createdAt: 1,
            updatedAt: 1,
            createdBy: 1,
            memberStats: 1,
            creator: { $first: '$creator' },
            inviteStats: {
              total: { $size: '$invites' },
              active: {
                $size: {
                  $filter: {
                    input: '$invites',
                    as: 'invite',
                    cond: {
                      $and: [
                        { $ne: ['$$invite.isRevoked', true] },
                        {
                          $or: [
                            { $not: ['$$invite.expiresAt'] },
                            { $gt: ['$$invite.expiresAt', new Date()] },
                          ],
                        },
                      ],
                    },
                  },
                },
              },
              singleUse: {
                $size: {
                  $filter: {
                    input: '$invites',
                    as: 'invite',
                    cond: { $eq: ['$$invite.mode', CIRCLE_INVITE_MODES.SINGLE_USE] },
                  },
                },
              },
            },
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ])
      .toArray();

    const formatted = circles.map((circle) => ({
      id: circle._id?.toString(),
      name: circle.name,
      description: circle.description,
      type: circle.type,
      visibility: circle.visibility,
      maxMembers: circle.maxMembers ?? CIRCLE_DEFAULTS.MAX_MEMBERS,
      allowMultipleInvites: circle.allowMultipleInvites ?? true,
      createdAt: circle.createdAt,
      updatedAt: circle.updatedAt,
      createdBy: circle.createdBy?.toString() ?? null,
      creator: formatUser(circle.creator),
      members: {
        active: circle.memberStats?.active ?? 0,
        pending: circle.memberStats?.pending ?? 0,
        admins: circle.memberStats?.admins ?? 0,
      },
      invites: {
        total: circle.inviteStats?.total ?? 0,
        active: circle.inviteStats?.active ?? 0,
        singleUse: circle.inviteStats?.singleUse ?? 0,
      },
    }));

    return NextResponse.json({ circles: formatted });
  } catch (error) {
    console.error('Failed to load admin circles:', error);
    return NextResponse.json(
      { error: 'Failed to load circles' },
      { status: 500 },
    );
  }
}

