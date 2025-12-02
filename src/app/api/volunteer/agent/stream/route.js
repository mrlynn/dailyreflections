import { getSession } from '@/lib/auth';
import { streamVolunteerSupport } from '@/lib/agents/volunteer/graph';
import { createInitialState } from '@/lib/agents/volunteer/state';
import clientPromise from '@/lib/mongodb';

/**
 * POST /api/volunteer/agent/stream
 *
 * Streaming API endpoint for real-time agent execution updates.
 * Uses Server-Sent Events (SSE) to stream agent progress to the client.
 *
 * This allows the UI to show live updates as each agent runs:
 * - "Crisis detection in progress..."
 * - "Finding relevant resources..."
 * - "Analyzing response quality..."
 * - etc.
 *
 * Request Body: Same as /api/volunteer/agent
 *
 * Response: Server-Sent Events stream
 * Each event contains the current state after an agent runs.
 */
export async function POST(request) {
  console.log('🌊 Volunteer Agent Streaming API: Request received');

  try {
    // Authenticate volunteer
    const session = await getSession(request);

    if (!session?.user?.roles?.includes('volunteer_listener')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`✅ Authenticated volunteer: ${session.user.email}`);

    // Parse request body
    const body = await request.json();
    const {
      conversationId,
      userMessage,
      volunteerDraft,
      waitTime = 0,
    } = body;

    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: 'conversationId is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch conversation
    const client = await clientPromise;
    const db = client.db('dailyreflections');

    const conversation = await db.collection('peer_support_conversations').findOne({
      _id: conversationId,
    });

    if (!conversation) {
      return new Response(
        JSON.stringify({ error: 'Conversation not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Prepare messages
    const messages = (conversation.messages || []).map(msg => ({
      role: msg.from === conversation.userId ? 'user' : 'volunteer',
      content: msg.content,
      timestamp: new Date(msg.timestamp),
    }));

    if (userMessage) {
      messages.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      });
    }

    // Create initial state
    const initialState = createInitialState({
      conversationId,
      volunteerId: session.user.id,
      userId: conversation.userId,
      messages,
      latestUserMessage: userMessage,
      volunteerDraft,
      waitTime,
    });

    console.log('🌊 Starting streaming agent execution...');

    // Create readable stream for SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Helper to send SSE events
          const sendEvent = (eventType, data) => {
            const eventData = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(eventData));
          };

          // Send start event
          sendEvent('start', {
            message: 'Agent workflow starting...',
            timestamp: new Date().toISOString(),
          });

          // Stream agent execution
          let lastAgentName = null;
          let eventCount = 0;

          for await (const event of streamVolunteerSupport(initialState)) {
            eventCount++;

            // Each event is a state update from an agent
            const agentName = Object.keys(event)[0];
            const agentState = event[agentName];

            console.log(`📡 Streaming event #${eventCount}: ${agentName}`);

            // Send progress update
            if (agentName !== lastAgentName) {
              sendEvent('agent_start', {
                agent: agentName,
                message: getAgentStartMessage(agentName),
                timestamp: new Date().toISOString(),
              });

              lastAgentName = agentName;
            }

            // Send agent results when available
            if (agentState.crisisDetection && agentName === 'crisis_check') {
              sendEvent('crisis_detection', {
                crisisDetection: agentState.crisisDetection,
                timestamp: new Date().toISOString(),
              });
            }

            if (agentState.resourceSuggestions && agentName === 'resource_search') {
              sendEvent('resources_found', {
                resourceSuggestions: agentState.resourceSuggestions,
                timestamp: new Date().toISOString(),
              });
            }

            if (agentState.responseCoaching && agentName === 'coach_response') {
              sendEvent('response_coaching', {
                responseCoaching: agentState.responseCoaching,
                timestamp: new Date().toISOString(),
              });
            }

            if (agentState.conversationAnalysis && agentName === 'analyze_conversation') {
              sendEvent('conversation_analysis', {
                conversationAnalysis: agentState.conversationAnalysis,
                timestamp: new Date().toISOString(),
              });
            }

            if (agentState.triageInfo && agentName === 'triage') {
              sendEvent('triage_complete', {
                triageInfo: agentState.triageInfo,
                timestamp: new Date().toISOString(),
              });
            }
          }

          // Send completion event
          sendEvent('complete', {
            message: 'Agent workflow complete',
            timestamp: new Date().toISOString(),
            totalEvents: eventCount,
          });

          console.log(`✅ Streaming complete: ${eventCount} events sent`);
          controller.close();

        } catch (error) {
          console.error('❌ Streaming error:', error);

          const errorEvent = `event: error\ndata: ${JSON.stringify({
            error: error.message,
            timestamp: new Date().toISOString(),
          })}\n\n`;

          controller.enqueue(encoder.encode(errorEvent));
          controller.close();
        }
      },
    });

    // Return SSE response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    });

  } catch (error) {
    console.error('❌ Streaming API Error:', error);

    return new Response(
      JSON.stringify({
        error: 'Streaming failed',
        details: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Get friendly message for when an agent starts
 */
function getAgentStartMessage(agentName) {
  const messages = {
    supervisor: 'Coordinating agents...',
    crisis_check: 'Checking for crisis indicators...',
    resource_search: 'Finding relevant AA resources...',
    coach_response: 'Analyzing response quality...',
    analyze_conversation: 'Analyzing conversation insights...',
    triage: 'Calculating priority level...',
  };

  return messages[agentName] || `Running ${agentName}...`;
}
