import { NextResponse } from 'next/server';

/**
 * Redirect /90in90 to /meetings/tracker
 * This creates a shortcut URL for the 90 in 90 meeting tracker
 */
export function GET() {
  return NextResponse.redirect(new URL('/meetings/tracker', process.env.NEXTAUTH_URL));
}