import { createMetadata } from '@/utils/seoUtils';

export const metadata = createMetadata({
  title: 'Create Account',
  description: 'Create a free account on Daily Reflections to access daily readings, join the community, and track your recovery journey.',
  path: '/register',
  noindex: true, // Registration page shouldn't be indexed
});

export default function RegisterLayout({ children }) {
  return children;
}
