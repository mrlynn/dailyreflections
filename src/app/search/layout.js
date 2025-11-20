import { createMetadata } from '@/utils/seoUtils';

export const metadata = createMetadata({
  title: 'Search Daily Reflections',
  description: 'Search through daily reflections from Alcoholics Anonymous literature. Find reflections by keywords, topics, or concepts. Explore recovery wisdom with semantic search.',
  path: '/search',
  keywords: [
    'search AA literature',
    'search daily reflections',
    'recovery search',
    'find reflection',
    'search recovery content',
    'semantic search recovery',
  ],
});

export default function SearchLayout({ children }) {
  return children;
}
