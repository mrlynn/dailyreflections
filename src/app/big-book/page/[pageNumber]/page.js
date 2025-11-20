import { getBigBookCollections, getChapterForPageNumber } from '@/lib/bigbook/service';
import { createMetadata } from '@/utils/seoUtils';
import { buildBigBookOgImage, getBigBookOgDimensions } from '@/utils/ogImageUtils';
import BigBookPageReader from './BigBookPageReader';

// This is a server component that will generate metadata
export async function generateMetadata({ params, searchParams }) {
  const pageNumber = Number.parseInt(params?.pageNumber || '1', 10);

  try {
    // Fetch page data for metadata
    const { pages } = await getBigBookCollections();

    const pageData = await pages.findOne({ pageNumber });
    if (!pageData) {
      return createMetadata({
        title: `Page ${pageNumber} | AA Big Book`,
        description: 'Read the Alcoholics Anonymous Big Book, the basic text for AA members.',
        path: `/big-book/page/${pageNumber}`,
      });
    }

    // Get chapter information
    const chapter = getChapterForPageNumber(pageNumber);
    const chapterInfo = chapter ? `${chapter.title}` : '';

    // Extract a clean snippet of text for the description
    const pageText = pageData.text || pageData.fullText || '';
    const cleanText = pageText.replace(/\n+/g, ' ').trim();
    const description = cleanText.length > 160
      ? cleanText.substring(0, 157) + '...'
      : cleanText;

    // Generate keywords based on chapter and content
    const keywords = [
      'Alcoholics Anonymous',
      'AA Big Book',
      'recovery',
      'sobriety',
      'twelve steps',
      pageNumber,
      chapter?.title,
    ].filter(Boolean);

    // Generate Open Graph image
    const ogImage = buildBigBookOgImage(pageNumber, chapter);
    const ogDimensions = getBigBookOgDimensions();

    return createMetadata({
      title: chapter
        ? `Page ${pageNumber} - ${chapter.title} | AA Big Book`
        : `Page ${pageNumber} | AA Big Book`,
      description,
      path: `/big-book/page/${pageNumber}`,
      keywords,
      ogType: 'article',
      ogImage,
      additionalMetadata: {
        openGraph: {
          publishedTime: new Date().toISOString(),
          section: 'Big Book',
          authors: ['Alcoholics Anonymous World Services, Inc.'],
          images: [
            {
              url: ogImage,
              width: ogDimensions.width,
              height: ogDimensions.height,
              alt: chapter
                ? `Page ${pageNumber} from ${chapter.title} - AA Big Book`
                : `Page ${pageNumber} - AA Big Book`,
            }
          ],
          // Add Twitter card metadata
          twitter: {
            card: 'summary_large_image',
            title: chapter
              ? `Page ${pageNumber} - ${chapter.title} | AA Big Book`
              : `Page ${pageNumber} | AA Big Book`,
            description,
            images: [ogImage],
          }
        },
      }
    });
  } catch (error) {
    console.error('Error generating metadata:', error);

    // Fallback metadata
    return createMetadata({
      title: `Page ${pageNumber} | AA Big Book`,
      description: 'Read the Alcoholics Anonymous Big Book, the basic text for AA members.',
      path: `/big-book/page/${pageNumber}`,
    });
  }
}

export default function BigBookPage() {
  return <BigBookPageReader />;
}