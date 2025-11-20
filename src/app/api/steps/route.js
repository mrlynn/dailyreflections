import { NextResponse } from 'next/server';
import { getSteps, getStepByNumber, getStepReflections, seedSteps } from '@/lib/models/step';

/**
 * GET /api/steps - Get all steps or a specific step
 * Query parameters:
 * - number: Get a specific step by number
 * - seed: Seed the database with initial steps data if true
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const stepNumber = searchParams.get('number');
    const shouldSeed = searchParams.get('seed') === 'true';

    // Handle seeding request
    if (shouldSeed) {
      const seedResult = await seedSteps();
      return NextResponse.json(seedResult);
    }

    // Get a specific step by number
    if (stepNumber) {
      const step = await getStepByNumber(stepNumber);

      if (!step) {
        return NextResponse.json(
          { error: `Step ${stepNumber} not found` },
          { status: 404 }
        );
      }

      // Get reflections related to this step
      const reflections = await getStepReflections(stepNumber);
      return NextResponse.json({
        ...step,
        reflectionReferences: reflections
      });
    }

    // Get all steps
    const steps = await getSteps();
    return NextResponse.json(steps);
  } catch (error) {
    console.error('Error in steps API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}