import { createMetadata } from '@/utils/seoUtils';

/**
 * Generate metadata for admin pages
 * All admin pages should be marked as noindex
 */
export function createAdminMetadata({ title, description, path = '' }) {
  return createMetadata({
    title: `Admin - ${title}`,
    description: description || 'Admin page for Daily Reflections',
    path: `/admin${path}`,
    noindex: true, // Admin pages should never be indexed
  });
}
