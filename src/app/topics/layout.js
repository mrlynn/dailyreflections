import { createMetadata } from '@/utils/seoUtils';

export const metadata = createMetadata({
  title: 'AA Meeting Topics Generator',
  description: 'Generate thoughtful AA meeting topic ideas based on Alcoholics Anonymous literature. Use AI to discover relevant discussion topics for recovery meetings.',
  path: '/topics',
  keywords: [
    'AA meeting topics',
    'meeting topic ideas',
    'recovery meeting topics',
    'AA discussion topics',
    'meeting topic generator',
    'recovery discussion ideas',
  ],
});

export default function TopicsLayout({ children }) {
  return children;
}
