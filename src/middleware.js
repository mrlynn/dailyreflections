import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { isRouteEnabled } from '@/lib/featureFlags';

/**
 * Middleware function that runs before matching routes
 * - Checks feature flags and redirects to coming soon page if disabled
 * - Protects admin routes by checking user permissions
 * - Protects volunteer routes by checking for volunteer_listener role
 */
export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip API routes and static files
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/coming-soon') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|json)$/)
  ) {
    return NextResponse.next();
  }

  // Get the user's token for role checks
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  // Check admin route protection
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin-test')) {
    // If the user isn't logged in or doesn't have admin privileges, redirect to home
    if (!token || !token.isAdmin) {
      const url = new URL('/', request.url);
      return NextResponse.redirect(url);
    }
  }

  // Check volunteer route protection
  if (pathname.startsWith('/volunteers') && pathname !== '/volunteers/apply') {
    // If the user isn't logged in, redirect to login
    if (!token) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', request.url);
      return NextResponse.redirect(url);
    }

    // Check if the user has volunteer role or is an admin
    const isVolunteer = token.roles?.includes('volunteer_listener');
    const isAdmin = token.isAdmin === true;

    // If not a volunteer or admin, redirect to unauthorized page
    if (!isVolunteer && !isAdmin) {
      const url = new URL('/unauthorized', request.url);
      return NextResponse.redirect(url);
    }
  }

  // API routes protection
  if (pathname.startsWith('/api/volunteers') && !pathname.startsWith('/api/volunteers/applications')) {
    // If the user isn't logged in, return 401 Unauthorized
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the user has volunteer role or is an admin
    const isVolunteer = token.roles?.includes('volunteer_listener');
    const isAdmin = token.isAdmin === true;

    // If not a volunteer or admin, return 403 Forbidden
    if (!isVolunteer && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }
  }

  if (pathname.startsWith('/api/admin')) {
    // If the user isn't logged in, return 401 Unauthorized
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If not an admin, return 403 Forbidden
    if (!token.isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
  }

  // Check feature flags for all routes
  if (!isRouteEnabled(pathname)) {
    // If feature is disabled, redirect to the coming soon page
    const comingSoonUrl = new URL('/coming-soon', request.url);
    comingSoonUrl.searchParams.set('feature', pathname);
    return NextResponse.rewrite(comingSoonUrl);
  }

  return NextResponse.next();
}

// Match all routes
export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /_next (Next.js internals)
     * 2. /coming-soon (prevent redirect loop)
     * 3. Static files like /favicon.ico, etc.
     *
     * We no longer exclude /api routes since we need to protect API endpoints
     * for volunteer and admin functionality.
     */
    '/((?!_next|coming-soon|favicon.ico|.*\\.\\w+$).*)',
    '/api/volunteers/:path*', // Explicitly include volunteer API routes
    '/api/admin/:path*',      // Explicitly include admin API routes
  ],
};