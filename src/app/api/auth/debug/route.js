import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getSession } from '@/lib/auth';

/**
 * Debug endpoint to help diagnose authentication issues in production
 * GET /api/auth/debug
 */
export async function GET(request) {
  try {
    const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;

    // Get token using next-auth/jwt
    const token = await getToken({
      req: request,
      secret: secret,
      secureCookie: process.env.NODE_ENV === 'production',
    });

    // Get session using our custom getSession helper
    const session = await getSession(request);

    // Extract cookies for debugging
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = {};
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.trim().split('=');
      if (parts.length >= 2) {
        cookies[parts[0]] = parts.slice(1).join('=').substring(0, 20) + '...';
      }
    });

    const authCookies = Object.keys(cookies).filter(key =>
      key.includes('next-auth') || key.includes('__Secure')
    );

    return NextResponse.json({
      environment: process.env.NODE_ENV,
      vercel: !!process.env.VERCEL,
      hasSecret: !!secret,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasAuthSecret: !!process.env.AUTH_SECRET,
      authCookiesFound: authCookies,
      token: token ? {
        email: token.email,
        isAdmin: token.isAdmin,
        roles: token.roles,
        hasId: !!token.id,
        hasEmail: !!token.email,
      } : null,
      session: session ? {
        email: session.user?.email,
        isAdmin: session.user?.isAdmin,
        roles: session.user?.roles,
        hasId: !!session.user?.id,
      } : null,
    });
  } catch (error) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
