import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { updateProfileSlug } from '@/lib/connection-profiles/db';
import { sanitizeSlug, isValidSlugFormat, isReservedWord } from '@/lib/connection-profiles/constants';

/**
 * API endpoint to update a user's connection profile URL slug
 *
 * @route PUT /api/user/connection-profile/slug
 * @param {Request} request - The request object
 * @returns {Response} JSON response with updated profile data
 */
export async function PUT(request) {
  try {
    // Authenticate user
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { urlSlug } = body;

    // Validate slug
    if (!urlSlug || typeof urlSlug !== 'string') {
      return NextResponse.json(
        { error: 'URL slug is required' },
        { status: 400 }
      );
    }

    // Sanitize the slug
    const cleanSlug = sanitizeSlug(urlSlug);

    // Validate slug format
    if (!isValidSlugFormat(cleanSlug)) {
      return NextResponse.json(
        { error: 'Invalid URL format. Use 3-30 alphanumeric characters or hyphens.' },
        { status: 400 }
      );
    }

    // Check if it's a reserved word
    if (isReservedWord(cleanSlug)) {
      return NextResponse.json(
        { error: 'This URL is reserved and cannot be used.' },
        { status: 400 }
      );
    }

    // Update the profile slug
    const updatedProfile = await updateProfileSlug(session.user.id, cleanSlug);

    return NextResponse.json(
      {
        message: 'URL updated successfully',
        profile: {
          ...updatedProfile,
          userId: updatedProfile.userId.toString(),
          _id: updatedProfile._id.toString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating profile slug:', error);

    // Handle specific errors
    if (error.message === 'This URL is already taken. Please choose another.') {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }  // Conflict status code
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update profile URL' },
      { status: 500 }
    );
  }
}