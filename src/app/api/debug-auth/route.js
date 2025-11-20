/**
 * Debug endpoint to check authentication
 */
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { auth } from '@/app/api/auth/[...nextauth]/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    console.log('Debug Auth: Request received');

    // Check if any cookies are present
    const cookieHeader = request.headers.get('cookie') || '';
    const hasCookies = cookieHeader.length > 0;

    console.log(`Cookie header present: ${hasCookies}`);

    if (hasCookies) {
      // Parse cookies for debug info
      const parsedCookies = {};
      const cookieParts = cookieHeader.split(';');

      cookieParts.forEach(cookie => {
        const parts = cookie.trim().split('=');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          parsedCookies[key] = true; // Just track existence, not values
        }
      });

      console.log('Found cookies:', Object.keys(parsedCookies));

      // Check for auth related cookies specifically
      const authCookies = Object.keys(parsedCookies).filter(key =>
        key.includes('auth') ||
        key.includes('session') ||
        key.includes('next-auth')
      );

      console.log('Auth-related cookies:', authCookies.length > 0 ? authCookies : 'None');
    }

    // Try to get session multiple ways to debug which one works
    console.log('Attempting to get session via getSession()...');
    const session = await getSession(request);

    console.log('Attempting to get session via auth()...');
    const authSession = await auth();

    const sessionStatus = {
      getSessionResult: session ? {
        found: true,
        userId: session.user?.id || session.user?.sub || null,
        email: session.user?.email || null,
        name: session.user?.name || null,
        hasExpiry: !!session.expires,
      } : {
        found: false
      },

      authResult: authSession ? {
        found: true,
        userId: authSession.user?.id || authSession.user?.sub || null,
        email: authSession.user?.email || null,
        name: authSession.user?.name || null,
        hasExpiry: !!authSession.expires,
      } : {
        found: false
      }
    };

    console.log('Session check results:', sessionStatus);

    return NextResponse.json({
      hasCookies,
      sessionStatus,
      timeChecked: new Date().toISOString()
    });

  } catch (error) {
    console.error('Auth debug failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}