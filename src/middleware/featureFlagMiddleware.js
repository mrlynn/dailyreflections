import { NextResponse } from 'next/server';
import { isRouteEnabled } from '@/lib/featureFlags';

/**
 * Middleware to check if a route is enabled based on feature flags
 * This middleware runs on the edge, before the request reaches your application
 *
 * @param {Request} request - The incoming request
 */
export function featureFlagMiddleware(request) {
  // Get the pathname from the URL
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Skip API routes and static files
  if (pathname.startsWith('/api/') || pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)) {
    return NextResponse.next();
  }

  // Check if the route is enabled
  if (!isRouteEnabled(pathname)) {
    // If feature is disabled, redirect to the coming soon page
    return NextResponse.rewrite(new URL('/coming-soon?feature=' + encodeURIComponent(pathname), request.url));
  }

  // Continue with the request
  return NextResponse.next();
}

/**
 * Configure which paths this middleware runs on
 * Running on all paths except api routes, static files, and the coming soon page itself
 */
export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /coming-soon (prevent redirect loop)
     * 4. Static files like /favicon.ico, etc.
     */
    '/((?!api|_next|coming-soon|favicon.ico).*)',
  ],
};