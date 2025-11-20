import { NextResponse } from 'next/server';

/**
 * Simple test endpoint
 */
export async function GET() {
  return NextResponse.json({ success: true, message: 'API route is working' });
}