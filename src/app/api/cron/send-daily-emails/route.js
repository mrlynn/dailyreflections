import { NextResponse } from 'next/server';
import { sendDailyReflectionToAllUsers } from '@/services/emailDeliveryService';

/**
 * Vercel Cron Job Endpoint for Daily Reflection Emails
 * 
 * This endpoint is triggered by Vercel Cron Jobs every hour.
 * It sends daily reflection emails to all eligible users.
 * 
 * Vercel will make GET requests to this endpoint with user-agent: "vercel-cron/1.0"
 * 
 * @see https://vercel.com/docs/cron-jobs
 */
export async function GET(request) {
  try {
    // Verify this is a legitimate Vercel cron request
    const userAgent = request.headers.get('user-agent');
    
    // In production, Vercel cron jobs always have this user agent
    // For local testing, you can bypass this check or set an env var
    if (process.env.NODE_ENV === 'production' && userAgent !== 'vercel-cron/1.0') {
      console.warn('Unauthorized cron request - invalid user agent:', userAgent);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Optional: Additional security with a cron secret
    // Uncomment if you want extra protection
    // const authHeader = request.headers.get('authorization');
    // const cronSecret = process.env.CRON_SECRET;
    // if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    console.log('Starting daily reflection email cron job...');
    const startTime = Date.now();

    // Send daily reflections to all eligible users
    const results = await sendDailyReflectionToAllUsers();

    const duration = Date.now() - startTime;
    console.log(`Daily reflection email cron job completed in ${duration}ms`);
    console.log('Results:', JSON.stringify(results, null, 2));
    
    // Add detailed logging for debugging
    if (results.total === 0) {
      console.warn('⚠️  No eligible users found for email notifications');
      console.warn('Check: 1) User preferences structure 2) Email notifications enabled 3) Valid email addresses');
    } else if (results.sent === 0 && results.total > 0) {
      console.warn('⚠️  Eligible users found but no emails sent');
      console.warn(`Failed: ${results.failed}, Skipped (quiet hours): ${results.quietHours}`);
      if (results.errors.length > 0) {
        console.warn('Errors:', results.errors);
      }
    }

    // Return results
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      results: results
    });
  } catch (error) {
    console.error('Error in daily reflection email cron job:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process cron job',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual testing
export async function POST(request) {
  // For manual testing, you might want to add authentication
  // For now, we'll allow it but log it
  console.log('Manual trigger of daily reflection email cron job');
  return GET(request);
}

