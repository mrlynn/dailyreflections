/**
 * API routes for managing volunteer availability status
 */

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

/**
 * GET /api/volunteers/status
 * Get current volunteer's availability status
 */
export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has volunteer role
    const hasVolunteerRole = session.user.roles?.includes('volunteer_listener');
    if (!hasVolunteerRole) {
      return NextResponse.json({ error: 'Forbidden - Only volunteers can access this endpoint' }, { status: 403 });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('dailyreflections');

    // Get volunteer status
    const user = await db.collection('users').findOne(
      { _id: typeof session.user.id === 'string' ? new ObjectId(session.user.id) : session.user.id },
      { projection: { 'volunteer.isActive': 1 } }
    );

    const isActive = user?.volunteer?.isActive || false;

    return NextResponse.json({ isActive });
  } catch (error) {
    console.error('Error fetching volunteer status:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch volunteer status' }, { status: 500 });
  }
}

/**
 * PUT /api/volunteers/status
 * Update volunteer's availability status
 */
export async function PUT(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has volunteer role
    const hasVolunteerRole = session.user.roles?.includes('volunteer_listener');
    if (!hasVolunteerRole) {
      return NextResponse.json({ error: 'Forbidden - Only volunteers can access this endpoint' }, { status: 403 });
    }

    // Get request body
    const body = await request.json();

    if (body.isActive === undefined) {
      return NextResponse.json({ error: 'isActive status is required' }, { status: 400 });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('dailyreflections');

    // Update volunteer status
    const result = await db.collection('users').updateOne(
      { _id: typeof session.user.id === 'string' ? new ObjectId(session.user.id) : session.user.id },
      {
        $set: {
          'volunteer.isActive': body.isActive,
          'volunteer.lastStatusChange': new Date(),
          'volunteer.lastActive': new Date()
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      isActive: body.isActive,
      message: body.isActive ? 'You are now online' : 'You are now offline'
    });
  } catch (error) {
    console.error('Error updating volunteer status:', error);
    return NextResponse.json({ error: error.message || 'Failed to update volunteer status' }, { status: 500 });
  }
}