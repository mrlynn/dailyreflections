import { createMetadata } from '@/utils/seoUtils';

export const metadata = createMetadata({
  title: 'Login',
  description: 'Sign in to Daily Reflections to access your personalized recovery resources and community features.',
  path: '/login',
  noindex: true, // Login page shouldn't be indexed
});

export default function LoginLayout({ children }) {
  return children;
}
