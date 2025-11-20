import { createMetadata } from '@/utils/seoUtils';

export const metadata = createMetadata({
  title: 'AA Literature Resources',
  description: 'Access Alcoholics Anonymous literature including the Big Book, 12 Steps and 12 Traditions, and other recovery texts.',
  path: '/resources/literature',
  keywords: [
    'AA literature',
    'Big Book',
    '12 steps and 12 traditions',
    'AA books',
    'recovery literature',
    'AA reading',
  ],
});

export default function LiteratureLayout({ children }) {
  return children;
}
