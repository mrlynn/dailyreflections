import { createMetadata } from '@/utils/seoUtils';

export const metadata = createMetadata({
  title: 'Find AA Meetings',
  description: 'Find Alcoholics Anonymous meetings in your area. Search for in-person or virtual meetings, filter by type, day, and time. Connect with the recovery community.',
  path: '/meetings',
  keywords: [
    'AA meetings',
    'find AA meetings',
    'Alcoholics Anonymous meetings',
    'recovery meetings',
    'AA meeting finder',
    'virtual AA meetings',
    'local AA meetings',
  ],
});

export default function MeetingsLayout({ children }) {
  return children;
}
