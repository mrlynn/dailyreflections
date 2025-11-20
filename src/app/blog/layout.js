import { createMetadata } from '@/utils/seoUtils';

export const metadata = createMetadata({
  title: 'Recovery Blog',
  description: 'Read articles, resources, and stories to support your recovery journey. Explore insights on sobriety, the 12 steps, and recovery principles.',
  path: '/blog',
  keywords: [
    'recovery blog',
    'sobriety articles',
    'recovery stories',
    'AA blog',
    'recovery resources',
    'recovery articles',
    'sobriety blog',
  ],
});

export default function BlogLayout({ children }) {
  return children;
}
