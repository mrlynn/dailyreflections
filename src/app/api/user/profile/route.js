import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * PUT /api/user/profile
 * Update user profile (displayName)
 */
export async function PUT(request) {
  try {
    const session = await auth();
    
    // Require authentication
    if (!session?.user) {
      return NextResponse.json(
        { 
          error: 'You must be signed in to update your profile.',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { displayName } = body;

    // Validation
    if (!displayName) {
      return NextResponse.json(
        { error: 'Display name is required.' },
        { status: 400 }
      );
    }

    if (typeof displayName !== 'string' || displayName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Display name must be a non-empty string.' },
        { status: 400 }
      );
    }

    // Trim and validate length
    const trimmedDisplayName = displayName.trim();
    if (trimmedDisplayName.length > 50) {
      return NextResponse.json(
        { error: 'Display name cannot exceed 50 characters.' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('dailyreflections');

    // Update user's displayName
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(session.user.id) },
      { $set: { displayName: trimmedDisplayName } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'User not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Profile updated successfully.',
      displayName: trimmedDisplayName,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile.' },
      { status: 500 }
    );
  }
}

