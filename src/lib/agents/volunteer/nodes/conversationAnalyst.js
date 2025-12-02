import { ChatOpenAI } from '@langchain/openai';
import { sentimentAnalysisTool, topicExtractionTool, generateSummaryTool } from '../tools';

/**
 * Conversation Analyst Agent Node
 *
 * This agent provides insights about the ongoing conversation:
 * - Sentiment and emotional state tracking
 * - Topic and theme identification
 * - Conversation phase detection
 * - Overall conversation quality
 * - Summary generation (when requested)
 */

export async function conversationAnalystNode(state) {
  console.log('📊 Conversation Analyst Agent: Starting analysis...');

  // Track execution
  const executionPath = state.agentExecutionPath || [];
  executionPath.push('conversation_analyst');

  // Need at least some messages to analyze
  if (!state.messages || state.messages.length === 0) {
    console.log('⚠️ Conversation Analyst Agent: No messages to analyze, skipping...');
    return {
      ...state,
      agentExecutionPath: executionPath,
      nextAction: 'complete',
    };
  }

  try {
    // Initialize the LLM with analysis tools
    const model = new ChatOpenAI({
      modelName: 'gpt-4o-mini', // Use cheaper model for analysis
      temperature: 0.1,
    });

    // Prepare conversation for analysis
    const conversationMessages = state.messages.map(m => m.content);
    const conversationText = state.messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    const systemPrompt = `You are a conversation analyst for peer support sessions.

Your role is to analyze conversations and provide insights that help volunteers understand and respond effectively.

AVAILABLE TOOLS:
1. sentiment_analysis - Analyze emotional sentiment and user state
2. topic_extraction - Identify main topics and themes
3. generate_summary - Create a summary (only if conversation is ending)

ANALYSIS GOALS:
1. Understand user's emotional state and sentiment trajectory
2. Identify key topics being discussed
3. Determine conversation phase (opening, exploration, support, closing)
4. Assess overall conversation quality

Use the tools to analyze this conversation and provide insights.`;

    const userPrompt = `Analyze this peer support conversation:

CONVERSATION:
${conversationText}

MESSAGE COUNT: ${state.messages.length}

${state.latestUserMessage ? `LATEST USER MESSAGE: "${state.latestUserMessage}"` : ''}

Use the tools to:
1. Analyze sentiment and emotional state
2. Extract main topics and themes
${state.messages.length >= 6 ? '3. Generate a summary if appropriate' : ''}

Provide insights to help the volunteer understand the conversation.`;

    // Bind tools to the model
    const modelWithTools = model.bindTools([
      sentimentAnalysisTool,
      topicExtractionTool,
      ...(state.messages.length >= 6 ? [generateSummaryTool] : []),
    ]);

    // Invoke the model
    const response = await modelWithTools.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    console.log('🔍 Conversation Analyst: Model response received');

    // Execute tool calls and gather analysis
    let sentimentData = null;
    let topicData = null;
    let summaryData = null;

    if (response.tool_calls && response.tool_calls.length > 0) {
      for (const toolCall of response.tool_calls) {
        console.log(`🔧 Conversation Analyst: Executing tool - ${toolCall.name}`);

        try {
          if (toolCall.name === 'sentiment_analysis') {
            sentimentData = await sentimentAnalysisTool.func({
              messages: conversationMessages,
            });
            console.log(`💭 Sentiment: ${sentimentData.sentiment} (confidence: ${sentimentData.confidence})`);
          } else if (toolCall.name === 'topic_extraction') {
            topicData = await topicExtractionTool.func({
              conversation: conversationMessages,
            });
            console.log(`📋 Topics: ${topicData.topics.join(', ')}`);
          } else if (toolCall.name === 'generate_summary') {
            summaryData = await generateSummaryTool.func({
              messages: state.messages.map(m => ({
                role: m.role,
                content: m.content,
              })),
            });
            console.log(`📝 Summary generated`);
          }
        } catch (toolError) {
          console.error(`❌ Error executing ${toolCall.name}:`, toolError);
        }
      }
    }

    // Determine conversation phase based on message count and content
    const conversationPhase = determineConversationPhase(state.messages);

    // Build conversation analysis
    const analysis = {
      sentiment: sentimentData?.sentiment || 'neutral',
      sentimentScore: sentimentData?.confidence,
      topics: topicData?.topics || [],
      userEmotionalState: sentimentData?.emotionalState || 'Engaged in conversation',
      conversationPhase,
      keyThemes: topicData ? [topicData.primaryTheme] : [],
      conversationQuality: calculateConversationQuality(state.messages, sentimentData),
    };

    console.log(`📊 Conversation Analyst complete: Phase=${conversationPhase}, Sentiment=${analysis.sentiment}`);

    return {
      ...state,
      conversationAnalysis: analysis,
      summary: summaryData?.summary,
      agentExecutionPath: executionPath,
      nextAction: 'complete',
    };

  } catch (error) {
    console.error('❌ Conversation Analyst Agent Error:', error);

    // Return basic analysis on error
    const fallbackPhase = state.messages.length <= 4 ? 'opening' :
                         state.messages.length <= 10 ? 'exploration' :
                         state.messages.length <= 20 ? 'support' : 'closing';

    return {
      ...state,
      conversationAnalysis: {
        sentiment: 'neutral',
        topics: [],
        userEmotionalState: 'Unknown',
        conversationPhase: fallbackPhase,
        error: error.message,
      },
      agentExecutionPath: executionPath,
      nextAction: 'complete',
    };
  }
}

/**
 * Determine conversation phase based on message count and patterns
 */
function determineConversationPhase(messages) {
  const messageCount = messages.length;

  if (messageCount <= 4) {
    return 'opening';
  } else if (messageCount <= 10) {
    return 'exploration';
  } else if (messageCount <= 20) {
    return 'support';
  } else {
    // Check if conversation seems to be wrapping up
    const recentMessages = messages.slice(-3).map(m => m.content.toLowerCase());
    const closingKeywords = ['thank', 'appreciate', 'helpful', 'better', 'goodbye', 'gotta go'];

    const hasClosingSignals = closingKeywords.some(keyword =>
      recentMessages.some(msg => msg.includes(keyword))
    );

    return hasClosingSignals ? 'closing' : 'support';
  }
}

/**
 * Calculate overall conversation quality score
 */
function calculateConversationQuality(messages, sentimentData) {
  let quality = 5; // Start at neutral

  // Factor 1: Message exchange balance
  const userMessages = messages.filter(m => m.role === 'user').length;
  const volunteerMessages = messages.filter(m => m.role === 'volunteer').length;
  const balance = Math.abs(userMessages - volunteerMessages);

  if (balance <= 2) {
    quality += 2; // Good balance
  } else if (balance <= 4) {
    quality += 1; // Okay balance
  } // Poor balance, no points

  // Factor 2: Sentiment trajectory
  if (sentimentData) {
    if (['positive', 'hopeful'].includes(sentimentData.sentiment)) {
      quality += 2;
    } else if (sentimentData.sentiment === 'neutral') {
      quality += 1;
    }
  }

  // Factor 3: Message length appropriateness
  const avgMessageLength = messages.reduce((sum, m) => sum + m.content.length, 0) / messages.length;
  if (avgMessageLength >= 50 && avgMessageLength <= 500) {
    quality += 1; // Good message length
  }

  return Math.min(10, Math.max(1, quality));
}
