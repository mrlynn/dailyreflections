import { createMetadata } from '@/utils/seoUtils';

export const metadata = createMetadata({
  title: 'AI Recovery Assistant',
  description: 'Ask questions about Alcoholics Anonymous literature and recovery principles. Our AI assistant uses AA literature to provide thoughtful, contextually relevant answers.',
  path: '/assistant',
  keywords: [
    'AI recovery assistant',
    'AA chatbot',
    'recovery AI',
    'AA literature assistant',
    'recovery questions',
    'chatbot recovery',
  ],
});

export default function AssistantLayout({ children }) {
  return children;
}
