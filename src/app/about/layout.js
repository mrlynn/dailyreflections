import { createMetadata } from '@/utils/seoUtils';

export const metadata = createMetadata({
  title: 'About Daily Reflections',
  description: 'Learn about the Daily Reflections project - a modern digital companion for the recovery community. Discover our mission, technology, and how we support the recovery journey.',
  path: '/about',
  keywords: [
    'about daily reflections',
    'recovery app',
    'AA literature app',
    'recovery technology',
    'sobriety resources',
    'recovery community platform',
  ],
});

export default function AboutLayout({ children }) {
  return children;
}
