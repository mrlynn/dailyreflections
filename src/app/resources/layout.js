import { createMetadata } from '@/utils/seoUtils';

export const metadata = createMetadata({
  title: 'Recovery Resources',
  description: 'Explore recovery resources including AA literature, meeting guides, and helpful tools for your recovery journey.',
  path: '/resources',
  keywords: [
    'recovery resources',
    'AA resources',
    'recovery tools',
    'sobriety resources',
    'AA literature resources',
    'recovery materials',
  ],
});

export default function ResourcesLayout({ children }) {
  return children;
}
