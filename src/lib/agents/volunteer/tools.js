import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { ChatOpenAI } from '@langchain/openai';
import { searchBigBookPages } from '@/lib/bigbook/vectorSearch';
import { searchReflections } from '@/lib/vectorSearch';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AGENT TOOLS LIBRARY - COMPREHENSIVE DOCUMENTATION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This file defines "tools" that LLM agents can use to accomplish tasks.
 * Tools extend the capabilities of language models beyond text generation.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHAT ARE TOOLS IN AGENTIC AI?
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Tools are functions that LLMs can call to:
 * 1. Get information from external sources (databases, APIs, search)
 * 2. Perform computations (calculations, scoring, analysis)
 * 3. Take actions (send emails, create records, call other AI models)
 *
 * Without tools: LLM can only generate text based on training data
 * With tools:    LLM can search, compute, analyze, and interact with systems
 *
 * ─────────────────────────────────────────────────────────────────────────
 * HOW TOOLS WORK
 * ─────────────────────────────────────────────────────────────────────────
 *
 * 1. TOOL DEFINITION (this file)
 *    - Define tool with name, description, input schema, and function
 *    - LLM uses name/description to decide when to call it
 *    - Schema validates inputs (type safety via Zod)
 *
 * 2. TOOL BINDING (in node files)
 *    - Attach tools to LLM: model.bindTools([tool1, tool2])
 *    - LLM now knows these capabilities exist
 *
 * 3. TOOL CALLING (automatic by LLM)
 *    - LLM decides a tool is needed
 *    - LLM generates tool call with arguments
 *    - Function executes and returns result
 *    - LLM incorporates result into response
 *
 * Example flow:
 *   User: "What does the Big Book say about resentment?"
 *   → LLM thinks: "I need to search the Big Book"
 *   → LLM calls: searchBigBookTool({ query: "resentment", limit: 3 })
 *   → Tool executes: Vector search, returns passages
 *   → LLM reads results and formulates answer with citations
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DYNAMICSTRUCTUREDTOOL ANATOMY
 * ─────────────────────────────────────────────────────────────────────────
 *
 * new DynamicStructuredTool({
 *   name: 'tool_name',              // Identifier for LLM (use snake_case)
 *   description: '...',              // When/why to use this tool (LLM reads this!)
 *   schema: z.object({ ... }),       // Zod schema for input validation
 *   func: async (inputs) => { ... } // Function that executes
 * })
 *
 * Key points:
 * - name: Should be descriptive and unique
 * - description: Critical! LLM uses this to decide when to call
 * - schema: Type-safe inputs, auto-validated
 * - func: Can be async, can call APIs, databases, other LLMs
 *
 * ─────────────────────────────────────────────────────────────────────────
 * TOOL CATEGORIES IN THIS FILE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * 1. Crisis Detection Tools
 *    - Assess suicide risk and severe distress
 *    - Provide emergency resources
 *
 * 2. Semantic Search Tools
 *    - Search AA Big Book with vector embeddings
 *    - Find relevant daily reflections
 *    - Search AA literature
 *
 * 3. Response Quality Analysis Tools
 *    - Evaluate volunteer responses for coaching
 *    - Provide feedback on empathy and boundaries
 *
 * 4. Conversation Analysis Tools
 *    - Analyze sentiment and emotional state
 *    - Extract topics and themes
 *    - Generate conversation summaries
 *
 * 5. Triage Tools
 *    - Calculate urgency scores
 *    - Determine priority levels
 *
 * ─────────────────────────────────────────────────────────────────────────
 * BEST PRACTICES FOR WRITING TOOLS
 * ─────────────────────────────────────────────────────────────────────────
 *
 * 1. CLEAR DESCRIPTIONS
 *    - Explain WHEN to use the tool
 *    - Explain WHAT the tool does
 *    - Include examples if helpful
 *
 * 2. ROBUST SCHEMAS
 *    - Use .describe() on each field
 *    - Mark optional fields with .optional()
 *    - Provide sensible defaults
 *
 * 3. ERROR HANDLING
 *    - Always wrap in try/catch
 *    - Return meaningful fallback values
 *    - Log errors for debugging
 *
 * 4. RETURN STRUCTURED DATA
 *    - Return objects, not plain strings when possible
 *    - Include metadata (scores, confidence, citations)
 *    - Make it easy for LLM to interpret
 *
 * 5. PERFORMANCE
 *    - Add limits to prevent expensive operations
 *    - Use appropriate models (mini for simple tasks)
 *    - Cache when possible
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CRISIS DETECTION TOOLS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * These tools help identify and respond to crisis situations.
 * They are the highest priority tools in the system - safety first!
 *
 * Design principles:
 * - Conservative: Better to over-detect than miss a crisis
 * - Deterministic: Use temperature=0 for consistent results
 * - Fast: Crisis detection should not add significant latency
 * - Actionable: Always provide clear next steps
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * ─────────────────────────────────────────────────────────────────────────
 * CRISIS ASSESSMENT TOOL
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Uses GPT-4 to analyze messages for crisis indicators.
 *
 * Why use an LLM for this?
 * - Understands context and nuance better than keyword matching
 * - Can detect indirect expressions of suicidal ideation
 * - Considers conversation history for better accuracy
 * - Adapts to different communication styles
 *
 * How it works:
 * 1. Receives message + optional conversation history
 * 2. Calls GPT-4 with detailed crisis detection prompt
 * 3. LLM analyzes for specific indicators (plan, intent, hopelessness, etc.)
 * 4. Returns structured assessment with risk level and actions
 * 5. Falls back to keyword matching if LLM parsing fails
 *
 * Risk levels:
 * - critical: Immediate danger, plan + intent
 * - high: Strong ideation without plan
 * - medium: Significant distress, no immediate plan
 * - low: Mild distress, no crisis indicators
 * - none: No crisis indicators
 *
 * Example inputs/outputs:
 *   Input:  { message: "I can't do this anymore, what's the point" }
 *   Output: { isCrisis: true, riskLevel: "medium", indicators: [...] }
 *
 *   Input:  { message: "Having a rough day but staying sober" }
 *   Output: { isCrisis: false, riskLevel: "none", indicators: [] }
 */
export const crisisAssessmentTool = new DynamicStructuredTool({
  name: 'crisis_assessment',
  description: 'Analyzes a message for crisis indicators including suicidal ideation, self-harm, immediate danger, or severe distress. Returns risk level and recommended actions. USE THIS FIRST when analyzing any new user message.',
  schema: z.object({
    message: z.string().describe('The user message to assess for crisis indicators'),
    conversationHistory: z.array(z.string()).optional().describe('Recent conversation context for better assessment'),
  }),
  func: async ({ message, conversationHistory = [] }) => {
    const model = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0, // Deterministic for crisis detection
    });

    const systemPrompt = `You are a crisis detection specialist. Analyze messages for crisis indicators.

CRISIS INDICATORS:
- Direct statements about suicide or self-harm
- Specific plans or methods mentioned
- Expressions of hopelessness ("I can't go on", "what's the point")
- Goodbye or farewell messages
- Severe substance abuse with dangerous behavior
- Expressions of wanting to disappear or not exist
- Recent loss combined with despair
- Statements about being a burden

RISK LEVELS:
- critical: Immediate danger, suicidal ideation with plan/intent
- high: Strong suicidal ideation without specific plan
- medium: Significant distress, hopelessness, but no immediate plan
- low: Mild distress or struggling but no crisis indicators
- none: No crisis indicators present

Return JSON with:
- isCrisis: boolean
- riskLevel: string
- indicators: array of specific phrases that indicate crisis
- recommendedAction: string describing what volunteer should do`;

    const contextStr = conversationHistory.length > 0
      ? `\n\nRecent conversation:\n${conversationHistory.join('\n')}`
      : '';

    const response = await model.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Analyze this message for crisis indicators:\n\n"${message}"${contextStr}\n\nProvide assessment as JSON.` }
    ]);

    try {
      // Parse JSON from response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          isCrisis: result.isCrisis || false,
          riskLevel: result.riskLevel || 'none',
          indicators: result.indicators || [],
          recommendedAction: result.recommendedAction || 'Continue providing support',
        };
      }
    } catch (e) {
      console.error('Crisis assessment parsing error:', e);
    }

    // Fallback to conservative assessment
    const lowerMessage = message.toLowerCase();
    const criticalKeywords = ['suicide', 'kill myself', 'end my life', 'not worth living'];
    const hasCritical = criticalKeywords.some(keyword => lowerMessage.includes(keyword));

    return {
      isCrisis: hasCritical,
      riskLevel: hasCritical ? 'high' : 'none',
      indicators: hasCritical ? ['Detected concerning language'] : [],
      recommendedAction: hasCritical
        ? 'Alert supervisor immediately and provide crisis resources'
        : 'Continue providing support',
    };
  },
});

/**
 * Emergency Resources Tool
 * Retrieves crisis hotlines and emergency resources
 */
export const emergencyResourcesTool = new DynamicStructuredTool({
  name: 'emergency_resources',
  description: 'Retrieves emergency crisis resources including suicide prevention hotlines and immediate help contacts',
  schema: z.object({
    crisisType: z.string().optional().describe('Type of crisis (suicide, substance, mental health)'),
    location: z.string().optional().describe('User location for localized resources'),
  }),
  func: async ({ crisisType = 'general', location = 'US' }) => {
    // Core crisis resources
    const resources = [
      {
        type: 'suicide_prevention',
        name: '988 Suicide & Crisis Lifeline',
        phone: '988',
        description: '24/7 free and confidential support',
        url: 'https://988lifeline.org',
      },
      {
        type: 'suicide_prevention',
        name: 'Crisis Text Line',
        phone: 'Text HOME to 741741',
        description: 'Free 24/7 crisis support via text',
        url: 'https://www.crisistextline.org',
      },
      {
        type: 'substance_abuse',
        name: 'SAMHSA National Helpline',
        phone: '1-800-662-4357',
        description: 'Substance abuse and mental health referral',
        url: 'https://www.samhsa.gov/find-help/national-helpline',
      },
      {
        type: 'aa_support',
        name: 'AA General Service Office',
        phone: '1-212-870-3400',
        description: 'Alcoholics Anonymous support and meeting information',
        url: 'https://www.aa.org',
      },
    ];

    const recommendedMessage = `I want you to know that help is available right now. Here are some resources you can reach out to immediately:

**988 Suicide & Crisis Lifeline**: Call or text 988
Available 24/7 for free, confidential support

**Crisis Text Line**: Text HOME to 741741
Connect with a crisis counselor via text

These are staffed by trained professionals who can provide immediate support. You don't have to go through this alone.`;

    return {
      hotlines: resources,
      immediateResources: resources.filter(r => r.type === 'suicide_prevention'),
      recommendedMessage,
    };
  },
});

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SEMANTIC SEARCH TOOLS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * These tools use vector embeddings to find relevant content in AA literature.
 *
 * How semantic search works:
 * 1. Text is converted to vector embeddings (arrays of numbers)
 * 2. Similar concepts have similar vectors (cosine similarity)
 * 3. Query is embedded and compared to all stored embeddings
 * 4. Most similar passages are returned with relevance scores
 *
 * Why semantic vs keyword search?
 * - Understands meaning, not just word matching
 * - Finds synonyms and related concepts automatically
 * - "How do I forgive?" matches "making amends" even without word "forgive"
 * - More natural for users, more helpful results
 *
 * Example:
 *   Query: "dealing with anger"
 *   Semantic finds: passages about resentment, inventory, amends
 *   Keyword would miss: content using different terminology
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * ─────────────────────────────────────────────────────────────────────────
 * SEARCH BIG BOOK TOOL
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Searches the AA Big Book using vector embeddings.
 *
 * The Big Book is pre-processed:
 * - Split into meaningful chunks (paragraphs/sections)
 * - Each chunk embedded with OpenAI text-embedding-3-small
 * - Stored in MongoDB with vector index
 * - Metadata includes page, chapter, context
 *
 * Search process:
 * 1. User query is embedded
 * 2. Vector similarity search in MongoDB
 * 3. Results filtered by minimum score (0.75)
 * 4. Top N results returned with excerpts and citations
 *
 * Return format:
 *   [{
 *     type: 'bigbook',
 *     title: 'AA Big Book',
 *     excerpt: 'First 300 chars of passage...',
 *     relevanceScore: 0.87,
 *     citation: 'Page 64',
 *     context: 'This passage discusses acceptance, surrender'
 *   }]
 */
export const searchBigBookTool = new DynamicStructuredTool({
  name: 'semantic_search_bigbook',
  description: 'Searches the AA Big Book for relevant passages using semantic search. Best for finding content related to specific topics, themes, or questions about recovery principles.',
  schema: z.object({
    query: z.string().describe('What to search for in the Big Book (e.g., "dealing with resentment", "step 4 inventory")'),
    limit: z.number().optional().describe('Number of results to return (default 3, max 5)'),
  }),
  func: async ({ query, limit = 3 }) => {
    try {
      const results = await searchBigBookPages(query, {
        limit: Math.min(limit, 5),
        minScore: 0.75,
      });

      return results.map(result => ({
        type: 'bigbook',
        title: result.title || 'AA Big Book',
        excerpt: result.text.substring(0, 300) + '...',
        relevanceScore: result.score,
        citation: result.page ? `Page ${result.page}` : result.chapter || 'Big Book',
        context: `This passage discusses ${extractTopics(result.text).join(', ')}`,
      }));
    } catch (error) {
      console.error('Big Book search error:', error);
      return [];
    }
  },
});

/**
 * Find Reflection Tool
 * Finds relevant daily reflections
 */
export const findReflectionTool = new DynamicStructuredTool({
  name: 'find_reflection',
  description: 'Finds relevant AA daily reflections based on topic, theme, or user need. Good for finding inspirational content related to current challenges.',
  schema: z.object({
    topic: z.string().describe('The topic or theme to find reflections about'),
    limit: z.number().optional().describe('Number of reflections to return (default 2, max 3)'),
  }),
  func: async ({ topic, limit = 2 }) => {
    try {
      const results = await searchReflections(topic, {
        limit: Math.min(limit, 3),
        minScore: 0.75,
      });

      return results.map(result => ({
        type: 'reflection',
        title: result.title || `Reflection ${result.dateKey}`,
        excerpt: result.text.substring(0, 250) + '...',
        relevanceScore: result.score,
        citation: `Daily Reflection ${result.dateKey}`,
        url: `/${result.dateKey}`,
        context: `Relevant for: ${topic}`,
      }));
    } catch (error) {
      console.error('Reflection search error:', error);
      return [];
    }
  },
});

/**
 * Search AA Literature Tool
 * General search across all AA literature
 */
export const searchLiteratureTool = new DynamicStructuredTool({
  name: 'search_literature',
  description: 'Searches across all AA literature including steps, traditions, and recovery resources',
  schema: z.object({
    query: z.string().describe('What to search for in AA literature'),
    category: z.string().optional().describe('Specific category: steps, traditions, concepts'),
  }),
  func: async ({ query, category }) => {
    // This would integrate with your step guides and other literature
    // For now, returning sample structure
    return [{
      type: 'literature',
      title: 'AA Literature Result',
      excerpt: 'Placeholder for literature search integration',
      relevanceScore: 0.8,
      citation: 'AA Literature',
      context: 'Related to recovery principles',
    }];
  },
});

// ============================================================================
// RESPONSE QUALITY ANALYSIS TOOLS
// ============================================================================

/**
 * Analyze Response Quality Tool
 * Evaluates volunteer responses for quality and appropriateness
 */
export const analyzeResponseQualityTool = new DynamicStructuredTool({
  name: 'analyze_response_quality',
  description: 'Analyzes a volunteer response for quality, empathy, appropriateness, and alignment with AA principles. Provides coaching feedback.',
  schema: z.object({
    volunteerResponse: z.string().describe('The volunteer draft response to analyze'),
    userMessage: z.string().describe('The user message being responded to'),
    context: z.string().optional().describe('Additional conversation context'),
  }),
  func: async ({ volunteerResponse, userMessage, context = '' }) => {
    const model = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0.3,
    });

    const systemPrompt = `You are a peer support coach specializing in recovery conversations.

Evaluate the volunteer response based on:

1. EMPATHY (1-10):
   - Active listening demonstrated
   - Validation of feelings
   - Non-judgmental language
   - Emotional attunement

2. QUALITY (1-10):
   - Clear and helpful
   - Appropriate length
   - Stays on topic
   - Actionable if needed

3. APPROPRIATENESS:
   - Maintains boundaries (not giving advice, sharing experience instead)
   - Avoids preaching or lecturing
   - Doesn't minimize user's feelings
   - Reflects AA principles
   - Appropriate for peer support context

Provide:
- Scores (1-10)
- 2-3 specific strengths
- 1-2 gentle improvement suggestions
- Flag any boundary issues

Return as JSON.`;

    const response = await model.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `User said: "${userMessage}"\n\nVolunteer response: "${volunteerResponse}"\n\nContext: ${context}\n\nProvide coaching feedback as JSON.` }
    ]);

    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          qualityScore: result.qualityScore || 7,
          empathyScore: result.empathyScore || 7,
          suggestions: result.suggestions || [],
          strengths: result.strengths || ['Response shows care and support'],
          improvements: result.improvements || [],
          appropriateness: result.appropriateness || {
            maintainsBoundaries: true,
            avoidAdviceGiving: true,
            showsEmpathy: true,
            reflectsAAprinciples: true,
          },
        };
      }
    } catch (e) {
      console.error('Response analysis parsing error:', e);
    }

    // Fallback basic analysis
    return {
      qualityScore: 7,
      empathyScore: 7,
      suggestions: ['Consider sharing a personal experience if appropriate'],
      strengths: ['Response shows care and support'],
      improvements: [],
    };
  },
});

// ============================================================================
// CONVERSATION ANALYSIS TOOLS
// ============================================================================

/**
 * Sentiment Analysis Tool
 * Analyzes emotional sentiment of messages
 */
export const sentimentAnalysisTool = new DynamicStructuredTool({
  name: 'sentiment_analysis',
  description: 'Analyzes the emotional sentiment and tone of messages to understand user emotional state',
  schema: z.object({
    messages: z.array(z.string()).describe('Messages to analyze for sentiment'),
  }),
  func: async ({ messages }) => {
    const model = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.1,
    });

    const combined = messages.join('\n');

    const response = await model.invoke([
      { role: 'system', content: 'Analyze sentiment. Return JSON with: sentiment (positive/neutral/negative/distressed/hopeful), confidence (0-1), emotionalState (brief description)' },
      { role: 'user', content: `Analyze sentiment of these messages:\n\n${combined}` }
    ]);

    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          sentiment: result.sentiment || 'neutral',
          confidence: result.confidence || 0.5,
          emotionalState: result.emotionalState || 'unclear',
        };
      }
    } catch (e) {
      console.error('Sentiment analysis error:', e);
    }

    return {
      sentiment: 'neutral',
      confidence: 0.5,
      emotionalState: 'Processing user state',
    };
  },
});

/**
 * Topic Extraction Tool
 * Extracts main topics and themes from conversation
 */
export const topicExtractionTool = new DynamicStructuredTool({
  name: 'topic_extraction',
  description: 'Extracts main topics, themes, and discussion points from a conversation',
  schema: z.object({
    conversation: z.array(z.string()).describe('Conversation messages to analyze'),
  }),
  func: async ({ conversation }) => {
    const model = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.2,
    });

    const combined = conversation.join('\n');

    const response = await model.invoke([
      { role: 'system', content: 'Extract main topics and themes. Return JSON with: topics (array of 3-5 topics), primaryTheme (main focus)' },
      { role: 'user', content: `Extract topics from this conversation:\n\n${combined}` }
    ]);

    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          topics: result.topics || [],
          primaryTheme: result.primaryTheme || 'General support',
        };
      }
    } catch (e) {
      console.error('Topic extraction error:', e);
    }

    return {
      topics: ['recovery', 'support'],
      primaryTheme: 'General support',
    };
  },
});

/**
 * Generate Summary Tool
 * Creates structured summary of conversation
 */
export const generateSummaryTool = new DynamicStructuredTool({
  name: 'generate_summary',
  description: 'Generates a structured summary of the conversation for volunteer notes and continuity',
  schema: z.object({
    messages: z.array(z.object({
      role: z.string(),
      content: z.string(),
    })).describe('Full conversation messages'),
    analysis: z.object({}).optional().describe('Previous analysis results'),
  }),
  func: async ({ messages, analysis = {} }) => {
    const model = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0.3,
    });

    const conversationText = messages.map(m => `${m.role}: ${m.content}`).join('\n');

    const systemPrompt = `Create a concise conversation summary for volunteer notes.

Include:
1. Brief overview (2-3 sentences)
2. Key topics discussed
3. User's primary concerns or needs
4. Any action items or follow-up needed
5. Volunteer observations

Format as JSON with: summary, keyTopics, userNeeds, actionItems, volunteerNotes`;

    const response = await model.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Summarize this conversation:\n\n${conversationText}` }
    ]);

    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          summary: result.summary || 'Conversation summary',
          keyTopics: result.keyTopics || [],
          actionItems: result.actionItems || [],
          volunteerNotes: result.volunteerNotes || '',
        };
      }
    } catch (e) {
      console.error('Summary generation error:', e);
    }

    return {
      summary: 'Conversation focused on recovery support',
      keyTopics: [],
      actionItems: [],
      volunteerNotes: 'Summary generation pending',
    };
  },
});

// ============================================================================
// TRIAGE TOOLS
// ============================================================================

/**
 * Calculate Urgency Score Tool
 * Determines priority level for support requests
 */
export const calculateUrgencyTool = new DynamicStructuredTool({
  name: 'calculate_urgency_score',
  description: 'Calculates urgency score and priority level for triaging support requests',
  schema: z.object({
    userMessage: z.string().describe('Initial user message'),
    waitTime: z.number().describe('Minutes user has been waiting'),
    previousSessions: z.number().optional().describe('Number of previous support sessions'),
    crisisDetected: z.boolean().optional().describe('Whether crisis was detected'),
  }),
  func: async ({ userMessage, waitTime, previousSessions = 0, crisisDetected = false }) => {
    // Urgency scoring algorithm
    let score = 0;
    const factors = [];

    // Crisis detection (highest priority)
    if (crisisDetected) {
      score += 80;
      factors.push('Crisis indicators detected');
    }

    // Wait time
    if (waitTime > 30) {
      score += 20;
      factors.push('Extended wait time');
    } else if (waitTime > 15) {
      score += 10;
      factors.push('Moderate wait time');
    }

    // Message urgency keywords
    const urgentKeywords = ['urgent', 'emergency', 'crisis', 'immediately', 'help now'];
    const hasUrgent = urgentKeywords.some(kw => userMessage.toLowerCase().includes(kw));
    if (hasUrgent) {
      score += 15;
      factors.push('Urgent language in message');
    }

    // New user bonus (higher priority for first-timers)
    if (previousSessions === 0) {
      score += 10;
      factors.push('First-time user');
    }

    // Determine priority level
    let priority;
    if (score >= 70) priority = 'urgent';
    else if (score >= 50) priority = 'high';
    else if (score >= 30) priority = 'medium';
    else priority = 'low';

    // Estimate duration based on message complexity
    const messageLength = userMessage.length;
    const estimatedDuration = Math.min(45, Math.max(15, messageLength / 20));

    return {
      urgencyScore: Math.min(100, score),
      priority,
      estimatedDuration,
      requiresEscalation: crisisDetected,
      escalationReason: crisisDetected ? 'Crisis indicators present' : undefined,
      factors,
    };
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract topics from text (simple keyword extraction)
 */
function extractTopics(text) {
  const commonTopics = [
    'acceptance', 'amends', 'anger', 'anxiety', 'depression', 'faith',
    'fear', 'forgiveness', 'gratitude', 'higher power', 'honesty',
    'hope', 'humility', 'inventory', 'meetings', 'meditation', 'prayer',
    'resentment', 'service', 'serenity', 'sobriety', 'sponsorship', 'steps',
    'surrender', 'willingness'
  ];

  const lowerText = text.toLowerCase();
  const found = commonTopics.filter(topic => lowerText.includes(topic));

  return found.length > 0 ? found.slice(0, 3) : ['recovery'];
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EXPORT ALL TOOLS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * All tools are exported both individually (for selective binding) and as
 * an array (for convenience).
 *
 * Usage in agent nodes:
 *
 *   // Option 1: Bind specific tools to an agent
 *   import { crisisAssessmentTool, searchBigBookTool } from './tools';
 *   const model = new ChatOpenAI({ modelName: 'gpt-4o' });
 *   const modelWithTools = model.bindTools([
 *     crisisAssessmentTool,
 *     searchBigBookTool
 *   ]);
 *
 *   // Option 2: Bind all tools
 *   import { allTools } from './tools';
 *   const modelWithAllTools = model.bindTools(allTools);
 *
 * Best practice: Only bind tools that are relevant to the agent's purpose.
 * This improves:
 * - Performance (fewer options for LLM to consider)
 * - Accuracy (less confusion about which tool to use)
 * - Cost (fewer tokens in tool descriptions)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const allTools = [
  crisisAssessmentTool,
  emergencyResourcesTool,
  searchBigBookTool,
  findReflectionTool,
  searchLiteratureTool,
  analyzeResponseQualityTool,
  sentimentAnalysisTool,
  topicExtractionTool,
  generateSummaryTool,
  calculateUrgencyTool,
];

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TOOL DEVELOPMENT GUIDE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Want to add a new tool? Follow this checklist:
 *
 * 1. DEFINE THE TOOL
 *    ```javascript
 *    export const myNewTool = new DynamicStructuredTool({
 *      name: 'my_tool_name',           // Snake case, descriptive
 *      description: 'Clear explanation of when/why to use this',
 *      schema: z.object({
 *        param1: z.string().describe('What this param is for'),
 *        param2: z.number().optional().describe('Optional param'),
 *      }),
 *      func: async ({ param1, param2 }) => {
 *        // Implementation
 *        return { result: 'something' };
 *      }
 *    });
 *    ```
 *
 * 2. ADD ERROR HANDLING
 *    - Wrap func in try/catch
 *    - Return fallback values on error
 *    - Log errors for debugging
 *
 * 3. TEST THE TOOL
 *    - Test with valid inputs
 *    - Test with edge cases
 *    - Test error scenarios
 *    - Verify LLM can call it correctly
 *
 * 4. ADD TO EXPORTS
 *    - Export individually
 *    - Add to allTools array
 *
 * 5. BIND TO AGENTS
 *    - Go to relevant node file (e.g., nodes/resourceRecommendation.js)
 *    - Import your tool
 *    - Add to model.bindTools([...])
 *
 * 6. DOCUMENT
 *    - Add JSDoc comments
 *    - Include usage examples
 *    - Explain return format
 *
 * 7. MONITOR
 *    - Check agent metrics dashboard
 *    - Monitor tool call frequency
 *    - Watch for errors in logs
 *
 * ─────────────────────────────────────────────────────────────────────────
 * COMMON TOOL PATTERNS
 * ─────────────────────────────────────────────────────────────────────────
 *
 * LLM-BASED ANALYSIS:
 *   - Call another LLM within the tool
 *   - Use for complex reasoning tasks
 *   - Example: crisisAssessmentTool, sentimentAnalysisTool
 *
 * DATABASE QUERIES:
 *   - Search or retrieve data
 *   - Use for finding information
 *   - Example: searchBigBookTool, findReflectionTool
 *
 * COMPUTATIONS:
 *   - Calculate scores or metrics
 *   - Use for deterministic logic
 *   - Example: calculateUrgencyTool
 *
 * EXTERNAL APIs:
 *   - Call third-party services
 *   - Use for real-time data
 *   - Example: (not in this file, but common pattern)
 *
 * HYBRID:
 *   - Combine multiple approaches
 *   - Use for complex tasks
 *   - Example: analyzeResponseQualityTool (LLM + scoring logic)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * END OF TOOLS LIBRARY
 * ═══════════════════════════════════════════════════════════════════════════
 */
