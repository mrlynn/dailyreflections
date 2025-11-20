import { NextResponse } from 'next/server';
import { getStepByNumber, getStepReflections } from '@/lib/models/step';

/**
 * GET /api/steps/[number] - Get a specific step by its number
 */
export async function GET(request, { params }) {
  try {
    const stepNumber = params.number;

    // Get the step data
    const step = await getStepByNumber(stepNumber);

    if (!step) {
      return NextResponse.json(
        { error: `Step ${stepNumber} not found` },
        { status: 404 }
      );
    }

    // Get reflections related to this step
    const reflections = await getStepReflections(stepNumber);

    // Return combined data
    return NextResponse.json({
      ...step,
      reflectionReferences: reflections
    });

  } catch (error) {
    console.error(`Error getting step ${params.number}:`, error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}