import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { isAdmin } from '@/lib/adminUtils';
import {
  listBlogArticles,
  createBlogArticle,
} from '@/lib/repositories/blogAdminRepository';

async function requireAdmin() {
  const session = await auth();
  if (!isAdmin(session)) {
    return { session: null, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { session };
}

export async function GET(request) {
  try {
    const { session, response } = await requireAdmin();
    if (!session) return response;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q')?.trim();
    const status = searchParams.get('status') || 'all';
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const limit = searchParams.get('limit') || '200';

    const articles = await listBlogArticles({
      search,
      status,
      category,
      tag,
      limit,
    });

    return NextResponse.json({ articles });
  } catch (error) {
    console.error('Error listing blog articles:', error);
    return NextResponse.json({ error: 'Failed to load blog articles' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { session, response } = await requireAdmin();
    if (!session) return response;

    const payload = await request.json().catch(() => ({}));
    const article = await createBlogArticle(payload, {
      id: session.user?.id || null,
      name: session.user?.displayName || session.user?.name || '',
    });

    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    console.error('Error creating blog article:', error);
    return NextResponse.json({ error: error.message || 'Failed to create blog article' }, { status: 500 });
  }
}

