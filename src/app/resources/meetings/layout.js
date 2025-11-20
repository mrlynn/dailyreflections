import { createMetadata } from '@/utils/seoUtils';

export const metadata = createMetadata({
  title: 'AA Meeting Resources',
  description: 'Resources and information about Alcoholics Anonymous meetings, meeting formats, and how to find meetings.',
  path: '/resources/meetings',
  keywords: [
    'AA meetings',
    'meeting resources',
    'AA meeting guide',
    'how to find meetings',
    'meeting formats',
  ],
});

export default function MeetingsResourcesLayout({ children }) {
  return children;
}
