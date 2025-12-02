import { ChatOpenAI } from '@langchain/openai';
import { crisisAssessmentTool, emergencyResourcesTool } from '../tools';

/**
 * Crisis Detection Agent Node
 *
 * This agent analyzes incoming messages for crisis indicators including:
 * - Suicidal ideation
 * - Self-harm intentions
 * - Immediate danger
 * - Severe distress requiring escalation
 *
 * It uses the crisis assessment tool and determines if emergency
 * resources should be provided to the volunteer.
 */

export async function crisisDetectionNode(state) {
  console.log('🚨 Crisis Detection Agent: Starting analysis...');

  // Track execution
  const executionPath = state.agentExecutionPath || [];
  executionPath.push('crisis_detection');

  // If no message to analyze, skip
  if (!state.latestUserMessage) {
    console.log('⚠️ Crisis Detection Agent: No message to analyze, skipping...');
    return {
      ...state,
      agentExecutionPath: executionPath,
      crisisDetection: {
        isCrisis: false,
        riskLevel: 'none',
        indicators: [],
        recommendedAction: 'No message to analyze',
      },
      nextAction: 'resource_search',
    };
  }

  try {
    // Initialize the LLM with crisis assessment tool
    const model = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0, // Deterministic for crisis detection
    });

    // Prepare conversation history for context
    const recentMessages = state.messages
      .slice(-5)
      .map(m => `${m.role}: ${m.content}`);

    // System prompt for crisis detection
    const systemPrompt = `You are a crisis detection specialist for a peer support platform.

Your role is to analyze messages for ANY signs of crisis or immediate danger.

ALWAYS use the crisis_assessment tool to analyze the user's message.

CRISIS INDICATORS (be thorough):
- Direct statements about suicide, self-harm, or death
- Expressions of hopelessness ("I can't go on", "no point", "better off dead")
- Plans or methods mentioned
- Goodbye/farewell messages
- Statements about being a burden
- Severe substance abuse with dangerous behavior
- Recent major loss combined with despair
- Expressions of wanting to disappear

RISK LEVELS:
- critical: Immediate danger, active plan/intent
- high: Suicidal ideation, no specific plan yet
- medium: Severe distress, hopelessness, concerning patterns
- low: Struggling but no immediate risk
- none: No crisis indicators

After assessment:
- If crisis detected (medium+), use emergency_resources tool
- Provide clear recommended action for volunteer

Be sensitive but thorough. False negatives in crisis detection can be fatal.`;

    const userPrompt = `Analyze this user message for crisis indicators:

MESSAGE: "${state.latestUserMessage}"

RECENT CONVERSATION CONTEXT:
${recentMessages.join('\n')}

Use the crisis_assessment tool to evaluate this message.`;

    // Bind tools to the model
    const modelWithTools = model.bindTools([
      crisisAssessmentTool,
      emergencyResourcesTool,
    ]);

    // Invoke the model
    const response = await modelWithTools.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    console.log('🔍 Crisis Detection: Model response received');

    // Extract crisis assessment from tool calls
    let crisisAssessment = null;
    let emergencyResources = null;

    if (response.tool_calls && response.tool_calls.length > 0) {
      for (const toolCall of response.tool_calls) {
        console.log(`🔧 Crisis Detection: Executing tool - ${toolCall.name}`);

        if (toolCall.name === 'crisis_assessment') {
          // Execute the crisis assessment tool
          const assessmentResult = await crisisAssessmentTool.func(toolCall.args);
          crisisAssessment = assessmentResult;

          console.log(`📊 Crisis Assessment Result: Risk Level = ${assessmentResult.riskLevel}`);
        } else if (toolCall.name === 'emergency_resources') {
          // Get emergency resources
          const resourcesResult = await emergencyResourcesTool.func(toolCall.args);
          emergencyResources = resourcesResult;

          console.log('📞 Emergency resources retrieved');
        }
      }
    }

    // If no tool was called, create a default assessment
    if (!crisisAssessment) {
      console.log('⚠️ No crisis assessment tool called, creating default...');
      crisisAssessment = {
        isCrisis: false,
        riskLevel: 'none',
        indicators: [],
        recommendedAction: 'Continue providing normal peer support',
      };
    }

    // Add emergency resources to the assessment if crisis detected
    if (crisisAssessment.isCrisis && emergencyResources) {
      crisisAssessment.emergencyResources = emergencyResources.hotlines;
    }

    // Determine next action based on crisis level
    let nextAction;
    if (crisisAssessment.isCrisis &&
        ['critical', 'high'].includes(crisisAssessment.riskLevel)) {
      // For critical/high crisis, we need to complete and alert immediately
      nextAction = 'complete';
      console.log('🚨 CRITICAL CRISIS DETECTED - Alerting volunteer immediately');
    } else if (crisisAssessment.riskLevel === 'medium') {
      // Medium risk - continue but flag it
      nextAction = 'resource_search';
      console.log('⚠️ Medium risk detected - continuing with caution');
    } else {
      // No crisis or low risk - continue normal flow
      nextAction = 'resource_search';
      console.log('✅ No immediate crisis - continuing normal support flow');
    }

    return {
      ...state,
      crisisDetection: crisisAssessment,
      agentExecutionPath: executionPath,
      nextAction,
    };

  } catch (error) {
    console.error('❌ Crisis Detection Agent Error:', error);

    // In case of error, err on the side of caution
    return {
      ...state,
      crisisDetection: {
        isCrisis: false,
        riskLevel: 'none',
        indicators: [],
        recommendedAction: 'Error in crisis detection - manual review recommended',
        error: error.message,
      },
      agentExecutionPath: executionPath,
      nextAction: 'resource_search',
    };
  }
}
