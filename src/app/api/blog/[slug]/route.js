import { NextResponse } from 'next/server';
import {
  fetchBlogArticleBySlug,
  fetchRelatedBlogArticles,
} from '@/lib/repositories/blogRepository';

export const runtime = 'nodejs';

/**
 * GET /api/blog/[slug]
 * Retrieves a single blog article by slug
 */
export async function GET(request, { params }) {
  try {
    const { slug } = params;
    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      );
    }

    const article = await fetchBlogArticleBySlug(slug);
    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    const relatedArticles = await fetchRelatedBlogArticles({
      slug,
      category: article.category,
      tags: article.tags,
      limit: 3,
    });

    return NextResponse.json({ article, relatedArticles });
  } catch (error) {
    console.error(`Error fetching article ${params.slug}:`, error);
    return NextResponse.json(
      { error: 'Failed to retrieve article' },
      { status: 500 }
    );
  }
}

/**
 * Writing and deletion of blog articles should be performed via the resources admin.
 */
export async function PUT() {
  return NextResponse.json(
    { error: 'Updating blog articles is managed via the resources admin interface.' },
    { status: 405 }
  );
}

/**
 * DELETE /api/blog/[slug]
 */
export async function DELETE() {
  return NextResponse.json(
    { error: 'Deleting blog articles is managed via the resources admin interface.' },
    { status: 405 }
  );
}