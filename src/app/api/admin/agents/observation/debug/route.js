import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToMongoose } from '@/lib/mongoose';
import clientPromise from '@/lib/mongodb';

/**
 * Debug endpoint to test observation agent components step by step
 */
export async function GET(request) {
  const results = {
    steps: [],
    errors: [],
  };

  try {
    // Step 1: Check authentication
    results.steps.push('Checking authentication...');
    const session = await getSession(request);
    if (!session?.user) {
      results.errors.push('No session found');
      return NextResponse.json(results, { status: 401 });
    }
    results.steps.push(`✅ Authenticated as: ${session.user.email}`);

    // Step 2: Check admin role
    results.steps.push('Checking admin role...');
    const isAdmin = session.user.roles?.includes('admin') || session.user.isAdmin;
    if (!isAdmin) {
      results.errors.push('Not an admin');
      return NextResponse.json(results, { status: 403 });
    }
    results.steps.push('✅ Admin role confirmed');

    // Step 3: Connect to Mongoose
    results.steps.push('Connecting to Mongoose...');
    await connectToMongoose();
    results.steps.push('✅ Mongoose connected');

    // Step 4: Get MongoDB client
    results.steps.push('Getting MongoDB client...');
    const client = await clientPromise;
    const db = client.db('dailyreflections');
    results.steps.push('✅ MongoDB client ready');

    // Step 5: Test users collection query
    results.steps.push('Testing users collection query...');
    const userCount = await db.collection('users').countDocuments();
    results.steps.push(`✅ Found ${userCount} users`);

    // Step 6: Test volunteer query
    results.steps.push('Testing volunteer query...');
    const volunteerCount = await db.collection('users').countDocuments({
      roles: 'volunteer',
    });
    results.steps.push(`✅ Found ${volunteerCount} volunteers`);

    // Step 7: Test chat_sessions collection
    results.steps.push('Testing chat_sessions collection...');
    const sessionCount = await db.collection('chat_sessions').countDocuments();
    results.steps.push(`✅ Found ${sessionCount} chat sessions`);

    // Step 8: Test meeting_attendance collection
    results.steps.push('Testing meeting_attendance collection...');
    const meetingCount = await db.collection('meeting_attendance').countDocuments();
    results.steps.push(`✅ Found ${meetingCount} meeting attendance records`);

    // Step 9: Test reflections collection
    results.steps.push('Testing reflections collection...');
    const reflectionCount = await db.collection('reflections').countDocuments();
    results.steps.push(`✅ Found ${reflectionCount} reflections`);

    // Step 10: Test observation agent import
    results.steps.push('Testing observation agent import...');
    const { runObservationAgent } = await import('@/lib/agents/platform/observation/graph');
    results.steps.push('✅ Observation agent imported successfully');

    // Step 11: Check for OpenAI API key
    results.steps.push('Checking for OpenAI API key...');
    if (!process.env.OPENAI_API_KEY) {
      results.errors.push('OPENAI_API_KEY environment variable not set');
    } else {
      results.steps.push(`✅ OpenAI API key found (${process.env.OPENAI_API_KEY.substring(0, 10)}...)`);
    }

    return NextResponse.json({
      success: true,
      message: 'All diagnostic tests passed!',
      results,
    });
  } catch (error) {
    results.errors.push(error.message);
    results.steps.push(`❌ Error: ${error.message}`);

    return NextResponse.json(
      {
        success: false,
        message: 'Diagnostic tests failed',
        results,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
