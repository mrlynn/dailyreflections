'use server';

import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb';

const DEFAULT_LIMIT = 50;

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const severityFilter = searchParams.get('severity');
    const limit = Math.min(
      Number.parseInt(searchParams.get('limit') ?? DEFAULT_LIMIT, 10),
      200
    );

    const client = await clientPromise;
    const db = client.db('dailyreflections');
    const flagsCollection = db.collection('feedbackFlags');

    const query = {};
    if (severityFilter && severityFilter !== 'all') {
      query.severity = severityFilter;
    }

    const flags = await flagsCollection
      .find(query)
      .sort({ severity: -1, lastSubmittedAt: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({
      flags: flags.map((flag) => ({
        id: flag._id?.toString(),
        responseMessageId: flag.responseMessageId,
        severity: flag.severity ?? 'none',
        totalFeedback: flag.totalFeedback ?? 0,
        negativeFeedback: flag.negativeFeedback ?? 0,
        recentFlagCount: flag.recentFlagCount ?? 0,
        lastSubmittedAt: flag.lastSubmittedAt ?? flag.updatedAt,
        lastFeedbackType: flag.lastFeedbackType ?? null,
        lastSignals: flag.lastSignals ?? [],
        activeSignals: flag.activeSignals ?? [],
        lastToneScore: flag.lastToneScore ?? null,
        lastSentiment: flag.lastSentiment ?? null,
        responsePreview: flag.responsePreview ?? null,
        lastComment: flag.lastComment ?? null,
        history: flag.history ?? [],
      })),
    });
  } catch (error) {
    console.error('Error retrieving flagged chatbot feedback:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve flagged responses' },
      { status: 500 }
    );
  }
}

