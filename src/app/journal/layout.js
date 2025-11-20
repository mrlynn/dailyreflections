import { createMetadata } from '@/utils/seoUtils';

export const metadata = createMetadata({
  title: 'Recovery Journal',
  description: 'Keep a personal recovery journal to track your thoughts, progress, and insights.',
  path: '/journal',
  noindex: true, // User-specific content, don't index
});

export default function JournalLayout({ children }) {
  return children;
}
