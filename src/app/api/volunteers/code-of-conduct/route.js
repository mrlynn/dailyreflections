/**
 * API route for handling volunteer code of conduct
 */

import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getUserById } from '@/lib/models/User';

/**
 * GET /api/volunteers/code-of-conduct
 * Get code of conduct agreement status for the current user
 */
export async function GET(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user including volunteer data
    const user = await getUserById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return code of conduct status
    return NextResponse.json({
      codeOfConduct: {
        agreed: user.volunteer?.codeOfConductAccepted === true,
        agreedAt: user.volunteer?.codeOfConductAcceptedAt || null,
      }
    });
  } catch (error) {
    console.error('Error getting code of conduct status:', error);
    return NextResponse.json({
      error: error.message || 'Failed to get code of conduct status'
    }, { status: 500 });
  }
}