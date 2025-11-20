import { createMetadata } from '@/utils/seoUtils';

export const metadata = createMetadata({
  title: 'User Profile',
  description: 'Manage your Daily Reflections profile and preferences.',
  path: '/profile',
  noindex: true, // User-specific content, don't index
});

export default function ProfileLayout({ children }) {
  return children;
}
