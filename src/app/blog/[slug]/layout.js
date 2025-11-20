import { createMetadata } from '@/utils/seoUtils';
import { fetchBlogArticleBySlug } from '@/lib/repositories/blogRepository';

export async function generateMetadata({ params }) {
  let slugValue = '';
  try {
    const resolvedParams = await params;
    slugValue = resolvedParams?.slug || '';
    const article = await fetchBlogArticleBySlug(slugValue);

    if (!article) {
      return createMetadata({
        title: 'Blog Article',
        description: 'Recovery blog article from Daily Reflections',
        path: `/blog/${slugValue}`,
      });
    }

    const keywords = [
      article.category?.toLowerCase?.() || 'recovery',
      ...article.tags,
      'recovery',
      'sobriety',
      'aa literature',
    ];

    return createMetadata({
      title: article.title,
      description: article.excerpt,
      path: `/blog/${slugValue}`,
      keywords,
      ogType: 'article',
      ogImage: article.coverImage || undefined,
      additionalMetadata: {
        openGraph: {
          publishedTime: article.publishedAt,
          section: article.category || 'Recovery',
          tags: article.tags,
        },
      },
    });
  } catch (error) {
    console.error('Error generating metadata for blog slug:', error);
    return createMetadata({
      title: 'Blog Article',
      description: 'Recovery blog article from Daily Reflections',
      path: `/blog/${slugValue}`,
    });
  }
}

export default function BlogSlugLayout({ children }) {
  return children;
}
