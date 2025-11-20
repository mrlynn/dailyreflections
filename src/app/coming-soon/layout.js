import { createMetadata } from '@/utils/seoUtils';

export const metadata = createMetadata({
  title: 'Coming Soon',
  description: 'This feature is coming soon to Daily Reflections.',
  path: '/coming-soon',
  noindex: true, // Coming soon pages shouldn't be indexed
});

export default function ComingSoonLayout({ children }) {
  return children;
}
