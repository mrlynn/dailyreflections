import { NextResponse } from 'next/server';
import { fetchBlogArticles } from '@/lib/repositories/blogRepository';

export const runtime = 'nodejs';

/**
 * GET /api/blog
 * Retrieves a list of published blog articles
 * Supports pagination, filtering by category or tag, and sorting
 */
export async function GET(request) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const page = searchParams.get('page');
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const search = searchParams.get('q') || searchParams.get('search');
    const includeDrafts = searchParams.get('status') === 'all';

    const result = await fetchBlogArticles({
      page,
      limit,
      category: category === 'all' ? undefined : category,
      tag: tag === 'all' ? undefined : tag,
      search,
      includeDrafts,
    });

    return NextResponse.json({
      articles: result.articles,
      pagination: {
        total: result.total,
        page: result.page,
        pageCount: result.pageCount,
        limit: result.limit,
      },
    });
  } catch (error) {
    console.error('Error fetching blog articles:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve blog articles' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { error: 'Creating blog articles is managed via the resources admin interface.' },
    { status: 405 }
  );
}