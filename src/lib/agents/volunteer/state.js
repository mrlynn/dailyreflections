import { z } from 'zod';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AGENT STATE SCHEMAS - COMPREHENSIVE DOCUMENTATION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This file defines the TYPE-SAFE state schema using Zod for the volunteer
 * support agent system. State is the data that flows through the agent graph.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY ZOD FOR STATE MANAGEMENT?
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Zod provides:
 * 1. RUNTIME VALIDATION
 *    - Catches type errors at runtime, not just compile time
 *    - Validates data shape before it enters the graph
 *    - Prevents "undefined is not a function" errors
 *
 * 2. TYPE INFERENCE
 *    - TypeScript types automatically derived from schema
 *    - No need to write types twice
 *    - Types stay in sync with validation
 *
 * 3. SCHEMA COMPOSITION
 *    - Build complex schemas from simple ones
 *    - Reuse schemas across different parts of app
 *    - Extend and transform schemas easily
 *
 * 4. CLEAR CONTRACTS
 *    - Schema documents expected data structure
 *    - Serves as API contract between agents
 *    - Makes refactoring safer
 *
 * ─────────────────────────────────────────────────────────────────────────
 * STATE FLOW IN THE GRAPH
 * ─────────────────────────────────────────────────────────────────────────
 *
 * 1. Initial State Created
 *    - createInitialState() builds starting state
 *    - Contains conversation ID, messages, user input
 *
 * 2. State Flows to First Node (Supervisor)
 *    - Supervisor receives state, analyzes it
 *    - Adds nextAction to state
 *    - Returns updated state
 *
 * 3. State Flows to Specialized Agents
 *    - Each agent receives current state
 *    - Agent does work, updates relevant field
 *    - Example: Crisis agent adds crisisDetection to state
 *    - Returns state with new data
 *
 * 4. State Returns to Supervisor
 *    - Supervisor sees all accumulated data
 *    - Makes next routing decision
 *    - Cycle continues until nextAction = 'complete'
 *
 * 5. Final State Returned
 *    - Contains results from all agents that ran
 *    - Execution path shows which agents ran
 *    - Timing data shows performance
 *
 * Example state evolution:
 *   Start:      { conversationId, messages, latestUserMessage }
 *   → Crisis:   + { crisisDetection: { isCrisis: false, ... } }
 *   → Resource: + { resourceSuggestions: [...] }
 *   → Complete: + { processingEndTime, agentExecutionPath: [...] }
 *
 * ─────────────────────────────────────────────────────────────────────────
 * SCHEMA ORGANIZATION
 * ─────────────────────────────────────────────────────────────────────────
 *
 * We define schemas in layers:
 * 1. Primitive schemas (Message, CrisisDetection, etc.)
 * 2. Main state schema (ConversationStateSchema)
 * 3. Helper functions (createInitialState, validateState)
 * 4. TypeScript type exports
 *
 * This bottom-up approach makes schemas:
 * - Easier to understand
 * - Easier to test
 * - Easier to reuse
 * - Easier to modify
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * ─────────────────────────────────────────────────────────────────────────
 * MESSAGE SCHEMA
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Represents a single message in the conversation.
 *
 * Fields:
 * - role: Who sent the message (user, volunteer, or system)
 * - content: The message text
 * - timestamp: When the message was sent
 *
 * Used in:
 * - messages array in main state
 * - Conversation analysis
 * - Sentiment tracking over time
 */
const MessageSchema = z.object({
  role: z.enum(['user', 'volunteer', 'system']),
  content: z.string(),
  timestamp: z.date(),
});

// Crisis detection result schema
const CrisisDetectionSchema = z.object({
  isCrisis: z.boolean(),
  riskLevel: z.enum(['none', 'low', 'medium', 'high', 'critical']),
  indicators: z.array(z.string()),
  recommendedAction: z.string(),
  emergencyResources: z.array(z.object({
    type: z.string(),
    name: z.string(),
    phone: z.string().optional(),
    url: z.string().optional(),
  })).optional(),
});

// Resource suggestion schema
const ResourceSuggestionSchema = z.object({
  type: z.enum(['bigbook', 'reflection', 'step', 'resource', 'literature']),
  title: z.string(),
  excerpt: z.string(),
  relevanceScore: z.number(),
  citation: z.string(),
  url: z.string().optional(),
  context: z.string().optional(), // Why this resource is relevant
});

// Response coaching result schema
const ResponseCoachingSchema = z.object({
  qualityScore: z.number().min(1).max(10),
  empathyScore: z.number().min(1).max(10),
  suggestions: z.array(z.string()),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  appropriateness: z.object({
    maintainsBoundaries: z.boolean(),
    avoidAdviceGiving: z.boolean(),
    showsEmpathy: z.boolean(),
    reflectsAAprinciples: z.boolean(),
  }).optional(),
});

// Conversation analysis schema
const ConversationAnalysisSchema = z.object({
  sentiment: z.enum(['positive', 'neutral', 'negative', 'distressed', 'hopeful']),
  sentimentScore: z.number().min(-1).max(1).optional(),
  topics: z.array(z.string()),
  userEmotionalState: z.string(),
  conversationPhase: z.enum(['opening', 'exploration', 'support', 'closing']),
  keyThemes: z.array(z.string()).optional(),
  conversationQuality: z.number().min(1).max(10).optional(),
});

// Triage information schema
const TriageInfoSchema = z.object({
  urgencyScore: z.number().min(0).max(100),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  estimatedDuration: z.number(), // minutes
  requiresEscalation: z.boolean(),
  escalationReason: z.string().optional(),
  waitTime: z.number().optional(), // minutes user has been waiting
  factors: z.array(z.string()).optional(),
});

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MAIN CONVERSATION STATE SCHEMA
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This is the complete state object that flows through the agent graph.
 * Every node receives this state and can update any field.
 *
 * State is organized into logical groups:
 * 1. IDENTIFIERS - Who and what this conversation is about
 * 2. INPUTS - Data provided when graph starts
 * 3. AGENT OUTPUTS - Results from each specialized agent
 * 4. ROUTING - Control flow information
 * 5. METADATA - Timing, tracking, debugging
 *
 * All fields except identifiers and messages are optional because:
 * - Initial state may not have all data
 * - Not all agents run in every execution
 * - Allows for partial updates
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const ConversationStateSchema = z.object({
  // ───────────────────────────────────────────────────────────────────────
  // IDENTIFIERS: Required fields that identify the conversation
  // ───────────────────────────────────────────────────────────────────────
  conversationId: z.string(),   // Unique ID for this conversation
  volunteerId: z.string(),      // ID of volunteer providing support
  userId: z.string(),           // ID of user seeking support

  // ───────────────────────────────────────────────────────────────────────
  // INPUTS: Data provided when starting the graph
  // ───────────────────────────────────────────────────────────────────────
  messages: z.array(MessageSchema),                    // Full conversation history
  latestUserMessage: z.string().optional(),            // Most recent user message (for quick access)
  volunteerDraft: z.string().optional(),               // Draft response from volunteer (for coaching)
  waitTime: z.number().optional(),                     // Minutes user has been waiting (for triage)

  // ───────────────────────────────────────────────────────────────────────
  // AGENT OUTPUTS: Results from specialized agents
  // ───────────────────────────────────────────────────────────────────────
  // Each agent populates its own field. Optional because not all agents
  // run in every execution.

  crisisDetection: CrisisDetectionSchema.optional(),           // From crisis detection agent
  resourceSuggestions: z.array(ResourceSuggestionSchema).optional(),  // From resource recommendation agent
  responseCoaching: ResponseCoachingSchema.optional(),         // From response coach agent
  conversationAnalysis: ConversationAnalysisSchema.optional(), // From conversation analyst agent
  triageInfo: TriageInfoSchema.optional(),                     // From triage agent

  // ───────────────────────────────────────────────────────────────────────
  // ROUTING: Supervisor's decision about what to do next
  // ───────────────────────────────────────────────────────────────────────
  nextAction: z.enum([
    'crisis_check',           // Run crisis detection
    'resource_search',        // Search for resources
    'coach_response',         // Coach volunteer's response
    'analyze_conversation',   // Analyze conversation patterns
    'triage',                 // Determine priority/urgency
    'complete'                // Finish execution
  ]).optional(),

  // ───────────────────────────────────────────────────────────────────────
  // SUMMARY: Human-readable summary of all findings
  // ───────────────────────────────────────────────────────────────────────
  summary: z.string().optional(),  // Generated summary for volunteer notes

  // ───────────────────────────────────────────────────────────────────────
  // METADATA: Timing and execution tracking
  // ───────────────────────────────────────────────────────────────────────
  processingStartTime: z.date().optional(),      // When graph execution started
  processingEndTime: z.date().optional(),        // When graph execution completed
  agentExecutionPath: z.array(z.string()).optional(),  // Which agents ran, in order
  // Example: ['supervisor', 'crisis_check', 'supervisor', 'resource_search', 'supervisor']
});

// Type exports commented out - this is a JavaScript file, not TypeScript
// If using TypeScript, these would be:
// export type ConversationState = z.infer<typeof ConversationStateSchema>;
// export type Message = z.infer<typeof MessageSchema>;
// export type CrisisDetection = z.infer<typeof CrisisDetectionSchema>;
// export type ResourceSuggestion = z.infer<typeof ResourceSuggestionSchema>;
// export type ResponseCoaching = z.infer<typeof ResponseCoachingSchema>;
// export type ConversationAnalysis = z.infer<typeof ConversationAnalysisSchema>;
// export type TriageInfo = z.infer<typeof TriageInfoSchema>;

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HELPER FUNCTIONS
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * ─────────────────────────────────────────────────────────────────────────
 * CREATE INITIAL STATE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Factory function to create the initial state for a new graph execution.
 *
 * Why use a factory function?
 * - Ensures all required fields are present
 * - Provides sensible defaults
 * - Initializes metadata (timestamps, execution path)
 * - Documents what data is needed to start the graph
 *
 * Usage:
 *   const initialState = createInitialState({
 *     conversationId: '123',
 *     volunteerId: 'vol_456',
 *     userId: 'user_789',
 *     messages: conversationHistory,
 *     latestUserMessage: 'I need help with cravings',
 *     waitTime: 5
 *   });
 *
 *   const result = await runVolunteerSupport(initialState);
 *
 * @param {Object} params - Parameters for initial state
 * @param {string} params.conversationId - Unique conversation ID
 * @param {string} params.volunteerId - ID of volunteer
 * @param {string} params.userId - ID of user
 * @param {Array} params.messages - Conversation history
 * @param {string} [params.latestUserMessage] - Most recent user message
 * @param {string} [params.volunteerDraft] - Draft response to analyze
 * @param {number} [params.waitTime] - Minutes user has waited
 * @returns {Object} Initial state ready for graph execution
 */
export function createInitialState(params) {
  return {
    // Required identifiers
    conversationId: params.conversationId,
    volunteerId: params.volunteerId,
    userId: params.userId,

    // Conversation data
    messages: params.messages || [],
    latestUserMessage: params.latestUserMessage,
    volunteerDraft: params.volunteerDraft,
    waitTime: params.waitTime,

    // Initialize metadata
    processingStartTime: new Date(),
    agentExecutionPath: [],

    // Agent outputs will be populated as graph executes
    // No need to initialize them - they're optional in schema
  };
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * VALIDATE STATE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Validates a state object against the ConversationStateSchema.
 *
 * When to use:
 * - Before passing state to graph (safety check)
 * - In tests to verify state structure
 * - When debugging state issues
 * - After receiving state from external sources
 *
 * Returns:
 *   Success: { valid: true }
 *   Failure: { valid: false, errors: [...] }
 *
 * Usage:
 *   const validation = validateState(myState);
 *   if (!validation.valid) {
 *     console.error('Invalid state:', validation.errors);
 *     // Handle error
 *   }
 *
 * Note: Graph automatically validates state at boundaries,
 * so explicit validation is usually not needed. This function
 * is mainly for testing and debugging.
 *
 * @param {Object} state - State to validate
 * @returns {Object} Validation result with valid flag and optional errors
 */
export function validateState(state) {
  try {
    ConversationStateSchema.parse(state);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      errors: error.errors  // Zod provides detailed error information
    };
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EXTENDING THE STATE SCHEMA
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Need to add new fields to state? Follow this process:
 *
 * 1. ADD TO SCHEMA
 *    - Add field to ConversationStateSchema
 *    - Mark as .optional() unless always present
 *    - Add inline comment explaining purpose
 *
 * 2. CREATE SUB-SCHEMA IF COMPLEX
 *    - If field has structure, define schema above main schema
 *    - Example: CrisisDetectionSchema, ResourceSuggestionSchema
 *    - Keeps schemas readable and testable
 *
 * 3. UPDATE GRAPH CHANNELS
 *    - Go to graph.js
 *    - Add matching channel in graphState
 *    - Define reducer function (usually replace strategy)
 *
 * 4. UPDATE NODES
 *    - Modify relevant nodes to populate new field
 *    - Return object with new field in updates
 *
 * 5. EXPORT TYPE
 *    - Add type export if using TypeScript
 *    - export type MyNewField = z.infer<typeof MyNewFieldSchema>
 *
 * 6. TEST
 *    - Verify field flows through graph correctly
 *    - Test validation with valid/invalid data
 *    - Check type safety in IDE
 *
 * Example adding a new field:
 *
 *   // 1. Define schema
 *   const UserFeedbackSchema = z.object({
 *     rating: z.number().min(1).max(5),
 *     comment: z.string().optional(),
 *     timestamp: z.date(),
 *   });
 *
 *   // 2. Add to main schema
 *   export const ConversationStateSchema = z.object({
 *     // ... existing fields ...
 *     userFeedback: UserFeedbackSchema.optional(),
 *   });
 *
 *   // 3. Export type
 *   export type UserFeedback = z.infer<typeof UserFeedbackSchema>;
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * END OF STATE SCHEMA DEFINITIONS
 * ═══════════════════════════════════════════════════════════════════════════
 */
