import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getConnectionCollections } from '@/lib/connection-profiles/db';
import { sanitizeSlug, isValidSlugFormat, isReservedWord } from '@/lib/connection-profiles/constants';

/**
 * Check if a URL slug is available for use
 *
 * @route GET /api/connect/check-slug
 * @param {Request} request - The request object
 * @returns {Response} JSON response with availability status
 */
export async function GET(request) {
  try {
    // Get slug from query string
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    // Authenticate user
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Basic validation
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        { error: 'Slug is required', isAvailable: false },
        { status: 400 }
      );
    }

    // Sanitize the slug
    const cleanSlug = sanitizeSlug(slug);

    // Validate format
    if (!isValidSlugFormat(cleanSlug)) {
      return NextResponse.json(
        { error: 'Invalid slug format', isAvailable: false },
        { status: 400 }
      );
    }

    // Check if it's a reserved word
    if (isReservedWord(cleanSlug)) {
      return NextResponse.json(
        { error: 'Reserved slug', isAvailable: false },
        { status: 400 }
      );
    }

    // Check if slug is already in use
    const { profiles } = await getConnectionCollections();
    const existingProfile = await profiles.findOne({ urlSlug: cleanSlug });

    // The slug is available if it doesn't exist or if it belongs to the current user
    const isAvailable = !existingProfile ||
      (existingProfile.userId.toString() === session.user.id);

    return NextResponse.json(
      { isAvailable, slug: cleanSlug },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error checking slug availability:', error);
    return NextResponse.json(
      { error: 'Failed to check slug availability', isAvailable: false },
      { status: 500 }
    );
  }
}