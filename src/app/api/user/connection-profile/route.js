import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import {
  createConnectionProfile,
  getUserConnectionProfile,
  updateConnectionProfile,
  updateProfileSlug
} from '@/lib/connection-profiles/db';
import {
  sanitizeSlug,
  isValidSlugFormat,
  isReservedWord
} from '@/lib/connection-profiles/constants';

/**
 * Helper function to safely extract user ID from session
 * @param {Object} session - The Next Auth session object
 * @returns {string|null} The user ID or null if not found
 */
function getUserId(session) {
  if (!session || !session.user) return null;
  return session.user.id || session.user.sub || null;
}

/**
 * GET /api/user/connection-profile
 * Get current user's connection profile
 */
export async function GET(request) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        {
          error: 'You must be signed in to access your connection profile.',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    // Get the user's profile
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid user session' },
        { status: 401 }
      );
    }

    const profile = await getUserConnectionProfile(userId);

    // If no profile exists, return appropriate response
    if (!profile) {
      return NextResponse.json(
        {
          exists: false,
          message: 'No connection profile found. Create one to get started.',
        },
        { status: 200 }
      );
    }

    // Format some fields for response
    const formattedProfile = {
      ...profile,
      userId: profile.userId.toString(),
      _id: profile._id.toString(),
    };

    return NextResponse.json({
      exists: true,
      profile: formattedProfile,
    });
  } catch (error) {
    console.error('Error fetching connection profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connection profile.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/connection-profile
 * Create a new connection profile
 */
export async function POST(request) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        {
          error: 'You must be signed in to create a connection profile.',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    // Get the user ID from session
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid user session' },
        { status: 401 }
      );
    }

    // Check if user already has a profile
    const existingProfile = await getUserConnectionProfile(userId);
    if (existingProfile) {
      return NextResponse.json(
        {
          error: 'You already have a connection profile.',
          code: 'PROFILE_EXISTS',
        },
        { status: 400 }
      );
    }

    // Get request body for optional initial data
    const body = await request.json().catch(() => ({}));

    // Create the profile
    const profile = await createConnectionProfile(userId, body);

    return NextResponse.json({
      message: 'Connection profile created successfully.',
      profile: {
        ...profile,
        userId: profile.userId.toString(),
        _id: profile._id.toString(),
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating connection profile:', error);
    return NextResponse.json(
      { error: 'Failed to create connection profile.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/connection-profile
 * Update connection profile settings
 */
export async function PUT(request) {
  try {
    // Authenticate user
    const session = await auth();
    console.log('Session from auth():', session);

    // Get auth header as backup
    const authHeader = request.headers.get('Authorization');
    console.log('Auth header:', authHeader);

    if (!session || !session.user) {
      console.log('No session found in auth(), checking header');
      // Try to get user ID from Authorization header
      let userId = null;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        userId = authHeader.substring(7);
        console.log('Using userId from Authorization header:', userId);
      }

      if (!userId) {
        return NextResponse.json(
          {
            error: 'You must be signed in to update your connection profile.',
            code: 'UNAUTHORIZED',
          },
          { status: 401 }
        );
      }

      // Continue with userId from header
      return await updateAndRespond(userId, await request.json());
    }

    // Get the user ID from session
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid user session' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body.' },
        { status: 400 }
      );
    }

    // Handle special case for URL slug updates
    if (body.urlSlug !== undefined) {
      const newSlug = body.urlSlug.trim();

      // If empty, generate a random slug
      if (!newSlug) {
        const updatedProfile = await updateConnectionProfile(userId, {
          ...body,
          urlSlug: undefined // Remove from regular update
        });
        return NextResponse.json({
          message: 'Connection profile updated successfully.',
          profile: {
            ...updatedProfile,
            userId: updatedProfile.userId.toString(),
            _id: updatedProfile._id.toString(),
          }
        });
      }

      // Otherwise validate and update slug
      const cleanSlug = sanitizeSlug(newSlug);

      if (!isValidSlugFormat(cleanSlug)) {
        return NextResponse.json(
          { error: 'Invalid URL format. Use 3-30 alphanumeric characters or hyphens.' },
          { status: 400 }
        );
      }

      if (isReservedWord(cleanSlug)) {
        return NextResponse.json(
          { error: 'This URL name is reserved and cannot be used.' },
          { status: 400 }
        );
      }

      try {
        // Update slug separately
        const updatedProfile = await updateProfileSlug(userId, cleanSlug);

        // Remove urlSlug from body to avoid duplicate update
        const { urlSlug, ...restUpdates } = body;

        // If there are other fields to update
        if (Object.keys(restUpdates).length > 0) {
          return await updateAndRespond(userId, restUpdates);
        }

        return NextResponse.json({
          message: 'Connection profile URL updated successfully.',
          profile: {
            ...updatedProfile,
            userId: updatedProfile.userId.toString(),
            _id: updatedProfile._id.toString(),
          }
        });
      } catch (slugError) {
        return NextResponse.json(
          { error: slugError.message || 'Failed to update custom URL.' },
          { status: 400 }
        );
      }
    }

    // Regular update for other fields
    return updateAndRespond(userId, body);
  } catch (error) {
    console.error('Error updating connection profile:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update connection profile.' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to update profile and format response
 */
async function updateAndRespond(userId, updates) {
  try {
    console.log('Updating profile for user:', userId);
    console.log('Updates:', JSON.stringify(updates, null, 2));

    const updatedProfile = await updateConnectionProfile(userId, updates);

    console.log('Profile updated successfully');

    // Format the response to avoid any serialization issues
    const formattedProfile = {
      ...updatedProfile,
      userId: updatedProfile.userId.toString(),
      _id: updatedProfile._id.toString(),
      createdAt: updatedProfile.createdAt ? updatedProfile.createdAt.toISOString() : null,
      updatedAt: updatedProfile.updatedAt ? updatedProfile.updatedAt.toISOString() : null,
    };

    return NextResponse.json({
      message: 'Connection profile updated successfully.',
      profile: formattedProfile
    });
  } catch (error) {
    console.error('Error in updateAndRespond:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update connection profile.' },
      { status: 500 }
    );
  }
}