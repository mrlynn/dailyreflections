/**
 * POST /api/course/feature-click
 *
 * Records when a user clicks a feature intro CTA button.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { recordFeatureOfferClick } from '@/lib/course/courseApi';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be signed in to record feature clicks.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { lessonId, featureKey } = body;

    if (!lessonId || !featureKey) {
      return NextResponse.json(
        { error: 'lessonId and featureKey are required.' },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(lessonId)) {
      return NextResponse.json(
        { error: 'Invalid lessonId format.' },
        { status: 400 }
      );
    }

    if (typeof featureKey !== 'string' || featureKey.trim().length === 0) {
      return NextResponse.json(
        { error: 'featureKey must be a non-empty string.' },
        { status: 400 }
      );
    }

    await recordFeatureOfferClick({
      userId: session.user.id,
      lessonId,
      featureKey: featureKey.trim(),
    });

    return NextResponse.json({
      success: true,
      message: 'Feature click recorded successfully.',
    });
  } catch (error) {
    console.error('Error recording feature click:', error);
    return NextResponse.json(
      { error: 'Failed to record feature click.' },
      { status: 500 }
    );
  }
}
