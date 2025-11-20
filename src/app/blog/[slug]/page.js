import { notFound } from 'next/navigation';
import ArticlePageClient from '@/components/Blog/ArticlePageClient';
import {
  fetchBlogArticleBySlug,
  fetchRelatedBlogArticles,
} from '@/lib/repositories/blogRepository';

export default async function ArticlePage({ params, searchParams }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  const previewToken = searchParams?.preview || null;

  const article = await fetchBlogArticleBySlug(slug, {
    includeDrafts: Boolean(previewToken),
    previewToken,
  });

  if (!article) {
    notFound();
  }

  const relatedArticles = await fetchRelatedBlogArticles({
    slug,
    category: article.category,
    tags: article.tags,
    limit: 3,
  });

  return (
    <ArticlePageClient
      article={article}
      relatedArticles={relatedArticles}
      previewToken={previewToken}
    />
  );
}