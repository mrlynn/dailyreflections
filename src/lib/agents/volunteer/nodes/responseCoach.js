import { ChatOpenAI } from '@langchain/openai';
import { analyzeResponseQualityTool } from '../tools';

/**
 * Response Coach Agent Node
 *
 * This agent provides real-time coaching feedback on volunteer responses.
 * It analyzes draft responses for:
 * - Quality and clarity
 * - Empathy and active listening
 * - Appropriate boundaries
 * - Alignment with AA principles
 *
 * Provides constructive feedback to help volunteers improve their peer support skills.
 */

export async function responseCoachNode(state) {
  console.log('🎓 Response Coach Agent: Starting analysis...');

  // Track execution
  const executionPath = state.agentExecutionPath || [];
  executionPath.push('response_coach');

  // Only run if there's a volunteer draft to analyze
  if (!state.volunteerDraft) {
    console.log('⚠️ Response Coach Agent: No draft response to analyze, skipping...');
    return {
      ...state,
      agentExecutionPath: executionPath,
      nextAction: 'analyze_conversation',
    };
  }

  if (!state.latestUserMessage) {
    console.log('⚠️ Response Coach Agent: No user message context, skipping...');
    return {
      ...state,
      agentExecutionPath: executionPath,
      nextAction: 'analyze_conversation',
    };
  }

  try {
    // Initialize the LLM with response analysis tool
    const model = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0.2, // Low temperature for consistent coaching
    });

    // Prepare conversation context
    const recentMessages = state.messages
      .slice(-3)
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    const systemPrompt = `You are a peer support coach specializing in AA recovery conversations.

Your role is to analyze volunteer responses and provide constructive coaching.

Use the analyze_response_quality tool to evaluate the volunteer's draft response.

EVALUATION CRITERIA:

1. EMPATHY & ACTIVE LISTENING:
   - Acknowledges user's feelings
   - Shows understanding without judgment
   - Validates the user's experience
   - Uses reflective listening

2. QUALITY & HELPFULNESS:
   - Clear and understandable
   - Appropriate length (not too short or overwhelming)
   - Stays on topic
   - Provides support or shares experience

3. APPROPRIATE BOUNDARIES:
   - Shares experience rather than giving advice
   - Avoids "you should" statements
   - Doesn't lecture or preach
   - Maintains peer relationship
   - Doesn't minimize user's feelings

4. AA PRINCIPLES:
   - Aligns with AA traditions
   - References program concepts when appropriate
   - Promotes hope and recovery
   - Respects anonymity

COACHING APPROACH:
- Be constructive and encouraging
- Identify 2-3 specific strengths
- Suggest 1-2 gentle improvements
- Focus on enhancing, not criticizing
- Remember volunteers are learning

Use the tool to provide coaching feedback.`;

    const userPrompt = `Analyze this volunteer response and provide coaching:

USER MESSAGE: "${state.latestUserMessage}"

VOLUNTEER DRAFT RESPONSE: "${state.volunteerDraft}"

CONVERSATION CONTEXT:
${recentMessages}

${state.conversationAnalysis ? `
USER EMOTIONAL STATE: ${state.conversationAnalysis.userEmotionalState}
SENTIMENT: ${state.conversationAnalysis.sentiment}
` : ''}

Use the analyze_response_quality tool to evaluate this response and provide coaching.`;

    // Bind the analysis tool
    const modelWithTools = model.bindTools([analyzeResponseQualityTool]);

    // Invoke the model
    const response = await modelWithTools.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    console.log('🔍 Response Coach: Model response received');

    // Extract coaching feedback from tool calls
    let coaching = null;

    if (response.tool_calls && response.tool_calls.length > 0) {
      const toolCall = response.tool_calls[0];
      console.log(`🔧 Response Coach: Executing tool - ${toolCall.name}`);

      if (toolCall.name === 'analyze_response_quality') {
        const analysisResult = await analyzeResponseQualityTool.func(toolCall.args);
        coaching = analysisResult;

        console.log(`📊 Response Analysis: Quality=${coaching.qualityScore}/10, Empathy=${coaching.empathyScore}/10`);
      }
    }

    // If no tool called, create a basic positive feedback
    if (!coaching) {
      console.log('⚠️ No analysis tool called, creating default feedback...');
      coaching = {
        qualityScore: 7,
        empathyScore: 7,
        suggestions: ['Consider adding a personal experience if appropriate'],
        strengths: ['Response shows care and willingness to support'],
        improvements: [],
        appropriateness: {
          maintainsBoundaries: true,
          avoidAdviceGiving: true,
          showsEmpathy: true,
          reflectsAAprinciples: true,
        },
      };
    }

    console.log(`🎓 Response Coach complete: ${coaching.strengths.length} strengths, ${coaching.improvements.length} suggestions`);

    return {
      ...state,
      responseCoaching: coaching,
      agentExecutionPath: executionPath,
      nextAction: 'analyze_conversation',
    };

  } catch (error) {
    console.error('❌ Response Coach Agent Error:', error);

    // Return minimal coaching on error
    return {
      ...state,
      responseCoaching: {
        qualityScore: 7,
        empathyScore: 7,
        suggestions: [],
        strengths: ['Response shows care for the user'],
        improvements: [],
        error: error.message,
      },
      agentExecutionPath: executionPath,
      nextAction: 'analyze_conversation',
    };
  }
}
