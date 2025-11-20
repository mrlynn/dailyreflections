import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { headers } from 'next/headers';
import {
  getConnectionProfileBySlug,
  recordProfileView
} from '@/lib/connection-profiles/db';
import { VISIBILITY } from '@/lib/connection-profiles/constants';

/**
 * GET /api/connect/[slug]
 * Get a connection profile by its URL slug
 */
export async function GET(request, { params }) {
  try {
    // Ensure params is properly awaited as it's a Promise in Next.js App Router
    const resolvedParams = await params;
    const { slug } = resolvedParams;

    if (!slug) {
      return NextResponse.json(
        { error: 'Profile identifier is required.' },
        { status: 400 }
      );
    }

    // Get the viewer's session
    const session = await getSession();
    const isAuthenticated = Boolean(session?.user);
    const viewerId = session?.user?.id || session?.user?.sub;

    // Fetch the profile by slug
    const profile = await getConnectionProfileBySlug(slug);

    // Profile not found or disabled
    if (!profile || !profile.isEnabled) {
      return NextResponse.json(
        { error: 'Profile not found or unavailable.' },
        { status: 404 }
      );
    }

    // Record this view
    const headersList = await headers();
    await recordProfileView(profile._id, {
      userId: viewerId,
      ip: headersList.get('x-forwarded-for') || (request.headers ? request.headers.get('x-forwarded-for') : null) || null,
      userAgent: headersList.get('user-agent') || (request.headers ? request.headers.get('user-agent') : null) || null,
    });

    // Check visibility and determine what to show
    const { visibility } = profile;

    // Check if viewer is the profile owner
    const isOwner = viewerId && viewerId === profile.userId.toString();

    // Filter contact fields based on visibility
    const filteredContactFields = profile.contactFields.filter(field => {
      // Owner sees all fields
      if (isOwner) return true;

      // Public fields visible to everyone
      if (field.visibility === VISIBILITY.PUBLIC) return true;

      // Authenticated fields require login
      if (field.visibility === VISIBILITY.AUTHENTICATED && isAuthenticated) return true;

      // Connections fields only visible to approved connections
      if (field.visibility === VISIBILITY.CONNECTIONS) {
        // TODO: Check if viewer is an approved connection
        // This will be implemented in a future update
        return false;
      }

      // Private fields only visible to owner
      return false;
    });

    // Prepare the response profile with appropriate fields
    const responseProfile = {
      _id: profile._id.toString(),
      userId: profile.userId.toString(),
      urlSlug: profile.urlSlug,
      displayName: profile.displayName,
      message: profile.message,
      theme: profile.theme,
      // Only include sobriety date if visible to this viewer
      sobrietyDate: profile.sobrietyDate,
      // Only include home groups if visible to this viewer
      homeGroups: profile.homeGroups,
      // Include filtered contact fields
      contactFields: filteredContactFields,
      // Include basic stats for public display
      viewCount: profile.stats.viewCount,
      isOwner,
      // Include metadata
      visibility: profile.visibility,
    };

    return NextResponse.json({ profile: responseProfile });
  } catch (error) {
    console.error('Error fetching connection profile:', error);
    return NextResponse.json(
      { error: 'Failed to load connection profile.' },
      { status: 500 }
    );
  }
}