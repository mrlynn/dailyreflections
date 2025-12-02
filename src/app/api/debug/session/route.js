import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

/**
 * Debug endpoint to check current session
 * GET /api/debug/session
 */
export async function GET(request) {
  try {
    const session = await getSession(request);

    return NextResponse.json({
      session: session ? {
        user: {
          id: session.user?.id,
          email: session.user?.email,
          name: session.user?.name,
          displayName: session.user?.displayName,
          isAdmin: session.user?.isAdmin,
          roles: session.user?.roles,
        },
        expires: session.expires,
      } : null,
      hasSession: !!session,
      hasUser: !!session?.user,
      hasRoles: !!session?.user?.roles,
      rolesArray: session?.user?.roles || [],
      isAdmin: session?.user?.isAdmin || false,
      hasAdminRole: session?.user?.roles?.includes('admin') || false,
      hasVolunteerRole: session?.user?.roles?.includes('volunteer_listener') || false,
    });
  } catch (error) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
