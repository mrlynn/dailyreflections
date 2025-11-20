'use server';

import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb';

const LOOKBACK_DAYS = 30;
const RECENT_FLAG_WINDOW_DAYS = 7;

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('dailyreflections');
    const feedbackCollection = db.collection('feedback');
    const statsCollection = db.collection('feedbackDailyStats');
    const flagsCollection = db.collection('feedbackFlags');

    const now = new Date();
    const lookbackStart = new Date(now);
    lookbackStart.setDate(lookbackStart.getDate() - LOOKBACK_DAYS);

    const recentFlagCutoff = new Date(now);
    recentFlagCutoff.setDate(recentFlagCutoff.getDate() - RECENT_FLAG_WINDOW_DAYS);

    const [dailyStats, totalCount, thumbsUpCount, thumbsDownCount, aggregatedTags, flagsSummary] =
      await Promise.all([
        statsCollection
          .find({ date: { $gte: lookbackStart } })
          .sort({ date: 1 })
          .toArray(),
        feedbackCollection.countDocuments(),
        feedbackCollection.countDocuments({ feedbackType: 'thumbs_up' }),
        feedbackCollection.countDocuments({ feedbackType: 'thumbs_down' }),
        statsCollection
          .aggregate([
            { $match: { date: { $gte: lookbackStart } } },
            {
              $project: {
                tags: {
                  $objectToArray: '$tags',
                },
              },
            },
            { $unwind: '$tags' },
            {
              $group: {
                _id: '$tags.k',
                count: { $sum: '$tags.v' },
              },
            },
            { $sort: { count: -1 } },
            { $limit: 12 },
          ])
          .toArray(),
        flagsCollection
          .aggregate([
            {
              $group: {
                _id: '$severity',
                count: { $sum: 1 },
                recent: {
                  $sum: {
                    $cond: [
                      { $gte: ['$lastSubmittedAt', recentFlagCutoff] },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ])
          .toArray(),
      ]);

    const positiveRate = totalCount > 0 ? thumbsUpCount / totalCount : 0;

    let trend = dailyStats.map((stat) => ({
      date: stat.date,
      thumbsUp: stat.totals?.thumbsUp ?? 0,
      thumbsDown: stat.totals?.thumbsDown ?? 0,
      total: stat.totals?.total ?? 0,
      averageToneScore: stat.averageToneScore ?? null,
    }));

    if (trend.length === 0) {
      const fallbackDays = await feedbackCollection
        .aggregate([
          {
            $match: {
              submittedAt: { $gte: lookbackStart },
            },
          },
          {
            $group: {
              _id: {
                $dateTrunc: {
                  date: '$submittedAt',
                  unit: 'day',
                  timezone: 'America/New_York',
                },
              },
              thumbsUp: {
                $sum: {
                  $cond: [{ $eq: ['$feedbackType', 'thumbs_up'] }, 1, 0],
                },
              },
              thumbsDown: {
                $sum: {
                  $cond: [{ $eq: ['$feedbackType', 'thumbs_down'] }, 1, 0],
                },
              },
              total: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray();

      trend = fallbackDays.map((day) => ({
        date: day._id,
        thumbsUp: day.thumbsUp,
        thumbsDown: day.thumbsDown,
        total: day.total,
        averageToneScore: null,
      }));
    }

    const tags = aggregatedTags.map((tag) => ({
      tag: tag._id,
      count: tag.count,
    }));

    const flagBySeverity = flagsSummary.reduce(
      (acc, item) => {
        const severity = item._id ?? 'unknown';
        acc[severity] = {
          total: item.count ?? 0,
          recent: item.recent ?? 0,
        };
        acc.total += item.count ?? 0;
        acc.recent += item.recent ?? 0;
        return acc;
      },
      { total: 0, recent: 0 }
    );

    return NextResponse.json({
      totals: {
        totalCount,
        thumbsUpCount,
        thumbsDownCount,
        positiveRate,
      },
      tags,
      dailyTrend: trend,
      flags: flagBySeverity,
      metadata: {
        lookbackStart,
        generatedAt: now,
      },
    });
  } catch (error) {
    console.error('Error retrieving chatbot feedback stats:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve feedback statistics' },
      { status: 500 }
    );
  }
}

