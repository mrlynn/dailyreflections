import { notFound, redirect } from 'next/navigation';
import { BIG_BOOK_CHAPTERS } from '@/lib/bigbook/config';
import { createMetadata } from '@/utils/seoUtils';
import { buildChapterOgImage, getBigBookOgDimensions } from '@/utils/ogImageUtils';

export async function generateMetadata({ params }) {
  const chapterSlug = params?.chapterSlug;

  // Find the chapter based on slug
  const chapter = BIG_BOOK_CHAPTERS.find(c => c.slug === chapterSlug);

  if (!chapter) {
    return createMetadata({
      title: 'Chapter Not Found | AA Big Book',
      description: 'This chapter of the Alcoholics Anonymous Big Book could not be found.',
      path: `/big-book/${chapterSlug}`,
      noindex: true, // Don't index invalid chapter pages
    });
  }

  // Generate chapter-specific description
  const chapterDescriptions = {
    'bill-story': 'Bill Wilson\'s personal story of addiction and recovery, describing his journey to sobriety and the spiritual experience that changed his life.',
    'there-is-a-solution': 'A comprehensive look at how the fellowship of AA offers a solution to alcoholism through its approach to recovery.',
    'more-about-alcoholism': 'An exploration of alcoholism as a disease and the mental states that precede relapse.',
    'we-agnostics': 'Addressing spiritual concerns for those who struggle with the concept of a higher power in recovery.',
    'how-it-works': 'The core chapter of the Big Book that outlines the Twelve Steps of Alcoholics Anonymous in detail.',
    'into-action': 'Practical guidance on working the steps, making amends, and living the program.',
    'working-with-others': 'Instructions for carrying the message to other alcoholics and helping newcomers.',
    'to-wives': 'Advice for the spouses and family members of alcoholics.',
    'the-family-afterward': 'How families can heal and adjust to life with a recovering alcoholic.',
    'to-employers': 'Information for employers about alcoholism and how to help alcoholic employees.',
    'a-vision-for-you': 'A vision of hope for the future and how the fellowship of AA continues to grow.',
    'personal-stories-part1': 'Personal stories from the pioneers of Alcoholics Anonymous.',
    'personal-stories-part2': 'Stories from alcoholics who found recovery before losing everything.',
    'personal-stories-part3': 'Stories from alcoholics who hit bottom before finding recovery.',
    'appendices': 'Additional resources including The Twelve Traditions, spiritual experience understanding, and AA resources.',
  };

  const description = chapterDescriptions[chapter.slug] ||
    `Read ${chapter.title}, chapter ${chapter.order} of the Alcoholics Anonymous Big Book, pages ${chapter.startPage}-${chapter.endPage}.`;

  // Generate keywords for this chapter
  const chapterKeywords = {
    'bill-story': ['Bill Wilson', 'co-founder', 'spiritual experience', 'personal story'],
    'how-it-works': ['twelve steps', 'recovery program', 'step work', 'higher power'],
    'appendices': ['twelve traditions', 'spiritual experience', 'AA resources', 'medical opinion'],
  };

  const keywords = [
    'Alcoholics Anonymous',
    'AA Big Book',
    'recovery',
    'sobriety',
    chapter.title,
    ...(chapterKeywords[chapter.slug] || []),
  ];

  // Generate Open Graph image for this chapter
  const ogImage = buildChapterOgImage(chapter.title);
  const ogDimensions = getBigBookOgDimensions();

  return createMetadata({
    title: `${chapter.title} | AA Big Book`,
    description,
    path: `/big-book/${chapter.slug}`,
    keywords,
    ogType: 'article',
    ogImage,
    additionalMetadata: {
      openGraph: {
        section: 'Big Book',
        authors: ['Alcoholics Anonymous World Services, Inc.'],
        images: [
          {
            url: ogImage,
            width: ogDimensions.width,
            height: ogDimensions.height,
            alt: `${chapter.title} - AA Big Book Chapter`,
          }
        ],
        // Add Twitter card metadata
        twitter: {
          card: 'summary_large_image',
          title: `${chapter.title} | AA Big Book`,
          description,
          images: [ogImage],
        }
      },
    }
  });
}

export default function BigBookChapterRedirect({ params }) {
  const chapter = BIG_BOOK_CHAPTERS.find((item) => item.slug === params.chapterSlug);

  if (!chapter) {
    notFound();
  }

  redirect(`/big-book/page/${chapter.startPage}`);
}


