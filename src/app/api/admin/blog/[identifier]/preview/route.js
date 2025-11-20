import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { isAdmin } from '@/lib/adminUtils';
import { createPreviewToken } from '@/lib/repositories/blogAdminRepository';
import { getBaseUrl } from '@/utils/seoUtils';

async function requireAdmin() {
  const session = await auth();
  if (!isAdmin(session)) {
    return { session: null, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { session };
}

export async function POST(request, { params }) {
  try {
    const { session, response } = await requireAdmin();
    if (!session) return response;

    const identifier = params?.identifier;
    const { token, article } = await createPreviewToken(identifier);

    const baseUrl = getBaseUrl(request);
    const previewUrl = `${baseUrl}/blog/${article.slug}?preview=${token}`;

    return NextResponse.json({ token, previewUrl, article });
  } catch (error) {
    console.error('Error generating preview token:', error);
    return NextResponse.json({ error: 'Failed to generate preview token' }, { status: 500 });
  }
}

