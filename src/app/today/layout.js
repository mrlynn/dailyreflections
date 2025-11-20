import { createMetadata } from '@/utils/seoUtils';

export const metadata = createMetadata({
  title: "Today's Daily Reflection",
  description: "View today's daily reflection from Alcoholics Anonymous literature. Read the reflection, share your thoughts, and connect with the recovery community.",
  path: '/today',
  keywords: [
    'today reflection',
    'daily reflection today',
    'today AA reading',
    'today recovery',
    'daily meditation today',
  ],
});

export default function TodayLayout({ children }) {
  return children;
}
