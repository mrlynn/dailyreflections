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
    const typeFilter = searchParams.get('type');
    const statusFilter = searchParams.get('status');
    const limit = Math.min(
      Number.parseInt(searchParams.get('limit') ?? DEFAULT_LIMIT, 10),
      200
    );

    const client = await clientPromise;
    const db = client.db('dailyreflections');
    const recommendationsCollection = db.collection('feedbackRecommendations');

    const query = {};
    if (typeFilter && typeFilter !== 'all') {
      query.type = typeFilter;
    }
    if (statusFilter && statusFilter !== 'all') {
      query.status = statusFilter;
    }

    const recommendations = await recommendationsCollection
      .find(query)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({
      recommendations: recommendations.map((rec) => ({
        id: rec._id?.toString(),
        key: rec.key,
        type: rec.type,
        target: rec.target,
        summary: rec.summary,
        signals: rec.signals ?? [],
        metrics: rec.metrics ?? {},
        evidence: rec.evidence ?? {},
        status: rec.status ?? 'pending',
        createdAt: rec.createdAt ?? null,
        updatedAt: rec.updatedAt ?? null,
        actionHistory: rec.actionHistory ?? [],
      })),
    });
  } catch (error) {
    console.error('Error retrieving feedback recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve feedback recommendations' },
      { status: 500 }
    );
  }
}

