import { StateGraph, END } from '@langchain/langgraph';
import { supervisorNode } from './nodes/supervisor';
import { crisisDetectionNode } from './nodes/crisisDetection';
import { resourceRecommendationNode } from './nodes/resourceRecommendation';
import { responseCoachNode } from './nodes/responseCoach';
import { conversationAnalystNode } from './nodes/conversationAnalyst';
import { triageNode } from './nodes/triage';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VOLUNTEER SUPPORT AGENT GRAPH - COMPREHENSIVE DOCUMENTATION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This file implements a multi-agent system using LangGraph for coordinating
 * volunteer support in recovery conversations. It demonstrates best practices
 * for building agentic AI systems.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHAT IS AGENTIC AI?
 * ─────────────────────────────────────────────────────────────────────────
 * Agentic AI refers to AI systems that:
 * 1. Have autonomy to make decisions about which actions to take
 * 2. Use tools to accomplish tasks (function calling)
 * 3. Maintain state across multiple steps
 * 4. Can route between different specialized capabilities
 * 5. Work towards goals through multi-step reasoning
 *
 * Traditional AI: User → LLM → Response (single step)
 * Agentic AI:     User → [Agent1 → Agent2 → Agent3...] → Response (multi-step)
 *
 * ─────────────────────────────────────────────────────────────────────────
 * KEY CONCEPTS IN THIS IMPLEMENTATION
 * ─────────────────────────────────────────────────────────────────────────
 *
 * 1. STATE GRAPH (LangGraph)
 *    - A directed graph where nodes are functions that process state
 *    - State flows through the graph, being modified at each node
 *    - Think of it like a workflow with decision points
 *
 * 2. NODES
 *    - Functions that receive state, do work, and return updated state
 *    - Each node is a specialized agent with specific capabilities
 *    - Nodes can call LLMs, use tools, or perform computations
 *
 * 3. EDGES
 *    - Connections between nodes that determine execution flow
 *    - Regular edges: Always go from A → B
 *    - Conditional edges: Route based on state (if/else logic)
 *
 * 4. CHANNELS (State Schema)
 *    - Define what data exists in the state
 *    - Specify how updates are merged (replace, append, custom)
 *    - Type-safe through Zod schemas (see state.js)
 *
 * 5. SUPERVISOR PATTERN
 *    - Central coordinator that decides which agent to run next
 *    - Analyzes current state and routes to appropriate specialist
 *    - Prevents infinite loops and ensures task completion
 *
 * 6. TOOLS
 *    - Functions that agents can call to accomplish tasks
 *    - Examples: search databases, assess risk, analyze sentiment
 *    - Defined with schemas so LLMs know when/how to use them
 *
 * ─────────────────────────────────────────────────────────────────────────
 * GRAPH STRUCTURE (VISUAL)
 * ─────────────────────────────────────────────────────────────────────────
 *
 *                           ┌─────────────┐
 *                           │   START     │
 *                           └──────┬──────┘
 *                                  │
 *                                  ▼
 *                          ┌───────────────┐
 *                    ┌────►│  SUPERVISOR   │◄────┐
 *                    │     └───────┬───────┘     │
 *                    │             │             │
 *                    │    ┌────────┴────────┐    │
 *                    │    │                 │    │
 *                    │    ▼                 ▼    │
 *                    │  ┌──────────┐   ┌─────────────┐
 *                    └──┤  CRISIS  │   │  RESOURCE   │──┐
 *                       │  CHECK   │   │   SEARCH    │  │
 *                       └──────────┘   └─────────────┘  │
 *                            │                │          │
 *                            │                ▼          │
 *                            │         ┌─────────────┐   │
 *                            │         │  RESPONSE   │   │
 *                            └────────►│   COACH     │───┤
 *                                      └─────────────┘   │
 *                                             │          │
 *                                             ▼          │
 *                                      ┌─────────────┐   │
 *                                      │ CONVERSATION│   │
 *                                      │  ANALYST    │───┤
 *                                      └─────────────┘   │
 *                                             │          │
 *                                             ▼          │
 *                                      ┌─────────────┐   │
 *                                      │   TRIAGE    │───┘
 *                                      └─────────────┘
 *                                             │
 *                                             ▼
 *                                        ┌───────┐
 *                                        │  END  │
 *                                        └───────┘
 *
 * ─────────────────────────────────────────────────────────────────────────
 * EXECUTION FLOW EXAMPLE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * User Message: "I've been struggling with cravings lately and feel alone"
 *
 * 1. SUPERVISOR analyzes state
 *    → Decision: "Crisis check first (safety protocol)"
 *    → nextAction = 'crisis_check'
 *
 * 2. CRISIS DETECTION runs
 *    → Uses GPT-4 to assess suicide risk
 *    → Calls crisis assessment tool
 *    → Result: Low risk (no crisis indicators)
 *    → Returns to SUPERVISOR
 *
 * 3. SUPERVISOR analyzes updated state
 *    → Decision: "User needs resources about cravings"
 *    → nextAction = 'resource_search'
 *
 * 4. RESOURCE SEARCH runs
 *    → Vector search in Big Book for "cravings"
 *    → Finds relevant passages from chapters
 *    → Updates state with suggestions
 *    → Returns to SUPERVISOR
 *
 * 5. SUPERVISOR analyzes updated state
 *    → Decision: "All analysis complete"
 *    → nextAction = 'complete'
 *
 * 6. Graph ends, returns final state to API
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY THIS ARCHITECTURE?
 * ─────────────────────────────────────────────────────────────────────────
 *
 * ✓ SAFETY: Crisis detection always runs first
 * ✓ MODULARITY: Each agent has one clear responsibility
 * ✓ TESTABILITY: Can test each node independently
 * ✓ OBSERVABILITY: Execution path tracked in agentExecutionPath
 * ✓ FLEXIBILITY: Easy to add new agents or change routing
 * ✓ COST OPTIMIZATION: Only run agents that are needed
 * ✓ QUALITY: Specialized agents outperform one "do everything" agent
 *
 * ─────────────────────────────────────────────────────────────────────────
 * LEARNING RESOURCES
 * ─────────────────────────────────────────────────────────────────────────
 *
 * - LangGraph Docs: https://langchain-ai.github.io/langgraph/
 * - StateGraph Tutorial: https://langchain-ai.github.io/langgraph/tutorials/
 * - Our Technical Docs: /docs/AGENTIC_AI_TECHNICAL_ARCHITECTURE.md
 * - Supervisor Pattern: https://langchain-ai.github.io/langgraph/tutorials/multi_agent/agent_supervisor/
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

console.log('🏗️ Building Volunteer Support Agent Graph...');

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * STATE CHANNELS DEFINITION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * State channels define the "state schema" - what data flows through the graph.
 * Each channel has:
 * - value: A reducer function that determines how updates are merged
 * - default: Factory function that provides initial value
 *
 * ─────────────────────────────────────────────────────────────────────────
 * CHANNEL UPDATE STRATEGIES
 * ─────────────────────────────────────────────────────────────────────────
 *
 * 1. REPLACE (y ?? x)
 *    - If new value exists, use it; otherwise keep old value
 *    - Example: conversationId, nextAction
 *    - Usage: Fields that should be overwritten with latest value
 *
 * 2. ACCUMULATE ([...x, ...y])
 *    - Append new values to existing array
 *    - Example: agentExecutionPath
 *    - Usage: Fields that build up over time (logs, paths, events)
 *
 * 3. CUSTOM LOGIC
 *    - Any custom merge strategy you need
 *    - Example: Could merge objects, deduplicate arrays, etc.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * STATE ORGANIZATION
 * ─────────────────────────────────────────────────────────────────────────
 *
 * We organize state into logical groups:
 * - Identifiers: Who/what this conversation is about
 * - Inputs: Data provided to start the graph
 * - Agent Outputs: Results from each specialized agent
 * - Routing: Control flow information
 * - Metadata: Timing, tracking, debugging info
 *
 * This organization makes it easy to understand what data exists and
 * where it comes from.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

// Define the state channels (what data flows through the graph)
const graphState = {
  // ─────────────────────────────────────────────────────────────────────────
  // IDENTIFIERS: Core conversation/user metadata
  // ─────────────────────────────────────────────────────────────────────────
  conversationId: {
    value: (x, y) => y ?? x, // Replace with new value if provided
    default: () => null,
  },
  volunteerId: {
    value: (x, y) => y ?? x,
    default: () => null,
  },
  userId: {
    value: (x, y) => y ?? x,
    default: () => null,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // INPUTS: Data provided when graph starts
  // ─────────────────────────────────────────────────────────────────────────
  messages: {
    value: (x, y) => y ?? x, // Full conversation history
    default: () => [],
  },
  latestUserMessage: {
    value: (x, y) => y ?? x, // Most recent message from user
    default: () => null,
  },
  volunteerDraft: {
    value: (x, y) => y ?? x, // Draft response being analyzed
    default: () => null,
  },
  waitTime: {
    value: (x, y) => y ?? x, // How long user has been waiting
    default: () => 0,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // AGENT OUTPUTS: Results from each specialized agent
  // ─────────────────────────────────────────────────────────────────────────
  // Each agent writes its results to its own channel. This keeps outputs
  // organized and allows the supervisor to see what work has been done.

  crisisDetection: {
    value: (x, y) => y ?? x, // { isCrisis, riskLevel, indicators, ... }
    default: () => null,
  },
  resourceSuggestions: {
    value: (x, y) => y ?? x, // [{ title, content, page, source }, ...]
    default: () => null,
  },
  responseCoaching: {
    value: (x, y) => y ?? x, // { score, suggestions, strengths, ... }
    default: () => null,
  },
  conversationAnalysis: {
    value: (x, y) => y ?? x, // { topics, sentiment, summary, ... }
    default: () => null,
  },
  triageInfo: {
    value: (x, y) => y ?? x, // { urgency, priority, recommendedAction, ... }
    default: () => null,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ROUTING: Control flow decisions
  // ─────────────────────────────────────────────────────────────────────────
  nextAction: {
    value: (x, y) => y ?? x, // What agent should run next
    default: () => null,     // Values: 'crisis_check', 'resource_search', 'complete', etc.
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SUMMARY: Final consolidated results
  // ─────────────────────────────────────────────────────────────────────────
  summary: {
    value: (x, y) => y ?? x, // Human-readable summary of all findings
    default: () => null,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // METADATA: Observability and debugging
  // ─────────────────────────────────────────────────────────────────────────
  processingStartTime: {
    value: (x, y) => y ?? x,
    default: () => new Date(),
  },
  processingEndTime: {
    value: (x, y) => y ?? x,
    default: () => null,
  },
  agentExecutionPath: {
    // ACCUMULATE strategy: Build up array of agent names as they execute
    // Example: ['supervisor', 'crisis_check', 'supervisor', 'resource_search', 'supervisor']
    value: (x, y) => {
      if (!y) return x || [];
      if (!x) return y;
      return [...x, ...y]; // Append new steps to existing path
    },
    default: () => [],
  },
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GRAPH CONSTRUCTION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Now we construct the actual graph by:
 * 1. Creating a StateGraph instance with our channels
 * 2. Adding nodes (agent functions)
 * 3. Defining edges (how execution flows)
 * 4. Compiling into an executable graph
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

// Create the state graph
const workflow = new StateGraph({
  channels: graphState, // Pass in our state schema
});

console.log('📝 Adding agent nodes to graph...');

/**
 * ─────────────────────────────────────────────────────────────────────────
 * ADDING NODES TO THE GRAPH
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Each node is a function with signature: (state) => updates
 *
 * - Node receives current state
 * - Node does work (calls LLM, uses tools, computes values)
 * - Node returns object with updates to merge into state
 *
 * Example node structure:
 *   async function myNode(state) {
 *     // Do work
 *     const result = await someWork(state.input);
 *
 *     // Return updates
 *     return {
 *       myOutput: result,
 *       agentExecutionPath: ['myNode']
 *     };
 *   }
 *
 * Node naming convention:
 * - Graph uses short names: 'crisis_check', 'resource_search'
 * - Functions use descriptive names: crisisDetectionNode, resourceRecommendationNode
 * This separates concerns: graph routing vs implementation
 */

workflow.addNode('supervisor', supervisorNode);
workflow.addNode('crisis_check', crisisDetectionNode);
workflow.addNode('resource_search', resourceRecommendationNode);
workflow.addNode('coach_response', responseCoachNode);
workflow.addNode('analyze_conversation', conversationAnalystNode);
workflow.addNode('triage', triageNode);

console.log('🔀 Defining graph edges and routing...');

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CONDITIONAL ROUTING FUNCTION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This function determines which agent should run next based on the current
 * state. It's called after the supervisor runs.
 *
 * How it works:
 * 1. Supervisor analyzes state and sets state.nextAction
 * 2. This function reads state.nextAction
 * 3. Returns the name of the next node to execute
 * 4. LangGraph routes to that node
 *
 * Special return value:
 * - END: Built-in constant that terminates graph execution
 *
 * Why use a function instead of hardcoded edges?
 * - Dynamic routing based on runtime state
 * - Same supervisor can route to different agents based on context
 * - Enables "agent decides what to do next" pattern
 *
 * Example flow:
 *   state.nextAction = 'crisis_check'
 *   → routeFromSupervisor(state) returns 'crisis_check'
 *   → LangGraph executes crisisDetectionNode
 *   → Crisis node returns to supervisor
 *   → Supervisor sets nextAction = 'complete'
 *   → routeFromSupervisor(state) returns END
 *   → Graph execution terminates
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */
function routeFromSupervisor(state) {
  const action = state.nextAction;

  console.log(`🔀 Routing from supervisor: ${action}`);

  // Map nextAction values to node names
  if (action === 'crisis_check') return 'crisis_check';
  if (action === 'resource_search') return 'resource_search';
  if (action === 'coach_response') return 'coach_response';
  if (action === 'analyze_conversation') return 'analyze_conversation';
  if (action === 'triage') return 'triage';
  if (action === 'complete') return END; // Special: terminate graph

  // Safety: If supervisor sets invalid action, end gracefully
  console.warn(`⚠️ Unknown action: ${action}, ending graph`);
  return END;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DEFINING EDGES: How Execution Flows Between Nodes
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Edges connect nodes and define execution flow. There are two types:
 *
 * 1. REGULAR EDGES
 *    - Always go from Node A → Node B
 *    - Example: workflow.addEdge('crisis_check', 'supervisor')
 *    - Use when: Next step is always the same
 *
 * 2. CONDITIONAL EDGES
 *    - Use a function to decide where to go next
 *    - Example: workflow.addConditionalEdges('supervisor', routeFn, mapping)
 *    - Use when: Next step depends on state
 *
 * ─────────────────────────────────────────────────────────────────────────
 * OUR EDGE STRATEGY: Supervisor Pattern
 * ─────────────────────────────────────────────────────────────────────────
 *
 * We use a "hub and spoke" pattern:
 * - Supervisor is the hub (makes routing decisions)
 * - Specialized agents are spokes (do specific work)
 * - Conditional edges: supervisor → agents (based on what's needed)
 * - Regular edges: agents → supervisor (always return for next decision)
 *
 * Benefits:
 * ✓ Centralized control: One place to understand routing logic
 * ✓ No cycles between agents: Prevents infinite loops
 * ✓ Easy to add new agents: Just add node + two edges
 * ✓ Supervisor can skip unnecessary work based on state
 *
 * Alternative patterns (not used here):
 * - Sequential: A → B → C → D (rigid, can't adapt)
 * - Peer-to-peer: Agents call each other (complex, hard to debug)
 * - Hierarchical: Multiple supervisors (more complex but more scalable)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

// Set entry point (where graph execution starts)
// The supervisor makes the first routing decision
workflow.setEntryPoint('supervisor');

/**
 * CONDITIONAL EDGES FROM SUPERVISOR
 *
 * After supervisor runs, use routeFromSupervisor() to decide next node.
 * The mapping object defines valid return values and their destinations.
 *
 * Structure:
 *   addConditionalEdges(
 *     sourceNode,           // Which node to route from
 *     routingFunction,      // Function that returns destination name
 *     destinationMapping    // Maps return values to node names
 *   )
 */
workflow.addConditionalEdges(
  'supervisor',              // Source: Supervisor node
  routeFromSupervisor,       // Router: Our function above
  {
    // Mapping: What each return value means
    crisis_check: 'crisis_check',                  // If returns 'crisis_check' → crisis node
    resource_search: 'resource_search',            // If returns 'resource_search' → resource node
    coach_response: 'coach_response',              // If returns 'coach_response' → coach node
    analyze_conversation: 'analyze_conversation',  // If returns 'analyze_conversation' → analyst node
    triage: 'triage',                              // If returns 'triage' → triage node
    END: END,                                      // If returns END → terminate graph
  }
);

/**
 * REGULAR EDGES BACK TO SUPERVISOR
 *
 * All specialized agents return to supervisor for the next routing decision.
 * This creates the "hub and spoke" pattern.
 *
 * Flow for each agent:
 *   supervisor → [agent decides] → specialized_agent → supervisor → ...
 */
workflow.addEdge('crisis_check', 'supervisor');              // Crisis → Supervisor
workflow.addEdge('resource_search', 'supervisor');           // Resource → Supervisor
workflow.addEdge('coach_response', 'supervisor');            // Coach → Supervisor
workflow.addEdge('analyze_conversation', 'supervisor');      // Analyst → Supervisor
workflow.addEdge('triage', 'supervisor');                    // Triage → Supervisor

console.log('⚙️ Compiling agent graph...');

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * COMPILE THE GRAPH
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Compilation transforms the workflow definition into an executable graph.
 *
 * What happens during compilation:
 * 1. Validates all nodes and edges are correctly defined
 * 2. Checks for unreachable nodes
 * 3. Verifies conditional routing mappings
 * 4. Creates an optimized execution engine
 * 5. Returns an object with .invoke() and .stream() methods
 *
 * After compilation, the graph is immutable - you can't add more nodes/edges.
 * This is by design to ensure the graph structure is stable at runtime.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const volunteerSupportGraph = workflow.compile();

console.log('✅ Volunteer Support Agent Graph compiled successfully!');

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HELPER FUNCTIONS FOR GRAPH EXECUTION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The compiled graph can be executed in two ways:
 * 1. invoke() - Run the entire graph and return final result
 * 2. stream() - Stream state updates as each node executes
 *
 * We provide wrapper functions that add helpful features like:
 * - Automatic metadata injection
 * - Performance timing
 * - Detailed logging
 * - Error handling
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * ─────────────────────────────────────────────────────────────────────────
 * INVOKE: Run Entire Graph and Return Final Result
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Use this when:
 * - You want the complete result after all agents finish
 * - You don't need real-time updates during execution
 * - You're running on the server and will send one response
 *
 * Example usage:
 *   const result = await runVolunteerSupport({
 *     conversationId: '123',
 *     volunteerId: 'vol_456',
 *     userId: 'user_789',
 *     messages: [...],
 *     latestUserMessage: 'I need help with cravings'
 *   });
 *
 *   // result contains:
 *   // - crisisDetection: { isCrisis, riskLevel, ... }
 *   // - resourceSuggestions: [{ title, content, ... }, ...]
 *   // - responseCoaching: { score, suggestions, ... }
 *   // - agentExecutionPath: ['supervisor', 'crisis_check', ...]
 *   // - processingStartTime, processingEndTime
 *
 * @param {Object} input - Input state containing conversationId, messages, etc.
 * @returns {Promise<Object>} - Final state after all agents have run
 */
export async function runVolunteerSupport(input) {
  console.log('🚀 Starting Volunteer Support Agent execution...');
  console.log(`📋 Input: conversation=${input.conversationId}, messages=${input.messages?.length || 0}`);

  try {
    // Add processing start time and initialize metadata
    const inputWithMetadata = {
      ...input,
      processingStartTime: new Date(),
      agentExecutionPath: [],
    };

    // Run the graph (this executes all nodes until END is reached)
    const result = await volunteerSupportGraph.invoke(inputWithMetadata);

    // Add processing end time for performance tracking
    result.processingEndTime = new Date();
    const processingTime = result.processingEndTime - result.processingStartTime;

    console.log('✅ Volunteer Support Agent execution complete!');
    console.log(`⏱️  Processing time: ${processingTime}ms`);
    console.log(`🎯 Agents executed: ${result.agentExecutionPath?.join(' → ')}`);

    return result;

  } catch (error) {
    console.error('❌ Volunteer Support Agent execution failed:', error);
    throw error;
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * STREAM: Get Real-Time Updates as Graph Executes
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Use this when:
 * - You want to show progress to users in real-time
 * - You're using Server-Sent Events (SSE) to stream to frontend
 * - You want to display "Agent X is running..." messages
 * - You need to react to intermediate results before graph finishes
 *
 * How streaming works:
 * 1. Graph starts executing
 * 2. After each node runs, graph yields current state
 * 3. Your code receives state update and can process it
 * 4. Graph continues to next node
 * 5. Repeat until END is reached
 *
 * Example usage:
 *   for await (const event of streamVolunteerSupport(input)) {
 *     // event is an object like: { supervisor: { ...updatedState } }
 *     const nodeName = Object.keys(event)[0];  // e.g., 'crisis_check'
 *     const state = Object.values(event)[0];   // Updated state
 *
 *     // Send update to client via SSE
 *     sendSSE({
 *       type: 'agent_update',
 *       agent: nodeName,
 *       data: state.crisisDetection || state.resourceSuggestions || ...
 *     });
 *   }
 *
 * Event structure:
 *   Each event is an object with one key (the node that just ran):
 *   {
 *     'crisis_check': {
 *       conversationId: '123',
 *       crisisDetection: { isCrisis: false, ... },
 *       agentExecutionPath: ['supervisor', 'crisis_check'],
 *       ...allOtherState
 *     }
 *   }
 *
 * @param {Object} input - Input state
 * @returns {AsyncIterator} - Stream of state updates (one per node execution)
 */
export async function* streamVolunteerSupport(input) {
  console.log('🌊 Starting Volunteer Support Agent streaming execution...');

  try {
    const inputWithMetadata = {
      ...input,
      processingStartTime: new Date(),
      agentExecutionPath: [],
    };

    // Stream events from the graph
    // Each iteration yields state after one node executes
    for await (const event of volunteerSupportGraph.stream(inputWithMetadata)) {
      const nodeName = Object.keys(event)[0];
      console.log(`📡 Streaming event: ${nodeName} completed`);
      yield event;
    }

    console.log('✅ Streaming execution complete');

  } catch (error) {
    console.error('❌ Streaming execution failed:', error);
    throw error;
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DEBUGGING AND VISUALIZATION UTILITIES
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Get a visual ASCII representation of the graph structure
 *
 * Useful for:
 * - Understanding the graph at a glance
 * - Documentation
 * - Console logging during development
 * - Explaining the system to other developers
 *
 * @returns {string} ASCII art visualization of the graph
 */
export function getGraphVisualization() {
  return `
  Volunteer Support Agent Graph:

  ┌─────────────┐
  │  START      │
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │ SUPERVISOR  │◄─────────┐
  └──────┬──────┘          │
         │                 │
         ├─► crisis_check ─┤
         │                 │
         ├─► resource_search ┤
         │                 │
         ├─► coach_response ─┤
         │                 │
         ├─► analyze_conversation ┤
         │                 │
         ├─► triage ────────┘
         │
         ▼
      ┌─────┐
      │ END │
      └─────┘
  `;
}

// Log the graph structure on module load
console.log(getGraphVisualization());

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LEARNING PATH FOR DEVELOPERS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * If you're new to agentic AI and want to understand this implementation:
 *
 * 1. START HERE: Read this file (graph.js) completely
 *    - Understand the concepts: nodes, edges, state, channels
 *    - Study the graph structure diagram above
 *    - Trace through the execution flow example
 *
 * 2. EXAMINE STATE: Read state.js
 *    - See how we define typed state with Zod schemas
 *    - Understand what data flows through the graph
 *    - Look at validation and type safety
 *
 * 3. STUDY TOOLS: Read tools.js
 *    - See how tools are defined with DynamicStructuredTool
 *    - Understand Zod schemas for tool inputs
 *    - Look at how tools interact with database/APIs
 *
 * 4. EXPLORE NODES: Read each node file in nodes/
 *    Start with:
 *    a) supervisor.js - See how routing decisions are made
 *    b) crisisDetection.js - See how an LLM agent works with tools
 *    c) resourceRecommendation.js - See vector search integration
 *
 * 5. API INTEGRATION: Read the API routes
 *    - /src/app/api/volunteer/agent/route.js - See how graph is invoked
 *    - /src/app/api/volunteer/agent/stream/route.js - See SSE streaming
 *
 * 6. FRONTEND: Read the UI component
 *    - /src/components/Volunteer/Chat/AgenticVolunteerChat.js
 *    - See how streaming updates are displayed to users
 *
 * 7. TESTING: Read the test file
 *    - /docs/VOLUNTEER_AGENT_TESTING.md
 *    - Try running the test scenarios
 *
 * 8. VISUALIZATION: View the interactive graph
 *    - Navigate to /admin/agent-graph in the app
 *    - Run demo scenarios to see execution flow
 *    - Click on nodes to see tools and routing logic
 *
 * 9. METRICS: View the monitoring dashboard
 *    - Navigate to /admin/agent-metrics
 *    - See performance data and execution statistics
 *
 * 10. COMPREHENSIVE DOCS: Read the technical architecture
 *     - /docs/AGENTIC_AI_TECHNICAL_ARCHITECTURE.md
 *     - Deep dive into all concepts and implementation details
 *
 * ─────────────────────────────────────────────────────────────────────────
 * COMMON CUSTOMIZATIONS
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Want to extend this system? Here are common modifications:
 *
 * ADD A NEW AGENT:
 * 1. Create node file: nodes/myNewAgent.js
 * 2. Add tools in tools.js (if needed)
 * 3. Add state channel in graphState for agent output
 * 4. Add node: workflow.addNode('my_agent', myNewAgentNode)
 * 5. Add conditional route in routeFromSupervisor()
 * 6. Add edge back: workflow.addEdge('my_agent', 'supervisor')
 * 7. Update supervisor logic to route to new agent
 *
 * CHANGE ROUTING LOGIC:
 * - Edit nodes/supervisor.js
 * - Modify analyzeCurrentState() to consider new conditions
 * - Update routing decision logic
 *
 * ADD NEW TOOLS:
 * - Add tool definition in tools.js
 * - Bind tool to agent in node file: model.bindTools([myTool])
 * - Tool will automatically be available to agent
 *
 * MODIFY STATE SCHEMA:
 * - Add channel in graphState
 * - Add Zod schema in state.js (recommended)
 * - Update nodes to populate new state field
 *
 * CHANGE EXECUTION FLOW:
 * - Modify edges: Instead of hub-and-spoke, could do sequential
 * - Example: workflow.addEdge('crisis_check', 'resource_search')
 * - Or add conditional routing from multiple nodes
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * END OF GRAPH DEFINITION
 * ═══════════════════════════════════════════════════════════════════════════
 */
