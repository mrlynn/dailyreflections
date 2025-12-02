import { ChatOpenAI } from '@langchain/openai';
import { searchBigBookTool, findReflectionTool, searchLiteratureTool } from '../tools';

/**
 * Resource Recommendation Agent Node
 *
 * This agent finds relevant AA literature and resources based on:
 * - User's current challenges or questions
 * - Topics discussed in the conversation
 * - Emotional state and needs
 *
 * It uses semantic search across:
 * - AA Big Book
 * - Daily Reflections
 * - Step guides and other literature
 */

export async function resourceRecommendationNode(state) {
  console.log('📚 Resource Recommendation Agent: Starting search...');

  // Track execution
  const executionPath = state.agentExecutionPath || [];
  executionPath.push('resource_recommendation');

  // If no message to analyze, skip
  if (!state.latestUserMessage) {
    console.log('⚠️ Resource Recommendation Agent: No message to analyze, skipping...');
    return {
      ...state,
      agentExecutionPath: executionPath,
      resourceSuggestions: [],
      nextAction: state.volunteerDraft ? 'coach_response' : 'analyze_conversation',
    };
  }

  try {
    // Initialize the LLM with resource search tools
    const model = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0.3,
    });

    // Prepare conversation context
    const recentMessages = state.messages
      .slice(-5)
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    const systemPrompt = `You are a resource recommendation specialist for AA peer support.

Your role is to identify relevant AA literature and resources that can help the user.

AVAILABLE TOOLS:
1. semantic_search_bigbook - Search the AA Big Book for relevant passages
2. find_reflection - Find relevant daily reflections
3. search_literature - Search other AA literature (steps, traditions)

GUIDELINES:
- Identify the user's current challenge, question, or need
- Find 2-3 most relevant resources using the tools
- Prioritize practical, actionable content
- Consider the user's emotional state
- Match resources to their specific situation

TOPICS TO LOOK FOR:
- Steps (if discussing step work)
- Acceptance, gratitude, serenity
- Dealing with resentments, fear, anger
- Higher Power, faith, spirituality
- Amends, forgiveness
- Meetings, fellowship, service
- Early recovery, relapse prevention

Use the search tools to find helpful resources.`;

    const userPrompt = `Find relevant AA resources for this conversation:

LATEST USER MESSAGE: "${state.latestUserMessage}"

RECENT CONVERSATION:
${recentMessages}

${state.conversationAnalysis ? `
CONVERSATION ANALYSIS:
- Sentiment: ${state.conversationAnalysis.sentiment}
- Topics: ${state.conversationAnalysis.topics?.join(', ') || 'Unknown'}
- User emotional state: ${state.conversationAnalysis.userEmotionalState}
` : ''}

Use the search tools to find 2-3 relevant resources that would be helpful.`;

    // Bind tools to the model
    const modelWithTools = model.bindTools([
      searchBigBookTool,
      findReflectionTool,
      searchLiteratureTool,
    ]);

    // Invoke the model
    const response = await modelWithTools.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    console.log('🔍 Resource Recommendation: Model response received');

    // Execute tool calls and collect resources
    const resources = [];

    if (response.tool_calls && response.tool_calls.length > 0) {
      for (const toolCall of response.tool_calls) {
        console.log(`🔧 Resource Recommendation: Executing tool - ${toolCall.name}`);

        try {
          let toolResults;

          if (toolCall.name === 'semantic_search_bigbook') {
            toolResults = await searchBigBookTool.func(toolCall.args);
          } else if (toolCall.name === 'find_reflection') {
            toolResults = await findReflectionTool.func(toolCall.args);
          } else if (toolCall.name === 'search_literature') {
            toolResults = await searchLiteratureTool.func(toolCall.args);
          }

          if (toolResults && Array.isArray(toolResults)) {
            resources.push(...toolResults);
            console.log(`✅ Found ${toolResults.length} resources from ${toolCall.name}`);
          }
        } catch (toolError) {
          console.error(`❌ Error executing ${toolCall.name}:`, toolError);
        }
      }
    }

    // If no resources found via tools, try to at least search Big Book
    if (resources.length === 0) {
      console.log('⚠️ No resources from tools, performing fallback search...');

      try {
        // Extract key topics from the message
        const topics = extractKeyTopics(state.latestUserMessage);
        console.log(`📋 Extracted topics: ${topics.join(', ')}`);

        if (topics.length > 0) {
          const fallbackResults = await searchBigBookTool.func({
            query: topics[0],
            limit: 2,
          });

          if (fallbackResults && fallbackResults.length > 0) {
            resources.push(...fallbackResults);
            console.log(`✅ Fallback search found ${fallbackResults.length} resources`);
          }
        }
      } catch (fallbackError) {
        console.error('❌ Fallback search failed:', fallbackError);
      }
    }

    // Sort by relevance and take top 3
    const sortedResources = resources
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, 3);

    console.log(`📚 Resource Recommendation complete: ${sortedResources.length} resources found`);

    // Determine next action
    const nextAction = state.volunteerDraft ? 'coach_response' : 'analyze_conversation';

    return {
      ...state,
      resourceSuggestions: sortedResources,
      agentExecutionPath: executionPath,
      nextAction,
    };

  } catch (error) {
    console.error('❌ Resource Recommendation Agent Error:', error);

    return {
      ...state,
      resourceSuggestions: [],
      agentExecutionPath: executionPath,
      nextAction: state.volunteerDraft ? 'coach_response' : 'analyze_conversation',
    };
  }
}

/**
 * Helper function to extract key topics from a message
 */
function extractKeyTopics(message) {
  const lowerMessage = message.toLowerCase();

  const topicKeywords = {
    acceptance: ['accept', 'acceptance', 'serenity'],
    gratitude: ['grateful', 'gratitude', 'thankful', 'appreciation'],
    fear: ['afraid', 'fear', 'scared', 'anxious', 'anxiety', 'worry'],
    anger: ['angry', 'anger', 'resentment', 'mad', 'furious'],
    forgiveness: ['forgive', 'forgiveness', 'amends'],
    higher_power: ['god', 'higher power', 'faith', 'spiritual', 'prayer', 'meditation'],
    steps: ['step ', 'steps', 'inventory', '4th step', 'fifth step'],
    meetings: ['meeting', 'fellowship', 'sponsor', 'group'],
    relapse: ['relapse', 'slip', 'drank', 'using', 'cravings'],
    hope: ['hope', 'hopeful', 'hopeless', 'better'],
    shame: ['shame', 'ashamed', 'guilt', 'guilty'],
    loneliness: ['alone', 'lonely', 'isolated', 'isolation'],
  };

  const foundTopics = [];

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      foundTopics.push(topic);
    }
  }

  // If no specific topics found, use general recovery terms
  if (foundTopics.length === 0) {
    foundTopics.push('recovery', 'sobriety');
  }

  return foundTopics;
}
