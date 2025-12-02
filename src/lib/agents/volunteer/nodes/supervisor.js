import { ChatOpenAI } from '@langchain/openai';

/**
 * Supervisor Agent Node
 *
 * The supervisor coordinates the multi-agent workflow by:
 * - Analyzing the current state
 * - Deciding which specialized agent should run next
 * - Routing execution through the agent graph
 * - Ensuring all necessary agents run for complete analysis
 *
 * This is the "brain" of the agent system.
 */

export async function supervisorNode(state) {
  console.log('🎯 Supervisor Agent: Analyzing state and routing...');

  // Track execution
  const executionPath = state.agentExecutionPath || [];
  executionPath.push('supervisor');

  try {
    // Initialize the LLM for decision making
    const model = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0, // Deterministic routing
    });

    // Analyze current state to determine next action
    const stateAnalysis = analyzeCurrentState(state);

    console.log('📊 State Analysis:', stateAnalysis);

    const systemPrompt = `You are a supervisor coordinating multiple AI agents to support volunteer peer counselors.

AVAILABLE AGENTS:
1. crisis_check - Detects crisis situations requiring immediate attention
2. resource_search - Finds relevant AA literature and resources
3. coach_response - Analyzes and provides feedback on volunteer responses
4. analyze_conversation - Provides conversation insights and sentiment analysis
5. triage - Prioritizes incoming support requests
6. complete - Finish processing and return results

ROUTING LOGIC:

CRITICAL RULES:
- ALWAYS run crisis_check FIRST for new user messages (safety first!)
- If crisis detected (high/critical risk), go directly to 'complete' to alert immediately
- crisis_check must run before any other agent

STANDARD FLOW:
1. New user message → crisis_check
2. After crisis check (no crisis) → resource_search
3. If volunteer has a draft response → coach_response
4. After resources/coaching → analyze_conversation
5. For new incoming requests (triage mode) → triage
6. When all needed agents have run → complete

STATE INFORMATION:
${stateAnalysis.description}

DECISION:
Based on the current state, which agent should run next?
Return ONLY the agent name: crisis_check, resource_search, coach_response, analyze_conversation, triage, or complete`;

    const response = await model.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Current state:\n${stateAnalysis.description}\n\nWhich agent should run next?` }
    ]);

    // Extract the next action from the response
    let nextAction = response.content.trim().toLowerCase();

    // Clean up the response (remove any extra text)
    const validActions = [
      'crisis_check',
      'resource_search',
      'coach_response',
      'analyze_conversation',
      'triage',
      'complete'
    ];

    // Find the first valid action in the response
    const foundAction = validActions.find(action => nextAction.includes(action));
    nextAction = foundAction || 'complete';

    console.log(`🎯 Supervisor Decision: Next action = ${nextAction}`);

    // Apply routing logic validation
    nextAction = validateRouting(state, nextAction, stateAnalysis);

    console.log(`✅ Validated routing: ${nextAction}`);

    return {
      ...state,
      nextAction,
      agentExecutionPath: executionPath,
    };

  } catch (error) {
    console.error('❌ Supervisor Agent Error:', error);

    // Fallback to safe routing on error
    const fallbackAction = determineFallbackAction(state);

    return {
      ...state,
      nextAction: fallbackAction,
      agentExecutionPath: executionPath,
    };
  }
}

/**
 * Analyze the current state to help supervisor make decisions
 */
function analyzeCurrentState(state) {
  const checks = {
    hasNewMessage: !!state.latestUserMessage,
    hasVolunteerDraft: !!state.volunteerDraft,
    crisisCheckDone: !!state.crisisDetection,
    crisisDetected: state.crisisDetection?.isCrisis || false,
    resourcesFound: !!state.resourceSuggestions,
    responseCoached: !!state.responseCoaching,
    conversationAnalyzed: !!state.conversationAnalysis,
    triaged: !!state.triageInfo,
    messageCount: state.messages?.length || 0,
    agentsRun: state.agentExecutionPath?.length || 0,
  };

  const description = `
Has new user message: ${checks.hasNewMessage}
Has volunteer draft: ${checks.hasVolunteerDraft}
Crisis check completed: ${checks.crisisCheckDone}
  ${checks.crisisCheckDone ? `→ Crisis detected: ${checks.crisisDetected}` : ''}
Resources found: ${checks.resourcesFound}
  ${checks.resourcesFound ? `→ ${state.resourceSuggestions?.length || 0} resources` : ''}
Response coached: ${checks.responseCoached}
Conversation analyzed: ${checks.conversationAnalyzed}
Triage completed: ${checks.triaged}
Message count: ${checks.messageCount}
Agents executed: ${state.agentExecutionPath?.join(' → ') || 'none'}
  `.trim();

  return { checks, description };
}

/**
 * Validate and enforce routing rules
 */
function validateRouting(state, suggestedAction, analysis) {
  const { checks } = analysis;

  // RULE 1: Must run crisis check first if there's a new message and it hasn't been done
  if (checks.hasNewMessage && !checks.crisisCheckDone) {
    console.log('🔒 Routing Rule: Crisis check required first');
    return 'crisis_check';
  }

  // RULE 2: If critical crisis detected, go straight to complete
  if (checks.crisisDetected &&
      ['critical', 'high'].includes(state.crisisDetection.riskLevel)) {
    console.log('🚨 Routing Rule: Critical crisis - completing immediately');
    return 'complete';
  }

  // RULE 3: Can't coach a response that doesn't exist
  if (suggestedAction === 'coach_response' && !checks.hasVolunteerDraft) {
    console.log('⚠️ Routing Rule: No draft to coach, skipping to conversation analysis');
    return 'analyze_conversation';
  }

  // RULE 4: Standard flow - ensure agents run in logical order
  if (suggestedAction === 'resource_search') {
    // Can proceed with resource search if crisis check is done
    if (!checks.crisisCheckDone) {
      return 'crisis_check';
    }
    return 'resource_search';
  }

  if (suggestedAction === 'coach_response') {
    // Can coach if we have resources OR crisis check done
    if (!checks.crisisCheckDone) {
      return 'crisis_check';
    }
    return 'coach_response';
  }

  if (suggestedAction === 'analyze_conversation') {
    // Can analyze if crisis check done
    if (!checks.crisisCheckDone && checks.hasNewMessage) {
      return 'crisis_check';
    }
    return 'analyze_conversation';
  }

  // RULE 5: Complete if all necessary work is done
  if (suggestedAction === 'complete') {
    // Ensure minimum analysis has been done
    if (checks.hasNewMessage && !checks.crisisCheckDone) {
      console.log('⚠️ Routing Rule: Cannot complete without crisis check');
      return 'crisis_check';
    }

    // If we have a message but haven't analyzed conversation yet
    if (checks.hasNewMessage && !checks.conversationAnalyzed && checks.messageCount > 0) {
      console.log('⚠️ Routing Rule: Should analyze conversation before completing');
      return 'analyze_conversation';
    }

    return 'complete';
  }

  // Default: return the suggested action
  return suggestedAction;
}

/**
 * Determine fallback action in case of supervisor error
 */
function determineFallbackAction(state) {
  // Safety first - if there's a new message and no crisis check, do that
  if (state.latestUserMessage && !state.crisisDetection) {
    return 'crisis_check';
  }

  // If crisis check done but no analysis, analyze
  if (state.crisisDetection && !state.conversationAnalysis) {
    return 'analyze_conversation';
  }

  // Otherwise, complete
  return 'complete';
}
