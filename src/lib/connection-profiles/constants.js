/**
 * Connection profile visibility levels
 * This file is safe to import in client components
 */
export const VISIBILITY = {
  PUBLIC: 'public',           // Visible to anyone with the link
  AUTHENTICATED: 'authenticated', // Visible to logged-in users
  CONNECTIONS: 'connections', // Visible to approved connections
  PRIVATE: 'private',         // Not visible to anyone
};

/**
 * Sanitize a custom slug
 *
 * @param {string} slug - Raw slug input
 * @returns {string} Sanitized slug
 */
export function sanitizeSlug(slug) {
  if (typeof slug !== 'string') return '';

  // Convert to lowercase, replace spaces with hyphens, remove special chars
  return slug.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-') // Replace multiple hyphens with single one
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Check if slug format is valid
 *
 * @param {string} slug - Slug to validate
 * @returns {boolean} Whether the slug is valid
 */
export function isValidSlugFormat(slug) {
  if (!slug || typeof slug !== 'string') return false;

  // At least 3 chars, max 30, only letters, numbers, hyphens
  const slugRegex = /^[a-z0-9-]{3,30}$/;
  return slugRegex.test(slug);
}

/**
 * Check if a string is a reserved word that can't be used as a slug
 *
 * @param {string} slug - Slug to check
 * @returns {boolean} Whether the slug is reserved
 */
export function isReservedWord(slug) {
  // List of reserved words that can't be used as slugs
  const reserved = [
    'admin', 'api', 'app', 'auth', 'connect', 'create', 'dashboard',
    'help', 'login', 'logout', 'profile', 'register', 'settings',
    'system', 'user', 'users', 'support', 'account'
  ];

  return reserved.includes(slug);
}