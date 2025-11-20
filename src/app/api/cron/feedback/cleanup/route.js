'use server';

import { NextResponse } from 'next/server';
import { runFeedbackCleanup } from '@/../scripts/feedback/cleanupFeedback.js';

function isAuthorized(request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return true;
  }
  const headerSecret = request.headers.get('x-cron-secret');
  return headerSecret && headerSecret === cronSecret;
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await runFeedbackCleanup();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Cron cleanup feedback failed:', error);
    return NextResponse.json({ error: 'Failed to execute feedback cleanup' }, { status: 500 });
  }
}

export async function POST(request) {
  return GET(request);
}

