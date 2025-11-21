/**
 * Admin Authentication Utilities
 *
 * Provides helper functions for checking admin access
 */

import { Session } from 'next-auth';

export type UserRole = 'user' | 'moderator' | 'admin' | 'superadmin';

export interface AdminSession extends Session {
  user: Session['user'] & {
    role?: UserRole;
  };
}

/**
 * Check if user is an admin
 */
export function isAdmin(session: Session | null): session is AdminSession {
  if (!session?.user) return false;
  const adminSession = session as AdminSession;
  return ['admin', 'superadmin'].includes(adminSession.user.role || '');
}

/**
 * Check if user is a moderator or higher
 */
export function isModerator(session: Session | null): boolean {
  if (!session?.user) return false;
  const adminSession = session as AdminSession;
  return ['moderator', 'admin', 'superadmin'].includes(adminSession.user.role || '');
}

/**
 * Get user role from session
 */
export function getUserRole(session: Session | null): UserRole {
  if (!session?.user) return 'user';
  const adminSession = session as AdminSession;
  return adminSession.user.role || 'user';
}

/**
 * Require admin access - throws if not admin
 */
export function requireAdmin(session: Session | null): asserts session is AdminSession {
  if (!isAdmin(session)) {
    throw new Error('Admin access required');
  }
}
