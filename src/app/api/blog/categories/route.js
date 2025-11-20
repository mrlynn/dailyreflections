import { NextResponse } from 'next/server';
import { fetchBlogCategories } from '@/lib/repositories/blogRepository';

export const runtime = 'nodejs';

/**
 * GET /api/blog/categories
 * Retrieves all unique categories from published blog articles
 */
export async function GET() {
  try {
    const categories = await fetchBlogCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching blog categories:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve blog categories' },
      { status: 500 }
    );
  }
}