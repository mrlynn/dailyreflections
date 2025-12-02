import { NextResponse } from 'next/server';
import { runObservationAgent } from '@/lib/agents/platform/observation/graph';

/**
 * Test endpoint to run observation agent without auth (for debugging only)
 * TODO: Remove this endpoint in production
 */
export async function GET(request) {
  try {
    console.log('🧪 TEST: Starting observation agent...');

    const result = await runObservationAgent({
      observationType: 'on-demand',
    });

    console.log('🧪 TEST: Observation complete!');

    return NextResponse.json({
      success: true,
      message: 'Observation agent ran successfully',
      result,
    });
  } catch (error) {
    console.error('🧪 TEST ERROR:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
        name: error.name,
      },
      { status: 500 }
    );
  }
}
