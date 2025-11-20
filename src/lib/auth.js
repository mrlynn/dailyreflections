/**
 * NextAuth v5 helper for getting session in API routes
 * Since NextAuth v5 beta changed the API, we'll use cookies to manually get session
 */
import { cookies } from 'next/headers';
import { decode } from 'next-auth/jwt';
import { auth as nextAuth } from '@/app/api/auth/[...nextauth]/route';

/**
 * Get the current session in API routes
 * This is the NextAuth v5 equivalent of getServerSession
 * @param {Request} [request] - Optional request object from API route (for cookie extraction)
 * @returns {Promise<Session|null>} The current session or null
 */
export async function getSession(request = null) {
  try {
    // Prefer NextAuth helper when available (handles cookies/headers automatically)
    try {
      const authSession = await nextAuth();
      if (authSession) {
        console.log('Auth session found via nextAuth():',
          authSession.user?.email ?
          `User: ${authSession.user.email}` :
          'No user email');
        return authSession;
      } else {
        console.warn('nextAuth() returned falsy session');
      }
    } catch (authError) {
      console.warn('nextAuth() session retrieval failed, falling back to manual decoding:',
        authError.message || String(authError));
    }

    // Print whether we have a valid request object
    if (request) {
      console.log('Request object provided to getSession');
    } else {
      console.log('No request object provided to getSession');
    }

    const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
    if (!NEXTAUTH_SECRET) {
      console.warn('NEXTAUTH_SECRET not set, cannot decode session');
      return null;
    }

    let sessionToken = null;
    let cookieSource = 'unknown';

    if (request) {
      // Extract session token from request cookies
      const cookieHeader = request.headers.get('cookie') || '';
      console.log('Cookie header length:', cookieHeader.length);

      if (cookieHeader.length > 0) {
        cookieSource = 'request-header';
        const cookieMap = {};

        cookieHeader.split(';').forEach(cookie => {
          const parts = cookie.trim().split('=');
          if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim();
            cookieMap[key] = value;
          }
        });

        // Check for both production and development cookie names
        sessionToken = cookieMap['next-auth.session-token'] ||
                       cookieMap['__Secure-next-auth.session-token'] ||
                       cookieMap[' next-auth.session-token'] || // Note the leading space that sometimes occurs
                       cookieMap[' __Secure-next-auth.session-token'];

        // Debug cookie presence
        const authCookiesFound = Object.keys(cookieMap).filter(key =>
          key.includes('next-auth') || key.includes('__Secure')
        );

        console.log('Auth-related cookies found:', authCookiesFound.length > 0 ? authCookiesFound : 'None');
      } else {
        console.log('No cookies found in request header');
      }
    } else {
      try {
        // Use Next.js cookies() helper - await since it returns a Promise in Next.js App Router
        const cookieStore = await cookies();
        cookieSource = 'next-cookies';

        // Handle getAll as a possible Promise
        const allCookies = await cookieStore.getAll();
        console.log('All cookies from cookie store:', allCookies.length);

        // Debug cookie presence
        const authCookies = allCookies.filter(cookie =>
          cookie.name.includes('next-auth') || cookie.name.includes('__Secure')
        );

        console.log('Auth cookies found:', authCookies.length > 0 ?
          authCookies.map(c => c.name) : 'None');

        // Handle get as a possible Promise
        const sessionCookie = await cookieStore.get('next-auth.session-token');
        const secureCookie = await cookieStore.get('__Secure-next-auth.session-token');
        sessionToken = sessionCookie?.value || secureCookie?.value;
      } catch (cookieError) {
        console.error('Error accessing cookies:', cookieError);
      }
    }

    if (!sessionToken) {
      console.log(`No session token found from source: ${cookieSource}`);
      return null;
    }

    console.log(`Session token found from source: ${cookieSource} (length: ${sessionToken.length})`);

    // Decode the JWT token
    const decoded = await decode({
      token: sessionToken,
      secret: NEXTAUTH_SECRET,
    });

    if (!decoded) {
      console.log('Failed to decode session token');
      return null;
    }

    // Check token expiration
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      console.log('Session token has expired');
      return null;
    }

    console.log('Successfully decoded session for user:', decoded.email || decoded.sub);

    // Convert decoded token to session format
    return {
      user: {
        id: decoded.sub || decoded.id,
        email: decoded.email,
        name: decoded.name,
        displayName: decoded.displayName || decoded.name,
        image: decoded.picture || decoded.image,
        isAdmin: decoded.isAdmin === true || false,
        roles: decoded.roles || [], // Include roles array
      },
      expires: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : null,
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Check if the current user has a specific role
 * @param {Object} session - User session
 * @param {string} role - Role to check
 * @returns {boolean} - Whether the user has the role
 */
export function hasRole(session, role) {
  if (!session?.user?.roles) return false;
  return session.user.roles.includes(role);
}

/**
 * Check if the current user is an admin
 * @param {Object} session - User session
 * @returns {boolean} - Whether the user is an admin
 */
export function isAdmin(session) {
  return session?.user?.isAdmin === true;
}

/**
 * Check if the user is a volunteer listener
 * @param {Object} session - User session
 * @returns {boolean} - Whether the user is a volunteer
 */
export function isVolunteer(session) {
  return hasRole(session, 'volunteer_listener');
}

/**
 * Check if the user has any of the specified roles
 * @param {Object} session - User session
 * @param {string[]} roles - Array of roles to check
 * @returns {boolean} - Whether the user has any of the roles
 */
export function hasAnyRole(session, roles) {
  if (!session?.user?.roles || !Array.isArray(roles)) return false;
  return roles.some(role => session.user.roles.includes(role));
}

/**
 * Check if the user has all of the specified roles
 * @param {Object} session - User session
 * @param {string[]} roles - Array of roles to check
 * @returns {boolean} - Whether the user has all of the roles
 */
export function hasAllRoles(session, roles) {
  if (!session?.user?.roles || !Array.isArray(roles)) return false;
  return roles.every(role => session.user.roles.includes(role));
}

