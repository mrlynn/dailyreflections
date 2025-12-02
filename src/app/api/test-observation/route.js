import { NextResponse } from 'next/server';

/**
 * Simple test endpoint to verify observation agent imports
 */
export async function GET(request) {
  try {
    // Test basic import
    const { runObservationAgent } = await import('@/lib/agents/platform/observation/graph');

    return NextResponse.json({
      success: true,
      message: 'Observation agent module loaded successfully',
      hasRunFunction: typeof runObservationAgent === 'function',
    });
  } catch (error) {
    console.error('Error testing observation agent:', error);
    return NextResponse.json(
      {
        error: 'Failed to load observation agent',
        details: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
