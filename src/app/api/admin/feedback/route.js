'use server';

import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb';

const DEFAULT_LIMIT = 25;

function buildQuery(searchParams) {
  const query = {};

  const feedbackType = searchParams.get('feedbackType');
  if (feedbackType && ['thumbs_up', 'thumbs_down'].includes(feedbackType)) {
    query.feedbackType = feedbackType;
  }

  const tag = searchParams.get('tag');
  if (tag && typeof tag === 'string') {
    query.tags = tag.toLowerCase();
  }

  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  if (startDate || endDate) {
    query.submittedAt = {};
    if (startDate && !Number.isNaN(Date.parse(startDate))) {
      query.submittedAt.$gte = new Date(startDate);
    }
    if (endDate && !Number.isNaN(Date.parse(endDate))) {
      query.submittedAt.$lte = new Date(endDate);
    }
    if (Object.keys(query.submittedAt).length === 0) {
      delete query.submittedAt;
    }
  }

  return query;
}

function serializeFeedbackDocument(doc) {
  return {
    id: doc._id instanceof ObjectId ? doc._id.toString() : doc._id,
    messageId: doc.messageId,
    feedbackType: doc.feedbackType,
    tags: doc.tags ?? [],
    comment: doc.comment ?? null,
    submittedAt: doc.submittedAt ?? doc.createdAt,
    session: doc.session ?? null,
    response: {
      content: doc.response?.content ?? null,
      citations: doc.response?.citations ?? [],
      retrievalContext: doc.response?.retrievalContext ?? [],
      metadata: doc.response?.metadata ?? {},
    },
    userMessage: doc.userMessage ?? null,
    responseMetrics: doc.responseMetrics ?? null,
  };
}

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = buildQuery(searchParams);
    const limit = Math.min(
      Number.parseInt(searchParams.get('limit'), 10) || DEFAULT_LIMIT,
      100
    );

    const client = await clientPromise;
    const db = client.db('dailyreflections');

    const feedbackCursor = db
      .collection('feedback')
      .find(query)
      .sort({ submittedAt: -1 })
      .limit(limit);

    const feedbackDocuments = await feedbackCursor.toArray();

    return NextResponse.json({
      feedback: feedbackDocuments.map(serializeFeedbackDocument),
      total: feedbackDocuments.length,
      filters: {
        feedbackType: query.feedbackType ?? null,
        tag: searchParams.get('tag') ?? null,
      },
    });
  } catch (error) {
    console.error('Error retrieving chatbot feedback:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve feedback records' },
      { status: 500 }
    );
  }
}

