/**
 * Role check utilities for authorization
 */

/**
 * Check if user is a volunteer
 * @param {Object} session - User session from NextAuth
 * @returns {boolean} - Whether user is a volunteer
 */
export function isVolunteer(session) {
  if (!session?.user?.roles) return false;
  return session.user.roles.includes('volunteer_listener');
}

/**
 * Check if user is an admin
 * @param {Object} session - User session from NextAuth
 * @returns {boolean} - Whether user is an admin
 */
export function isAdmin(session) {
  if (!session?.user) return false;
  return session.user.isAdmin === true;
}

/**
 * Check if user has a specific role
 * @param {Object} session - User session from NextAuth
 * @param {string} role - Role to check for
 * @returns {boolean} - Whether user has the role
 */
export function hasRole(session, role) {
  if (!session?.user?.roles || !role) return false;
  return session.user.roles.includes(role);
}

/**
 * Check if user has any of the specified roles
 * @param {Object} session - User session from NextAuth
 * @param {string[]} roles - Array of roles to check
 * @returns {boolean} - Whether user has any of the roles
 */
export function hasAnyRole(session, roles) {
  if (!session?.user?.roles || !Array.isArray(roles)) return false;
  return roles.some(role => session.user.roles.includes(role));
}

/**
 * Check if user has all of the specified roles
 * @param {Object} session - User session from NextAuth
 * @param {string[]} roles - Array of roles to check
 * @returns {boolean} - Whether user has all of the roles
 */
export function hasAllRoles(session, roles) {
  if (!session?.user?.roles || !Array.isArray(roles)) return false;
  return roles.every(role => session.user.roles.includes(role));
}

/**
 * Create middleware that requires a specific role
 * @param {string|string[]} requiredRoles - Role(s) required to access the resource
 * @param {function} handler - Next.js API route handler
 * @returns {function} - Handler that checks for required roles
 */
export function withRoleCheck(requiredRoles, handler) {
  return async (req, res) => {
    const { session } = req;

    // No session means unauthorized
    if (!session || !session.user) {
      return { error: 'Unauthorized', status: 401 };
    }

    // Admin override - admins can access all routes
    if (isAdmin(session)) {
      return handler(req, res);
    }

    // Check for roles
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    const hasRequiredRole = roles.some(role => hasRole(session, role));

    if (!hasRequiredRole) {
      return { error: 'Forbidden - Insufficient permissions', status: 403 };
    }

    // User has required role, proceed to handler
    return handler(req, res);
  };
}