'use server';

import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb';

const DEFAULT_LIMIT = 100;

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      Number.parseInt(searchParams.get('limit') ?? DEFAULT_LIMIT, 10),
      500
    );

    const client = await clientPromise;
    const db = client.db('dailyreflections');

    const logs = await db
      .collection('crisis_logs')
      .find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({
      logs: logs.map((log) => ({
        id: log._id?.toString(),
        timestamp: log.timestamp,
        sessionHash: log.sessionHash ?? null,
        detectedIntent: log.detectedIntent,
        responseTemplate: log.responseTemplate,
        escalationFlag: !!log.escalationFlag,
        triggeredBy: log.triggeredBy ?? [],
      })),
    });
  } catch (error) {
    console.error('Error retrieving crisis logs:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve crisis logs' },
      { status: 500 }
    );
  }
}

