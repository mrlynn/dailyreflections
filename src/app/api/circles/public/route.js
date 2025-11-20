import { NextResponse } from 'next/server';
import { getCirclesDb } from '@/lib/circles/db';
import { CIRCLE_COLLECTIONS, CIRCLE_VISIBILITY, CIRCLE_MEMBER_STATUS } from '@/lib/circles/constants';
import { serializeCircleSummary } from '@/lib/circles/transform';

export async function GET() {
  try {
    const db = await getCirclesDb();

    const circles = await db
      .collection(CIRCLE_COLLECTIONS.CIRCLES)
      .aggregate([
        {
          $match: {
            visibility: CIRCLE_VISIBILITY.PUBLIC,
            isDeleted: { $ne: true },
          },
        },
        {
          $lookup: {
            from: CIRCLE_COLLECTIONS.MEMBERS,
            localField: '_id',
            foreignField: 'circleId',
            pipeline: [
              { $match: { status: CIRCLE_MEMBER_STATUS.ACTIVE } },
              { $count: 'count' },
            ],
            as: 'memberStats',
          },
        },
        {
          $addFields: {
            memberCount: {
              $ifNull: [{ $first: '$memberStats.count' }, 0],
            },
          },
        },
        {
          $project: {
            memberStats: 0,
            allowMultipleInvites: 0,
          },
        },
        {
          $sort: {
            updatedAt: -1,
          },
        },
      ])
      .toArray();

    return NextResponse.json({
      circles: circles.map((circle) => serializeCircleSummary(circle)),
    });
  } catch (error) {
    console.error('Failed to load public circles:', error);
    return NextResponse.json(
      { error: 'Failed to load public circles' },
      { status: 500 },
    );
  }
}

