import { createMetadata } from '@/utils/seoUtils';

export const metadata = createMetadata({
  title: 'Step 4 Inventory',
  description: 'Work through your Fourth Step moral inventory with a secure, private tool.',
  path: '/step4',
  noindex: true, // Contains sensitive personal information, don't index
});

export default function Step4Layout({ children }) {
  return children;
}
