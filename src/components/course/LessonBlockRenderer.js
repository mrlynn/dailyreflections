'use client';

import HeroBlock from './blocks/HeroBlock';
import TextBlock from './blocks/TextBlock';
import QuoteBlock from './blocks/QuoteBlock';
import CheckinBlock from './blocks/CheckinBlock';
import JournalPromptBlock from './blocks/JournalPromptBlock';
import VideoBlock from './blocks/VideoBlock';
import FeatureIntroBlock from './blocks/FeatureIntroBlock';
import DividerBlock from './blocks/DividerBlock';

/**
 * LessonBlockRenderer - Renders different block types dynamically
 *
 * @param {Object} block - The block object with type and props
 * @param {string} lessonId - The lesson ID (for interactive blocks)
 */
export default function LessonBlockRenderer({ block, lessonId }) {
  const { type, props } = block;

  switch (type) {
    case 'hero':
      return <HeroBlock {...props} />;

    case 'text':
      return <TextBlock {...props} />;

    case 'quote':
      return <QuoteBlock {...props} />;

    case 'checkin':
      return <CheckinBlock {...props} lessonId={lessonId} />;

    case 'journal-prompt':
      return <JournalPromptBlock {...props} />;

    case 'video':
      return <VideoBlock {...props} />;

    case 'cta-feature-intro':
      return <FeatureIntroBlock {...props} lessonId={lessonId} />;

    case 'divider':
      return <DividerBlock {...props} />;

    default:
      console.warn(`Unknown block type: ${type}`);
      return null;
  }
}
