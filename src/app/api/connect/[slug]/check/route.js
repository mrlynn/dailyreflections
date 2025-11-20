import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getConnectionProfileBySlug } from '@/lib/connection-profiles/db';

/**
 * Check if a connection profile exists by slug
 *
 * @route GET /api/connect/[slug]/check
 * @param {Request} request - The request object
 * @param {Object} params - Route parameters
 * @returns {Response} JSON response with profile existence status
 */
export async function GET(request, { params }) {
  try {
    const { slug } = params;

    // Authenticate user
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if slug exists
    if (!slug) {
      return NextResponse.json(
        { error: 'Profile slug is required' },
        { status: 400 }
      );
    }

    // Find profile by slug
    const profile = await getConnectionProfileBySlug(slug);

    // Return profile existence status
    return NextResponse.json(
      {
        exists: !!profile,
        isOwner: profile ? profile.userId.toString() === session.user.id : false
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error checking profile existence:', error);
    return NextResponse.json(
      { error: 'Failed to check profile existence' },
      { status: 500 }
    );
  }
}