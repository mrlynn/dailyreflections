import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { runVolunteerSupport } from '@/lib/agents/volunteer/graph';
import { createInitialState } from '@/lib/agents/volunteer/state';
import clientPromise from '@/lib/mongodb';

/**
 * POST /api/volunteer/agent
 *
 * Main API endpoint for the Volunteer Support Agent system.
 * Runs the multi-agent workflow to analyze conversations and provide support.
 *
 * Request Body:
 * {
 *   conversationId: string,
 *   action: 'analyze_message' | 'coach_response' | 'triage_request',
 *   userMessage?: string,
 *   volunteerDraft?: string,
 *   waitTime?: number
 * }
 *
 * Response:
 * {
 *   success: true,
 *   analysis: {
 *     crisisDetection: {...},
 *     resourceSuggestions: [...],
 *     responseCoaching: {...},
 *     conversationAnalysis: {...},
 *     triageInfo: {...}
 *   },
 *   processingTime: number,
 *   agentExecutionPath: [...]
 * }
 */
export async function POST(request) {
  console.log('📥 Volunteer Agent API: Request received');

  try {
    // Authenticate volunteer
    const session = await getSession(request);

    if (!session?.user) {
      console.log('❌ Unauthorized: No session');
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    if (!session.user.roles?.includes('volunteer_listener')) {
      console.log('❌ Unauthorized: Not a volunteer');
      return NextResponse.json(
        { error: 'Unauthorized - Volunteer role required' },
        { status: 403 }
      );
    }

    console.log(`✅ Authenticated volunteer: ${session.user.email}`);

    // Parse request body
    const body = await request.json();
    const {
      conversationId,
      action = 'analyze_message',
      userMessage,
      volunteerDraft,
      waitTime = 0,
    } = body;

    console.log(`📋 Action: ${action}, Conversation: ${conversationId}`);

    // Validate required fields
    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      );
    }

    // Connect to database
    const client = await clientPromise;
    const db = client.db('dailyreflections');

    // Fetch conversation from database
    const conversation = await db.collection('peer_support_conversations').findOne({
      _id: conversationId,
    });

    if (!conversation) {
      console.log(`❌ Conversation not found: ${conversationId}`);
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    console.log(`📖 Loaded conversation: ${conversation.messages?.length || 0} messages`);

    // Prepare messages for agent processing
    const messages = (conversation.messages || []).map(msg => ({
      role: msg.from === conversation.userId ? 'user' : 'volunteer',
      content: msg.content,
      timestamp: new Date(msg.timestamp),
    }));

    // Add the new user message if provided
    if (userMessage) {
      messages.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      });
    }

    // Create initial state for the agent
    const initialState = createInitialState({
      conversationId,
      volunteerId: session.user.id,
      userId: conversation.userId,
      messages,
      latestUserMessage: userMessage,
      volunteerDraft,
      waitTime,
    });

    console.log('🚀 Running agent workflow...');

    // Run the agent workflow
    const agentResult = await runVolunteerSupport(initialState);

    const processingTime = agentResult.processingEndTime - agentResult.processingStartTime;

    console.log(`✅ Agent workflow complete in ${processingTime}ms`);
    console.log(`🎯 Execution path: ${agentResult.agentExecutionPath.join(' → ')}`);

    // Log crisis detection if present
    if (agentResult.crisisDetection?.isCrisis) {
      console.log(`🚨 CRISIS DETECTED: ${agentResult.crisisDetection.riskLevel}`);

      // Store crisis alert in database
      await db.collection('crisis_alerts').insertOne({
        conversationId,
        userId: conversation.userId,
        volunteerId: session.user.id,
        detectedAt: new Date(),
        riskLevel: agentResult.crisisDetection.riskLevel,
        indicators: agentResult.crisisDetection.indicators,
        recommendedAction: agentResult.crisisDetection.recommendedAction,
        resolved: false,
      });
    }

    // Store agent analysis in database for record-keeping
    await db.collection('agent_analyses').insertOne({
      conversationId,
      volunteerId: session.user.id,
      userId: conversation.userId,
      timestamp: new Date(),
      action,
      analysis: {
        crisisDetection: agentResult.crisisDetection,
        resourceSuggestions: agentResult.resourceSuggestions,
        responseCoaching: agentResult.responseCoaching,
        conversationAnalysis: agentResult.conversationAnalysis,
        triageInfo: agentResult.triageInfo,
      },
      processingTimeMs: processingTime,
      agentExecutionPath: agentResult.agentExecutionPath,
    });

    // Update agent performance metrics
    await updateAgentMetrics(db, agentResult, processingTime);

    // Return analysis results
    return NextResponse.json({
      success: true,
      analysis: {
        crisisDetection: agentResult.crisisDetection,
        resourceSuggestions: agentResult.resourceSuggestions,
        responseCoaching: agentResult.responseCoaching,
        conversationAnalysis: agentResult.conversationAnalysis,
        triageInfo: agentResult.triageInfo,
        summary: agentResult.summary,
      },
      metadata: {
        processingTime,
        agentExecutionPath: agentResult.agentExecutionPath,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('❌ Volunteer Agent API Error:', error);

    return NextResponse.json(
      {
        error: 'Agent processing failed',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Update agent performance metrics in the database
 */
async function updateAgentMetrics(db, agentResult, processingTime) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Count tool calls from execution path
    const toolCallCounts = {};
    agentResult.agentExecutionPath.forEach(agent => {
      toolCallCounts[agent] = (toolCallCounts[agent] || 0) + 1;
    });

    // Update metrics for each agent that ran
    for (const agentName of agentResult.agentExecutionPath) {
      await db.collection('agent_performance_metrics').updateOne(
        {
          date: today,
          agentName,
        },
        {
          $inc: {
            executions: 1,
            totalProcessingTime: processingTime,
          },
          $set: {
            lastUpdated: new Date(),
          },
          $setOnInsert: {
            date: today,
            agentName,
          },
        },
        { upsert: true }
      );
    }

    console.log('📊 Agent metrics updated');
  } catch (error) {
    console.error('⚠️ Error updating metrics:', error);
    // Don't fail the request if metrics update fails
  }
}

/**
 * GET /api/volunteer/agent
 *
 * Health check endpoint
 */
export async function GET(request) {
  const session = await getSession(request);

  if (!session?.user?.roles?.includes('volunteer_listener')) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    status: 'healthy',
    service: 'Volunteer Support Agent',
    version: '1.0.0',
    agents: [
      'crisis_detection',
      'resource_recommendation',
      'response_coach',
      'conversation_analyst',
      'triage',
    ],
    volunteer: {
      id: session.user.id,
      email: session.user.email,
    },
  });
}
