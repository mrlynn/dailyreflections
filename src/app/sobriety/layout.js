import { createMetadata } from '@/utils/seoUtils';

export const metadata = createMetadata({
  title: 'Sobriety Tracker',
  description: 'Track your sobriety journey with personalized milestones and insights. Celebrate your recovery progress and stay motivated.',
  path: '/sobriety',
  keywords: [
    'sobriety tracker',
    'recovery tracker',
    'sobriety counter',
    'track sobriety',
    'recovery milestones',
  ],
  noindex: true, // User-specific content, don't index
});

export default function SobrietyLayout({ children }) {
  return children;
}
