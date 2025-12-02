import { ChatOpenAI } from '@langchain/openai';
import { calculateUrgencyTool } from '../tools';

/**
 * Triage Agent Node
 *
 * This agent prioritizes incoming support requests by:
 * - Calculating urgency scores
 * - Assigning priority levels
 * - Estimating conversation duration
 * - Determining if escalation is needed
 *
 * Used when new users request support to help volunteers manage their queue.
 */

export async function triageNode(state) {
  console.log('🏥 Triage Agent: Starting prioritization...');

  // Track execution
  const executionPath = state.agentExecutionPath || [];
  executionPath.push('triage');

  // Need a message to triage
  if (!state.latestUserMessage) {
    console.log('⚠️ Triage Agent: No message to triage, skipping...');
    return {
      ...state,
      agentExecutionPath: executionPath,
      triageInfo: {
        urgencyScore: 50,
        priority: 'medium',
        estimatedDuration: 30,
        requiresEscalation: false,
      },
      nextAction: 'complete',
    };
  }

  try {
    // Initialize the LLM with triage tool
    const model = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0, // Deterministic for consistent triage
    });

    const systemPrompt = `You are a triage specialist for peer support requests.

Your role is to prioritize incoming support requests to help volunteers manage their queue effectively.

Use the calculate_urgency_score tool to assess priority based on:

FACTORS TO CONSIDER:
1. Crisis indicators (highest priority)
2. User distress level
3. Wait time (longer = higher priority)
4. Urgency language in message
5. First-time users vs returning
6. Time sensitivity of the issue

PRIORITY LEVELS:
- urgent: Crisis or severe distress, immediate attention needed
- high: Significant distress or long wait time
- medium: Standard support request
- low: General questions or stable user

ESTIMATED DURATION:
- Simple questions: 15-20 minutes
- Support conversations: 30-45 minutes
- Complex issues: 45-60 minutes

Use the tool to calculate urgency and provide triage recommendations.`;

    const userPrompt = `Triage this support request:

USER MESSAGE: "${state.latestUserMessage}"

WAIT TIME: ${state.waitTime || 0} minutes

${state.crisisDetection ? `
CRISIS DETECTED: ${state.crisisDetection.isCrisis}
RISK LEVEL: ${state.crisisDetection.riskLevel}
` : 'No crisis detection available'}

${state.conversationAnalysis ? `
SENTIMENT: ${state.conversationAnalysis.sentiment}
USER STATE: ${state.conversationAnalysis.userEmotionalState}
` : ''}

Use the calculate_urgency_score tool to determine priority.`;

    // Bind the triage tool
    const modelWithTools = model.bindTools([calculateUrgencyTool]);

    // Invoke the model
    const response = await modelWithTools.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    console.log('🔍 Triage: Model response received');

    // Extract triage info from tool call
    let triageInfo = null;

    if (response.tool_calls && response.tool_calls.length > 0) {
      const toolCall = response.tool_calls[0];
      console.log(`🔧 Triage: Executing tool - ${toolCall.name}`);

      if (toolCall.name === 'calculate_urgency_score') {
        const triageResult = await calculateUrgencyTool.func({
          ...toolCall.args,
          crisisDetected: state.crisisDetection?.isCrisis || false,
        });

        triageInfo = triageResult;
        console.log(`📊 Triage Result: Priority=${triageInfo.priority}, Urgency=${triageInfo.urgencyScore}/100`);
      }
    }

    // If no tool called, create default triage
    if (!triageInfo) {
      console.log('⚠️ No triage tool called, creating default...');

      // Calculate based on available info
      let urgencyScore = 50; // Start at medium

      // Increase for crisis
      if (state.crisisDetection?.isCrisis) {
        urgencyScore += 40;
      }

      // Increase for wait time
      const waitTime = state.waitTime || 0;
      if (waitTime > 30) urgencyScore += 20;
      else if (waitTime > 15) urgencyScore += 10;

      // Increase for distressed sentiment
      if (state.conversationAnalysis?.sentiment === 'distressed') {
        urgencyScore += 15;
      }

      urgencyScore = Math.min(100, urgencyScore);

      const priority = urgencyScore >= 70 ? 'urgent' :
                      urgencyScore >= 50 ? 'high' :
                      urgencyScore >= 30 ? 'medium' : 'low';

      triageInfo = {
        urgencyScore,
        priority,
        estimatedDuration: 30,
        requiresEscalation: state.crisisDetection?.isCrisis || false,
        escalationReason: state.crisisDetection?.isCrisis
          ? `Crisis detected: ${state.crisisDetection.riskLevel}`
          : undefined,
        factors: [],
      };
    }

    console.log(`🏥 Triage complete: ${triageInfo.priority.toUpperCase()} priority (score: ${triageInfo.urgencyScore})`);

    return {
      ...state,
      triageInfo,
      agentExecutionPath: executionPath,
      nextAction: 'complete',
    };

  } catch (error) {
    console.error('❌ Triage Agent Error:', error);

    // Return default medium priority on error
    return {
      ...state,
      triageInfo: {
        urgencyScore: 50,
        priority: 'medium',
        estimatedDuration: 30,
        requiresEscalation: false,
        error: error.message,
      },
      agentExecutionPath: executionPath,
      nextAction: 'complete',
    };
  }
}
