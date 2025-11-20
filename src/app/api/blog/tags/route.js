import { NextResponse } from 'next/server';
import { fetchBlogTags } from '@/lib/repositories/blogRepository';

export const runtime = 'nodejs';

/**
 * GET /api/blog/tags
 * Retrieves all unique tags from published blog articles
 */
export async function GET() {
  try {
    const tags = await fetchBlogTags();
    return NextResponse.json({ tags });
  } catch (error) {
    console.error('Error fetching blog tags:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve blog tags' },
      { status: 500 }
    );
  }
}