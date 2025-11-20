import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { isAdmin } from '@/lib/adminUtils';
import {
  getBlogArticleById,
  updateBlogArticle,
} from '@/lib/repositories/blogAdminRepository';

async function requireAdmin() {
  const session = await auth();
  if (!isAdmin(session)) {
    return { session: null, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { session };
}

export async function GET(_request, { params }) {
  try {
    const { session, response } = await requireAdmin();
    if (!session) return response;

    const identifier = params?.identifier;
    const article = await getBlogArticleById(identifier);

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json({ article });
  } catch (error) {
    console.error('Error fetching blog article:', error);
    return NextResponse.json({ error: 'Failed to load blog article' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { session, response } = await requireAdmin();
    if (!session) return response;

    const identifier = params?.identifier;
    const payload = await request.json().catch(() => ({}));
    const {
      autosave = false,
      recordVersion = false,
      restoreVersionId = null,
      ...data
    } = payload;

    const article = await updateBlogArticle(identifier, data, {
      autosave,
      recordVersion,
      restoreVersionId,
      user: {
        id: session.user?.id || null,
        name: session.user?.displayName || session.user?.name || '',
      },
    });

    return NextResponse.json({ article });
  } catch (error) {
    console.error('Error updating blog article:', error);
    return NextResponse.json({ error: error.message || 'Failed to update blog article' }, { status: 500 });
  }
}

