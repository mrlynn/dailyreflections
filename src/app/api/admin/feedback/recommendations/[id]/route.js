'use server';

import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb';

export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid recommendation id' }, { status: 400 });
    }

    const body = await request.json();
    const { status, note } = body ?? {};

    if (!['accepted', 'dismissed', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'Status must be accepted, dismissed, or pending' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('dailyreflections');
    const recommendationsCollection = db.collection('feedbackRecommendations');

    const recommendation = await recommendationsCollection.findOne({ _id: new ObjectId(id) });
    if (!recommendation) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
    }

    const updateDoc = {
      $set: {
        status,
        updatedAt: new Date(),
      },
      $push: {
        actionHistory: {
          performedAt: new Date(),
          status,
          note: note?.trim() || null,
          userId: session.user.id ?? null,
          userEmail: session.user.email ?? null,
        },
      },
    };

    await recommendationsCollection.updateOne(
      { _id: recommendation._id },
      updateDoc
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error updating feedback recommendation:', error);
    return NextResponse.json(
      { error: 'Failed to update recommendation' },
      { status: 500 }
    );
  }
}

