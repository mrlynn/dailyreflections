# Agentic AI Technical Architecture - Volunteer Support Agent System

## Table of Contents
1. [System Overview](#system-overview)
2. [Core Concepts](#core-concepts)
3. [File Structure](#file-structure)
4. [Nodes (Agents)](#nodes-agents)
5. [Edges (Routing)](#edges-routing)
6. [Tools (Capabilities)](#tools-capabilities)
7. [State Management](#state-management)
8. [Graph Execution Flow](#graph-execution-flow)
9. [API Layer](#api-layer)
10. [Frontend Integration](#frontend-integration)

---

## System Overview

The Volunteer Support Agent is a **multi-agent AI system** built with LangGraph that assists volunteer peer counselors during support conversations. It uses the **supervisor pattern** where a central coordinator routes execution to specialized sub-agents.

### Technology Stack
- **Framework**: LangGraph (by LangChain)
- **LLM**: OpenAI GPT-4o and GPT-4o-mini
- **Language**: JavaScript/Node.js
- **Runtime**: Next.js App Router (API routes)
- **Validation**: Zod schemas
- **Database**: MongoDB (for state persistence)

### Architecture Pattern
```
Supervisor Pattern (Orchestrator + Workers)
├── 1 Supervisor Agent (coordinator)
└── 5 Specialized Agents (workers)
    ├── Crisis Detection
    ├── Resource Recommendation
    ├── Response Coach
    ├── Conversation Analyst
    └── Triage
```

---

## Core Concepts

### What is LangGraph?

LangGraph is a framework for building **stateful, multi-agent applications** with LLMs. Key concepts:

#### **1. Nodes**
- Represent individual agents or processing steps
- Each node is a function that receives state and returns updated state
- In our system: `supervisorNode`, `crisisDetectionNode`, etc.

#### **2. Edges**
- Define how execution flows between nodes
- Two types:
  - **Regular edges**: Fixed routing (A always goes to B)
  - **Conditional edges**: Dynamic routing based on state
- In our system: All agents route back to supervisor (conditional)

#### **3. State**
- Shared memory that flows through the graph
- Each node can read and update state
- Persists between node executions
- In our system: Defined with Zod schemas

#### **4. Graph**
- The complete workflow orchestrator
- Manages node execution order
- Handles state updates
- In our system: `StateGraph` compiled from workflow definition

---

## File Structure

### Directory Layout
```
src/lib/agents/volunteer/
├── state.js                    # State schema definitions (Zod)
├── tools.js                    # 10 specialized tools for agents
├── graph.js                    # Graph definition and orchestration
└── nodes/
    ├── supervisor.js           # Coordinator agent
    ├── crisisDetection.js      # Crisis detection agent
    ├── resourceRecommendation.js # Resource search agent
    ├── responseCoach.js        # Response coaching agent
    ├── conversationAnalyst.js  # Conversation analysis agent
    └── triage.js               # Request prioritization agent

src/app/api/volunteer/
├── agent/
│   ├── route.js               # Main API endpoint
│   └── stream/
│       └── route.js           # Streaming SSE endpoint

src/components/
├── Volunteer/Chat/
│   └── AgenticVolunteerChat.js # Frontend UI component
└── Admin/
    └── AgentMetricsDashboard.js # Monitoring dashboard
```

### File Responsibilities

| File | Purpose | Key Exports |
|------|---------|-------------|
| `state.js` | State schema | `ConversationStateSchema`, `createInitialState()` |
| `tools.js` | Tool definitions | 10 `DynamicStructuredTool` instances |
| `graph.js` | Graph orchestration | `volunteerSupportGraph`, `runVolunteerSupport()`, `streamVolunteerSupport()` |
| `nodes/*.js` | Agent implementations | Async node functions |
| `api/volunteer/agent/route.js` | HTTP API | POST handler for agent execution |
| `api/volunteer/agent/stream/route.js` | SSE API | POST handler for streaming |

---

## Nodes (Agents)

### Node Definition

In LangGraph, a **node is a function** with this signature:

```javascript
async function nodeFunction(state) {
  // 1. Read current state
  // 2. Perform work (call LLM, use tools, etc.)
  // 3. Return updated state

  return {
    ...state,
    newField: newValue,
    agentExecutionPath: [...state.agentExecutionPath, 'agent_name']
  };
}
```

### Node Implementation Pattern

All agent nodes follow this structure:

```javascript
// File: src/lib/agents/volunteer/nodes/exampleAgent.js

import { ChatOpenAI } from '@langchain/openai';
import { someTool } from '../tools';

export async function exampleAgentNode(state) {
  console.log('🤖 Example Agent: Starting...');

  // 1. Track execution
  const executionPath = state.agentExecutionPath || [];
  executionPath.push('example_agent');

  try {
    // 2. Initialize LLM with tools
    const model = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0,
    });

    const modelWithTools = model.bindTools([someTool]);

    // 3. Create prompt from state
    const systemPrompt = `You are an expert at...`;
    const userPrompt = `Analyze this: ${state.latestUserMessage}`;

    // 4. Call LLM
    const response = await modelWithTools.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);

    // 5. Extract tool calls
    const toolCalls = response.tool_calls || [];
    let result = null;

    for (const toolCall of toolCalls) {
      if (toolCall.name === 'some_tool') {
        result = await someTool.func(toolCall.args);
      }
    }

    // 6. Determine next action
    const nextAction = result.isCritical ? 'complete' : 'next_agent';

    // 7. Return updated state
    return {
      ...state,
      exampleResult: result,
      nextAction,
      agentExecutionPath: executionPath,
    };

  } catch (error) {
    console.error('❌ Example Agent Error:', error);
    return {
      ...state,
      error: error.message,
      nextAction: 'complete',
      agentExecutionPath: executionPath,
    };
  }
}
```

### Actual Node Implementations

#### 1. **Supervisor Node** (`src/lib/agents/volunteer/nodes/supervisor.js`)

**Purpose**: Analyzes state and routes to appropriate agent

**Key Code**:
```javascript
export async function supervisorNode(state) {
  const executionPath = state.agentExecutionPath || [];
  executionPath.push('supervisor');

  // Analyze current state
  const stateAnalysis = analyzeCurrentState(state);

  // LLM decides next action
  const model = new ChatOpenAI({ modelName: 'gpt-4o', temperature: 0 });
  const response = await model.invoke([
    { role: 'system', content: supervisorPrompt },
    { role: 'user', content: stateAnalysis.description }
  ]);

  // Extract and validate routing decision
  let nextAction = response.content.trim().toLowerCase();
  nextAction = validateRouting(state, nextAction, stateAnalysis);

  return {
    ...state,
    nextAction,
    agentExecutionPath: executionPath,
  };
}
```

**State Analysis** (`analyzeCurrentState()`):
```javascript
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
  };

  const description = `
Has new user message: ${checks.hasNewMessage}
Crisis check completed: ${checks.crisisCheckDone}
Resources found: ${checks.resourcesFound}
...
  `;

  return { checks, description };
}
```

**Routing Validation** (`validateRouting()`):
```javascript
function validateRouting(state, suggestedAction, analysis) {
  const { checks } = analysis;

  // RULE 1: Crisis check must run first
  if (checks.hasNewMessage && !checks.crisisCheckDone) {
    return 'crisis_check';
  }

  // RULE 2: Critical crisis → complete immediately
  if (checks.crisisDetected &&
      ['critical', 'high'].includes(state.crisisDetection.riskLevel)) {
    return 'complete';
  }

  // RULE 3: Can't coach without a draft
  if (suggestedAction === 'coach_response' && !checks.hasVolunteerDraft) {
    return 'analyze_conversation';
  }

  // ... more rules

  return suggestedAction;
}
```

#### 2. **Crisis Detection Node** (`src/lib/agents/volunteer/nodes/crisisDetection.js`)

**Purpose**: Detects suicide risk and severe distress

**Key Code**:
```javascript
export async function crisisDetectionNode(state) {
  const executionPath = state.agentExecutionPath || [];
  executionPath.push('crisis_check');

  const model = new ChatOpenAI({
    modelName: 'gpt-4o',    // Use best model for safety
    temperature: 0,          // Deterministic for consistency
  });

  // Bind crisis-specific tools
  const modelWithTools = model.bindTools([
    crisisAssessmentTool,
    emergencyResourcesTool,
  ]);

  const systemPrompt = `You are a crisis detection specialist...

CRISIS INDICATORS:
- Suicidal ideation, specific plans
- Self-harm threats
- Severe hopelessness
...`;

  const response = await modelWithTools.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: state.latestUserMessage }
  ]);

  // Execute tool calls
  const toolCalls = response.tool_calls || [];
  let crisisAssessment = null;

  for (const toolCall of toolCalls) {
    if (toolCall.name === 'crisis_assessment') {
      crisisAssessment = await crisisAssessmentTool.func(toolCall.args);
    }
  }

  // Determine next action based on risk level
  let nextAction = 'resource_search';
  if (crisisAssessment?.isCrisis &&
      ['critical', 'high'].includes(crisisAssessment.riskLevel)) {
    nextAction = 'complete'; // Alert immediately
  }

  return {
    ...state,
    crisisDetection: crisisAssessment,
    nextAction,
    agentExecutionPath: executionPath,
  };
}
```

#### 3. **Resource Recommendation Node** (`src/lib/agents/volunteer/nodes/resourceRecommendation.js`)

**Purpose**: Semantic search across AA literature

**Key Code**:
```javascript
export async function resourceRecommendationNode(state) {
  const executionPath = state.agentExecutionPath || [];
  executionPath.push('resource_search');

  const model = new ChatOpenAI({ modelName: 'gpt-4o', temperature: 0.3 });

  const modelWithTools = model.bindTools([
    searchBigBookTool,
    findReflectionTool,
    searchLiteratureTool,
  ]);

  const systemPrompt = `You are an AA literature expert...

Your task:
1. Extract key topics from the user's message
2. Search the Big Book, Daily Reflections, and other literature
3. Return the most relevant passages with citations
...`;

  const response = await modelWithTools.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: state.latestUserMessage }
  ]);

  // Execute tool calls and collect resources
  const resources = [];
  const toolCalls = response.tool_calls || [];

  for (const toolCall of toolCalls) {
    if (toolCall.name === 'search_bigbook') {
      const results = await searchBigBookTool.func(toolCall.args);
      resources.push(...results);
    }
    // ... handle other tools
  }

  return {
    ...state,
    resourceSuggestions: resources,
    nextAction: state.volunteerDraft ? 'coach_response' : 'analyze_conversation',
    agentExecutionPath: executionPath,
  };
}
```

#### 4. **Response Coach Node** (`src/lib/agents/volunteer/nodes/responseCoach.js`)

**Purpose**: Evaluates volunteer responses for quality and empathy

**Key Code**:
```javascript
export async function responseCoachNode(state) {
  const executionPath = state.agentExecutionPath || [];
  executionPath.push('coach_response');

  if (!state.volunteerDraft) {
    // No draft to coach
    return {
      ...state,
      nextAction: 'analyze_conversation',
      agentExecutionPath: executionPath,
    };
  }

  const model = new ChatOpenAI({ modelName: 'gpt-4o', temperature: 0 });

  const modelWithTools = model.bindTools([
    analyzeResponseQualityTool,
  ]);

  const systemPrompt = `You are a peer counseling coach...

Evaluate on:
1. Empathy (1-10): Does it show understanding?
2. Quality (1-10): Is it helpful and appropriate?
3. AA Principles: Aligned with program values?
4. Boundaries: Maintains appropriate limits?
...`;

  const response = await modelWithTools.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `
User message: ${state.latestUserMessage}
Volunteer draft: ${state.volunteerDraft}
` }
  ]);

  // Extract coaching feedback
  const toolCalls = response.tool_calls || [];
  let coaching = null;

  for (const toolCall of toolCalls) {
    if (toolCall.name === 'analyze_response_quality') {
      coaching = await analyzeResponseQualityTool.func(toolCall.args);
    }
  }

  return {
    ...state,
    responseCoaching: coaching,
    nextAction: 'analyze_conversation',
    agentExecutionPath: executionPath,
  };
}
```

#### 5. **Conversation Analyst Node** (`src/lib/agents/volunteer/nodes/conversationAnalyst.js`)

**Purpose**: Sentiment analysis and topic extraction

**Key Code**:
```javascript
export async function conversationAnalystNode(state) {
  const executionPath = state.agentExecutionPath || [];
  executionPath.push('analyze_conversation');

  // Use cheaper model for analysis
  const model = new ChatOpenAI({
    modelName: 'gpt-4o-mini',  // Cost optimization
    temperature: 0.3
  });

  const modelWithTools = model.bindTools([
    sentimentAnalysisTool,
    topicExtractionTool,
    generateSummaryTool,
  ]);

  const systemPrompt = `You are a conversation analyst...

Analyze:
1. Sentiment: positive/neutral/negative/distressed/hopeful
2. Topics: Key themes and concerns
3. Phase: opening/exploration/support/closing
4. User state: Emotional and mental state
...`;

  const conversationText = state.messages
    .map(m => `${m.role}: ${m.content}`)
    .join('\n');

  const response = await modelWithTools.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: conversationText }
  ]);

  // Execute analysis tools
  const toolCalls = response.tool_calls || [];
  let analysis = {};

  for (const toolCall of toolCalls) {
    if (toolCall.name === 'sentiment_analysis') {
      analysis.sentiment = await sentimentAnalysisTool.func(toolCall.args);
    }
    if (toolCall.name === 'topic_extraction') {
      analysis.topics = await topicExtractionTool.func(toolCall.args);
    }
    // ... other tools
  }

  return {
    ...state,
    conversationAnalysis: analysis,
    nextAction: 'complete',
    agentExecutionPath: executionPath,
  };
}
```

#### 6. **Triage Node** (`src/lib/agents/volunteer/nodes/triage.js`)

**Purpose**: Prioritizes incoming support requests

**Key Code**:
```javascript
export async function triageNode(state) {
  const executionPath = state.agentExecutionPath || [];
  executionPath.push('triage');

  const model = new ChatOpenAI({ modelName: 'gpt-4o-mini', temperature: 0 });

  const modelWithTools = model.bindTools([
    calculateUrgencyTool,
  ]);

  const systemPrompt = `You are a triage specialist...

Urgency Scoring:
- Crisis indicators: +80 points
- Wait time > 30min: +20 points
- Urgent keywords: +15 points
- First-time user: +10 points
...`;

  const response = await modelWithTools.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: JSON.stringify({
      message: state.latestUserMessage,
      waitTime: state.waitTime,
      crisisDetected: state.crisisDetection?.isCrisis,
    })}
  ]);

  // Calculate priority
  const toolCalls = response.tool_calls || [];
  let triageInfo = null;

  for (const toolCall of toolCalls) {
    if (toolCall.name === 'calculate_urgency') {
      triageInfo = await calculateUrgencyTool.func(toolCall.args);
    }
  }

  return {
    ...state,
    triageInfo,
    nextAction: 'complete',
    agentExecutionPath: executionPath,
  };
}
```

---

## Edges (Routing)

### Edge Definition

In LangGraph, **edges define how execution flows** between nodes. Two types:

#### **1. Regular Edges (Fixed Routing)**
```javascript
workflow.addEdge('nodeA', 'nodeB');
// nodeA ALWAYS routes to nodeB
```

#### **2. Conditional Edges (Dynamic Routing)**
```javascript
workflow.addConditionalEdges(
  'sourceNode',          // Start node
  routingFunction,       // Function that decides next node
  {                      // Mapping of decisions to nodes
    'optionA': 'nodeA',
    'optionB': 'nodeB',
    END: END,
  }
);
```

### Our Graph's Edge Structure

File: `src/lib/agents/volunteer/graph.js`

```javascript
import { StateGraph, END } from '@langchain/langgraph';

const workflow = new StateGraph({ channels: graphState });

// Add all nodes
workflow.addNode('supervisor', supervisorNode);
workflow.addNode('crisis_check', crisisDetectionNode);
workflow.addNode('resource_search', resourceRecommendationNode);
workflow.addNode('coach_response', responseCoachNode);
workflow.addNode('analyze_conversation', conversationAnalystNode);
workflow.addNode('triage', triageNode);

// Set entry point
workflow.setEntryPoint('supervisor');

// CONDITIONAL EDGES: Supervisor → Specialized Agents
workflow.addConditionalEdges(
  'supervisor',
  routeFromSupervisor,  // Routing function
  {
    crisis_check: 'crisis_check',
    resource_search: 'resource_search',
    coach_response: 'coach_response',
    analyze_conversation: 'analyze_conversation',
    triage: 'triage',
    END: END,
  }
);

// REGULAR EDGES: All agents → Supervisor
workflow.addEdge('crisis_check', 'supervisor');
workflow.addEdge('resource_search', 'supervisor');
workflow.addEdge('coach_response', 'supervisor');
workflow.addEdge('analyze_conversation', 'supervisor');
workflow.addEdge('triage', 'supervisor');

// Compile the graph
export const volunteerSupportGraph = workflow.compile();
```

### Routing Function

The routing function examines state and returns the next node name:

```javascript
function routeFromSupervisor(state) {
  const action = state.nextAction;

  console.log(`🔀 Routing from supervisor: ${action}`);

  if (action === 'crisis_check') return 'crisis_check';
  if (action === 'resource_search') return 'resource_search';
  if (action === 'coach_response') return 'coach_response';
  if (action === 'analyze_conversation') return 'analyze_conversation';
  if (action === 'triage') return 'triage';
  if (action === 'complete') return END;

  // Default to END if unknown
  console.warn(`⚠️ Unknown action: ${action}, ending graph`);
  return END;
}
```

### Visual Representation

```
┌─────────────┐
│   START     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ SUPERVISOR  │◄────────────┐
└──────┬──────┘             │
       │                    │
       │ (conditional)      │ (regular edges)
       ├────────────────────┤
       │                    │
       ├─→ crisis_check ────┤
       │                    │
       ├─→ resource_search ─┤
       │                    │
       ├─→ coach_response ──┤
       │                    │
       ├─→ analyze_conversation ┤
       │                    │
       ├─→ triage ──────────┘
       │
       ▼
    ┌─────┐
    │ END │
    └─────┘
```

### Execution Path Example

**Input**: New user message about cravings

**Execution**:
```
1. START
2. supervisor → analyzes state → sets nextAction = 'crisis_check'
3. routeFromSupervisor(state) → returns 'crisis_check'
4. crisis_check → runs → sets nextAction = 'resource_search'
5. edge to supervisor
6. supervisor → analyzes state → validates routing
7. routeFromSupervisor(state) → returns 'resource_search'
8. resource_search → runs → sets nextAction = 'analyze_conversation'
9. edge to supervisor
10. supervisor → analyzes state → validates routing
11. routeFromSupervisor(state) → returns 'analyze_conversation'
12. analyze_conversation → runs → sets nextAction = 'complete'
13. edge to supervisor
14. supervisor → analyzes state
15. routeFromSupervisor(state) → returns END
16. END
```

**Result**:
- Agents executed: `['supervisor', 'crisis_check', 'supervisor', 'resource_search', 'supervisor', 'analyze_conversation', 'supervisor']`
- Processing time: ~2.5 seconds

---

## Tools (Capabilities)

### Tool Definition

In LangChain, a **tool is a function that an LLM can call**. Tools are defined using `DynamicStructuredTool`:

```javascript
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

const exampleTool = new DynamicStructuredTool({
  name: 'tool_name',                    // Tool identifier
  description: 'What this tool does',   // LLM sees this to decide when to use it
  schema: z.object({                    // Input validation
    param1: z.string().describe('First parameter'),
    param2: z.number().optional(),
  }),
  func: async ({ param1, param2 }) => { // The actual function
    // Do work
    return result;
  },
});
```

### Our Tools

File: `src/lib/agents/volunteer/tools.js`

#### **1. Crisis Assessment Tool**

```javascript
export const crisisAssessmentTool = new DynamicStructuredTool({
  name: 'crisis_assessment',
  description: `Analyzes a message for crisis indicators including:
- Suicidal ideation
- Self-harm threats
- Severe hopelessness
- Immediate danger
Returns risk level and recommended action.`,

  schema: z.object({
    message: z.string().describe('The user message to assess for crisis indicators'),
    conversationHistory: z.array(z.string()).optional().describe('Previous messages for context'),
  }),

  func: async ({ message, conversationHistory = [] }) => {
    // Use LLM to analyze crisis indicators
    const model = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0,  // Deterministic for safety
    });

    const prompt = `You are a crisis detection expert...

Analyze this message for crisis indicators:
"${message}"

Previous context:
${conversationHistory.join('\n')}

Respond with JSON:
{
  "isCrisis": true/false,
  "riskLevel": "none/low/medium/high/critical",
  "indicators": ["list", "of", "specific", "indicators"],
  "recommendedAction": "what to do next"
}`;

    const response = await model.invoke([
      { role: 'system', content: 'You are a crisis detection specialist.' },
      { role: 'user', content: prompt }
    ]);

    // Parse structured response
    const result = JSON.parse(response.content);

    return {
      isCrisis: result.isCrisis,
      riskLevel: result.riskLevel,
      indicators: result.indicators,
      recommendedAction: result.recommendedAction,
      urgencyLevel: result.riskLevel === 'critical' ? 'immediate' : 'standard',
    };
  },
});
```

#### **2. Search Big Book Tool** (Vector Search)

```javascript
export const searchBigBookTool = new DynamicStructuredTool({
  name: 'search_bigbook',
  description: 'Searches the AA Big Book using semantic similarity for relevant passages',

  schema: z.object({
    query: z.string().describe('The search query or topic'),
    limit: z.number().optional().default(5).describe('Number of results to return'),
  }),

  func: async ({ query, limit = 5 }) => {
    // Use existing searchBigBook function (from your codebase)
    const results = await searchBigBook(query, limit);

    // Transform to standard format
    return results.map(result => ({
      title: `Big Book - ${result.chapter}`,
      excerpt: result.text,
      citation: `Alcoholics Anonymous, p. ${result.page}`,
      relevanceScore: result.score,
      page: result.page,
      chapter: result.chapter,
    }));
  },
});
```

#### **3. Find Reflection Tool**

```javascript
export const findReflectionTool = new DynamicStructuredTool({
  name: 'find_reflection',
  description: 'Finds relevant Daily Reflections based on topic or theme',

  schema: z.object({
    topic: z.string().describe('The topic or theme to search for'),
    limit: z.number().optional().default(3),
  }),

  func: async ({ topic, limit = 3 }) => {
    const results = await searchReflections(topic, limit);

    return results.map(result => ({
      title: `Daily Reflection - ${result.date}`,
      excerpt: result.text,
      citation: `Daily Reflections, ${result.date}`,
      relevanceScore: result.score,
    }));
  },
});
```

#### **4. Analyze Response Quality Tool**

```javascript
export const analyzeResponseQualityTool = new DynamicStructuredTool({
  name: 'analyze_response_quality',
  description: 'Analyzes a volunteer response for empathy, quality, and appropriateness',

  schema: z.object({
    userMessage: z.string().describe('Original user message'),
    volunteerResponse: z.string().describe('Volunteer draft response to evaluate'),
  }),

  func: async ({ userMessage, volunteerResponse }) => {
    const model = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0,
    });

    const prompt = `Evaluate this volunteer response:

User said: "${userMessage}"
Volunteer draft: "${volunteerResponse}"

Score on:
1. Empathy (1-10): Shows understanding and compassion?
2. Quality (1-10): Helpful and appropriate?
3. Strengths: What's good about it?
4. Improvements: What could be better?
5. Suggestions: Specific ways to improve

Respond with JSON.`;

    const response = await model.invoke([
      { role: 'system', content: 'You are a peer counseling coach.' },
      { role: 'user', content: prompt }
    ]);

    const result = JSON.parse(response.content);

    return {
      empathyScore: result.empathyScore,
      qualityScore: result.qualityScore,
      strengths: result.strengths,
      improvements: result.improvements,
      suggestions: result.suggestions,
    };
  },
});
```

#### **5. Sentiment Analysis Tool**

```javascript
export const sentimentAnalysisTool = new DynamicStructuredTool({
  name: 'sentiment_analysis',
  description: 'Analyzes emotional sentiment in conversation',

  schema: z.object({
    conversationText: z.string().describe('Full conversation text'),
  }),

  func: async ({ conversationText }) => {
    const model = new ChatOpenAI({
      modelName: 'gpt-4o-mini',  // Cheaper model for simple analysis
      temperature: 0.3,
    });

    const prompt = `Analyze sentiment: ${conversationText}

Options: positive, neutral, negative, distressed, hopeful
Respond with one word.`;

    const response = await model.invoke([
      { role: 'system', content: 'You analyze emotional sentiment.' },
      { role: 'user', content: prompt }
    ]);

    return response.content.trim().toLowerCase();
  },
});
```

#### **6-10. Other Tools**

Additional tools follow the same pattern:
- `topicExtractionTool` - Extracts conversation topics
- `generateSummaryTool` - Creates conversation summary
- `calculateUrgencyTool` - Scores request urgency
- `emergencyResourcesTool` - Returns crisis hotlines
- `searchLiteratureTool` - Searches general AA literature

### Tool Binding to LLM

Tools are "bound" to LLM instances so the model knows about them:

```javascript
const model = new ChatOpenAI({ modelName: 'gpt-4o' });

// Bind tools
const modelWithTools = model.bindTools([
  crisisAssessmentTool,
  searchBigBookTool,
  findReflectionTool,
]);

// LLM can now decide to call these tools
const response = await modelWithTools.invoke([
  { role: 'system', content: 'You help volunteers...' },
  { role: 'user', content: 'User is struggling with cravings' }
]);

// Extract tool calls from response
const toolCalls = response.tool_calls || [];

// Execute tools
for (const toolCall of toolCalls) {
  if (toolCall.name === 'search_bigbook') {
    const results = await searchBigBookTool.func(toolCall.args);
    console.log('Big Book results:', results);
  }
}
```

**How it works:**
1. LLM receives user input
2. LLM sees tool descriptions
3. LLM decides which tools to call (if any)
4. LLM generates tool calls with arguments
5. We execute the tool functions
6. Results go back to LLM or directly to user

---

## State Management

### State Schema Definition

File: `src/lib/agents/volunteer/state.js`

State is defined using **Zod schemas** for type safety:

```javascript
import { z } from 'zod';

// Message schema
export const MessageSchema = z.object({
  role: z.enum(['user', 'volunteer']),
  content: z.string(),
  timestamp: z.date(),
});

// Crisis detection schema
export const CrisisDetectionSchema = z.object({
  isCrisis: z.boolean(),
  riskLevel: z.enum(['none', 'low', 'medium', 'high', 'critical']),
  indicators: z.array(z.string()),
  recommendedAction: z.string(),
  urgencyLevel: z.enum(['standard', 'immediate']).optional(),
});

// Resource suggestion schema
export const ResourceSuggestionSchema = z.object({
  title: z.string(),
  excerpt: z.string(),
  citation: z.string(),
  relevanceScore: z.number(),
  page: z.number().optional(),
  chapter: z.string().optional(),
});

// ... more schemas

// Main conversation state schema
export const ConversationStateSchema = z.object({
  // Identifiers
  conversationId: z.string(),
  volunteerId: z.string(),
  userId: z.string(),

  // Input data
  messages: z.array(MessageSchema),
  latestUserMessage: z.string().optional(),
  volunteerDraft: z.string().optional(),
  waitTime: z.number().default(0),

  // Agent outputs
  crisisDetection: CrisisDetectionSchema.optional(),
  resourceSuggestions: z.array(ResourceSuggestionSchema).optional(),
  responseCoaching: ResponseCoachingSchema.optional(),
  conversationAnalysis: ConversationAnalysisSchema.optional(),
  triageInfo: TriageInfoSchema.optional(),

  // Routing
  nextAction: z.enum([
    'crisis_check',
    'resource_search',
    'coach_response',
    'analyze_conversation',
    'triage',
    'complete'
  ]).optional(),

  // Summary
  summary: z.string().optional(),

  // Metadata
  processingStartTime: z.date(),
  processingEndTime: z.date().optional(),
  agentExecutionPath: z.array(z.string()).default([]),
});
```

### State Channels in Graph

File: `src/lib/agents/volunteer/graph.js`

LangGraph uses **channels** to manage state updates:

```javascript
const graphState = {
  // Simple value (last write wins)
  conversationId: {
    value: (x, y) => y ?? x,  // y if provided, else keep x
    default: () => null,
  },

  volunteerId: {
    value: (x, y) => y ?? x,
    default: () => null,
  },

  // Array accumulation
  messages: {
    value: (x, y) => y ?? x,
    default: () => [],
  },

  // Agent outputs (last write wins)
  crisisDetection: {
    value: (x, y) => y ?? x,
    default: () => null,
  },

  resourceSuggestions: {
    value: (x, y) => y ?? x,
    default: () => null,
  },

  // Execution path (accumulate)
  agentExecutionPath: {
    value: (x, y) => {
      if (!y) return x || [];
      if (!x) return y;
      return [...x, ...y];  // Concatenate arrays
    },
    default: () => [],
  },

  // ... more channels
};
```

**Channel Reducer Functions:**
- `(x, y) => y ?? x` - "Last write wins" (most common)
- `(x, y) => [...x, ...y]` - "Accumulate arrays"
- `(x, y) => ({ ...x, ...y })` - "Merge objects"

### Creating Initial State

Helper function to create initial state:

```javascript
export function createInitialState({
  conversationId,
  volunteerId,
  userId,
  messages,
  latestUserMessage,
  volunteerDraft,
  waitTime = 0,
}) {
  return {
    conversationId,
    volunteerId,
    userId,
    messages,
    latestUserMessage,
    volunteerDraft,
    waitTime,

    // Agent outputs (null initially)
    crisisDetection: null,
    resourceSuggestions: null,
    responseCoaching: null,
    conversationAnalysis: null,
    triageInfo: null,

    // Routing
    nextAction: null,

    // Metadata
    processingStartTime: new Date(),
    processingEndTime: null,
    agentExecutionPath: [],
  };
}
```

### State Flow Through Graph

```javascript
// Initial state
const initialState = {
  conversationId: 'conv-123',
  messages: [...],
  latestUserMessage: 'I need help',
  crisisDetection: null,  // ← Will be populated
  resourceSuggestions: null,  // ← Will be populated
  agentExecutionPath: [],  // ← Will accumulate
};

// After supervisor node
{
  ...initialState,
  nextAction: 'crisis_check',
  agentExecutionPath: ['supervisor'],
}

// After crisis_check node
{
  ...initialState,
  crisisDetection: { isCrisis: false, riskLevel: 'low', ... },
  nextAction: 'resource_search',
  agentExecutionPath: ['supervisor', 'crisis_check'],
}

// After resource_search node
{
  ...initialState,
  crisisDetection: { ... },
  resourceSuggestions: [{ title: 'Big Book p.24', ... }],
  nextAction: 'analyze_conversation',
  agentExecutionPath: ['supervisor', 'crisis_check', 'supervisor', 'resource_search'],
}

// Final state
{
  ...initialState,
  crisisDetection: { ... },
  resourceSuggestions: [...],
  conversationAnalysis: { sentiment: 'hopeful', ... },
  nextAction: 'complete',
  agentExecutionPath: ['supervisor', 'crisis_check', 'supervisor', 'resource_search', 'supervisor', 'analyze_conversation', 'supervisor'],
  processingEndTime: new Date(),
}
```

---

## Graph Execution Flow

### Compiling the Graph

File: `src/lib/agents/volunteer/graph.js`

```javascript
import { StateGraph, END } from '@langchain/langgraph';

// 1. Define state channels
const graphState = { /* ... */ };

// 2. Create StateGraph
const workflow = new StateGraph({
  channels: graphState,
});

// 3. Add nodes
workflow.addNode('supervisor', supervisorNode);
workflow.addNode('crisis_check', crisisDetectionNode);
// ... more nodes

// 4. Set entry point
workflow.setEntryPoint('supervisor');

// 5. Define edges
workflow.addConditionalEdges('supervisor', routeFromSupervisor, {
  crisis_check: 'crisis_check',
  resource_search: 'resource_search',
  // ...
  END: END,
});

workflow.addEdge('crisis_check', 'supervisor');
// ... more edges

// 6. Compile graph
export const volunteerSupportGraph = workflow.compile();
```

### Invoking the Graph

Two ways to execute the graph:

#### **1. Standard Invocation** (Wait for completion)

```javascript
export async function runVolunteerSupport(input) {
  console.log('🚀 Starting agent execution...');

  const inputWithMetadata = {
    ...input,
    processingStartTime: new Date(),
    agentExecutionPath: [],
  };

  // Run graph (waits for completion)
  const result = await volunteerSupportGraph.invoke(inputWithMetadata);

  result.processingEndTime = new Date();

  console.log('✅ Execution complete');
  console.log(`Agents: ${result.agentExecutionPath.join(' → ')}`);

  return result;
}
```

#### **2. Streaming Invocation** (Real-time updates)

```javascript
export async function* streamVolunteerSupport(input) {
  console.log('🌊 Starting streaming execution...');

  const inputWithMetadata = {
    ...input,
    processingStartTime: new Date(),
    agentExecutionPath: [],
  };

  // Stream events from graph
  for await (const event of volunteerSupportGraph.stream(inputWithMetadata)) {
    // Each event is a state update from an agent
    console.log('📡 Event:', Object.keys(event)[0]);
    yield event;
  }

  console.log('✅ Streaming complete');
}
```

### Execution Trace Example

**Input:**
```javascript
{
  conversationId: 'conv-123',
  volunteerId: 'vol-456',
  userId: 'user-789',
  messages: [{
    role: 'user',
    content: 'I have 30 days sober but struggling with cravings',
    timestamp: new Date()
  }],
  latestUserMessage: 'I have 30 days sober but struggling with cravings',
}
```

**Execution Steps:**

```
1. [START]
   State: { conversationId: 'conv-123', ... }

2. [SUPERVISOR]
   Input: Initial state
   Analysis: Has new message, no crisis check done
   Decision: nextAction = 'crisis_check'
   Output: { ...state, nextAction: 'crisis_check', agentExecutionPath: ['supervisor'] }

3. [ROUTING]
   routeFromSupervisor(state) → 'crisis_check'

4. [CRISIS_CHECK]
   Input: { ...state, nextAction: 'crisis_check' }
   LLM Call: "Analyze message for crisis indicators"
   Tool Call: crisisAssessmentTool({ message: '...', conversationHistory: [] })
   Tool Result: { isCrisis: false, riskLevel: 'low', indicators: [], ... }
   Decision: nextAction = 'resource_search'
   Output: {
     ...state,
     crisisDetection: { isCrisis: false, riskLevel: 'low' },
     nextAction: 'resource_search',
     agentExecutionPath: [..., 'crisis_check']
   }

5. [ROUTING]
   Edge: crisis_check → supervisor

6. [SUPERVISOR]
   Input: State with crisis detection results
   Analysis: Crisis check done (no crisis), has new message
   Validation: Allows resource_search
   Decision: nextAction = 'resource_search'
   Output: { ...state, agentExecutionPath: [..., 'supervisor'] }

7. [ROUTING]
   routeFromSupervisor(state) → 'resource_search'

8. [RESOURCE_SEARCH]
   Input: { ...state, nextAction: 'resource_search' }
   LLM Call: "Extract topics and find resources"
   Tool Calls:
     - searchBigBookTool({ query: 'cravings sobriety', limit: 5 })
     - findReflectionTool({ topic: 'cravings early recovery', limit: 3 })
   Tool Results: [
     { title: 'Big Book p.24', excerpt: '...', score: 0.89 },
     { title: 'Daily Reflection Jan 15', excerpt: '...', score: 0.82 }
   ]
   Decision: No draft → nextAction = 'analyze_conversation'
   Output: {
     ...state,
     resourceSuggestions: [...],
     nextAction: 'analyze_conversation',
     agentExecutionPath: [..., 'resource_search']
   }

9. [ROUTING]
   Edge: resource_search → supervisor

10. [SUPERVISOR]
    Input: State with resources
    Analysis: Has resources, no draft to coach
    Decision: nextAction = 'analyze_conversation'
    Output: { ...state, agentExecutionPath: [..., 'supervisor'] }

11. [ROUTING]
    routeFromSupervisor(state) → 'analyze_conversation'

12. [ANALYZE_CONVERSATION]
    Input: { ...state, nextAction: 'analyze_conversation' }
    LLM Call: "Analyze conversation sentiment and topics"
    Tool Calls:
      - sentimentAnalysisTool({ conversationText: '...' })
      - topicExtractionTool({ conversationText: '...' })
    Tool Results: {
      sentiment: 'hopeful',
      topics: ['cravings', 'early recovery', '30 days sobriety'],
      phase: 'exploration',
      userState: '30 days sober, experiencing cravings, seeking support'
    }
    Decision: nextAction = 'complete'
    Output: {
      ...state,
      conversationAnalysis: { ... },
      nextAction: 'complete',
      agentExecutionPath: [..., 'analyze_conversation']
    }

13. [ROUTING]
    Edge: analyze_conversation → supervisor

14. [SUPERVISOR]
    Input: State with all analysis complete
    Analysis: All needed agents ran, no more work
    Decision: nextAction = 'complete'
    Output: { ...state, agentExecutionPath: [..., 'supervisor'] }

15. [ROUTING]
    routeFromSupervisor(state) → END

16. [END]
    Final state returned
```

**Final State:**
```javascript
{
  conversationId: 'conv-123',
  volunteerId: 'vol-456',
  userId: 'user-789',
  messages: [...],
  latestUserMessage: 'I have 30 days sober but struggling with cravings',

  // Agent results
  crisisDetection: {
    isCrisis: false,
    riskLevel: 'low',
    indicators: [],
    recommendedAction: 'Continue normal support'
  },
  resourceSuggestions: [
    { title: 'Big Book p.24', excerpt: '...', relevanceScore: 0.89 },
    { title: 'Daily Reflection Jan 15', excerpt: '...', relevanceScore: 0.82 }
  ],
  conversationAnalysis: {
    sentiment: 'hopeful',
    topics: ['cravings', 'early recovery', '30 days sobriety'],
    conversationPhase: 'exploration',
    userEmotionalState: '30 days sober, experiencing cravings, seeking support',
    conversationQuality: 8
  },

  // Metadata
  nextAction: 'complete',
  processingStartTime: 2025-01-15T10:00:00.000Z,
  processingEndTime: 2025-01-15T10:00:02.341Z,
  agentExecutionPath: [
    'supervisor',
    'crisis_check',
    'supervisor',
    'resource_search',
    'supervisor',
    'analyze_conversation',
    'supervisor'
  ]
}
```

**Processing Time**: 2,341ms

---

## API Layer

### Main API Endpoint

File: `src/app/api/volunteer/agent/route.js`

```javascript
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { runVolunteerSupport } from '@/lib/agents/volunteer/graph';
import { createInitialState } from '@/lib/agents/volunteer/state';
import clientPromise from '@/lib/mongodb';

export async function POST(request) {
  console.log('📥 Agent API: Request received');

  // 1. Authenticate volunteer
  const session = await getSession(request);
  if (!session?.user?.roles?.includes('volunteer_listener')) {
    return NextResponse.json(
      { error: 'Unauthorized - Volunteer role required' },
      { status: 403 }
    );
  }

  // 2. Parse request body
  const body = await request.json();
  const {
    conversationId,
    action = 'analyze_message',
    userMessage,
    volunteerDraft,
    waitTime = 0,
  } = body;

  // 3. Fetch conversation from database
  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const conversation = await db.collection('peer_support_conversations').findOne({
    _id: conversationId,
  });

  if (!conversation) {
    return NextResponse.json(
      { error: 'Conversation not found' },
      { status: 404 }
    );
  }

  // 4. Prepare messages
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

  // 5. Create initial state
  const initialState = createInitialState({
    conversationId,
    volunteerId: session.user.id,
    userId: conversation.userId,
    messages,
    latestUserMessage: userMessage,
    volunteerDraft,
    waitTime,
  });

  console.log('🚀 Running agent workflow...');

  // 6. Run agent workflow
  const agentResult = await runVolunteerSupport(initialState);

  const processingTime = agentResult.processingEndTime - agentResult.processingStartTime;

  console.log(`✅ Complete in ${processingTime}ms`);
  console.log(`🎯 Path: ${agentResult.agentExecutionPath.join(' → ')}`);

  // 7. Store crisis alert if detected
  if (agentResult.crisisDetection?.isCrisis) {
    console.log(`🚨 CRISIS: ${agentResult.crisisDetection.riskLevel}`);

    await db.collection('crisis_alerts').insertOne({
      conversationId,
      userId: conversation.userId,
      volunteerId: session.user.id,
      detectedAt: new Date(),
      riskLevel: agentResult.crisisDetection.riskLevel,
      indicators: agentResult.crisisDetection.indicators,
      recommendedAction: agentResult.crisisDetection.recommendedAction,
      resolved: false,
    });
  }

  // 8. Store analysis for record-keeping
  await db.collection('agent_analyses').insertOne({
    conversationId,
    volunteerId: session.user.id,
    userId: conversation.userId,
    timestamp: new Date(),
    action,
    analysis: {
      crisisDetection: agentResult.crisisDetection,
      resourceSuggestions: agentResult.resourceSuggestions,
      responseCoaching: agentResult.responseCoaching,
      conversationAnalysis: agentResult.conversationAnalysis,
      triageInfo: agentResult.triageInfo,
    },
    processingTimeMs: processingTime,
    agentExecutionPath: agentResult.agentExecutionPath,
  });

  // 9. Update performance metrics
  await updateAgentMetrics(db, agentResult, processingTime);

  // 10. Return results
  return NextResponse.json({
    success: true,
    analysis: {
      crisisDetection: agentResult.crisisDetection,
      resourceSuggestions: agentResult.resourceSuggestions,
      responseCoaching: agentResult.responseCoaching,
      conversationAnalysis: agentResult.conversationAnalysis,
      triageInfo: agentResult.triageInfo,
    },
    metadata: {
      processingTime,
      agentExecutionPath: agentResult.agentExecutionPath,
      timestamp: new Date().toISOString(),
    },
  });
}
```

### Streaming API Endpoint

File: `src/app/api/volunteer/agent/stream/route.js`

```javascript
import { getSession } from '@/lib/auth';
import { streamVolunteerSupport } from '@/lib/agents/volunteer/graph';
import { createInitialState } from '@/lib/agents/volunteer/state';
import clientPromise from '@/lib/mongodb';

export async function POST(request) {
  console.log('🌊 Streaming API: Request received');

  // Authentication and setup (same as main API)
  const session = await getSession(request);
  // ... validation ...

  const body = await request.json();
  const { conversationId, userMessage, volunteerDraft, waitTime } = body;

  // ... fetch conversation, prepare messages ...

  const initialState = createInitialState({
    conversationId,
    volunteerId: session.user.id,
    userId: conversation.userId,
    messages,
    latestUserMessage: userMessage,
    volunteerDraft,
    waitTime,
  });

  console.log('🌊 Starting streaming execution...');

  // Create Server-Sent Events stream
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

        let lastAgentName = null;
        let eventCount = 0;

        // Stream agent execution
        for await (const event of streamVolunteerSupport(initialState)) {
          eventCount++;

          // Each event is a state update from an agent
          const agentName = Object.keys(event)[0];
          const agentState = event[agentName];

          console.log(`📡 Event #${eventCount}: ${agentName}`);

          // Send agent start notification
          if (agentName !== lastAgentName) {
            sendEvent('agent_start', {
              agent: agentName,
              message: getAgentStartMessage(agentName),
              timestamp: new Date().toISOString(),
            });
            lastAgentName = agentName;
          }

          // Send specific result events
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

          // ... more event types
        }

        // Send completion event
        sendEvent('complete', {
          message: 'Agent workflow complete',
          timestamp: new Date().toISOString(),
          totalEvents: eventCount,
        });

        console.log(`✅ Streaming complete: ${eventCount} events`);
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
      'X-Accel-Buffering': 'no',
    },
  });
}

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
```

---

## Frontend Integration

### React Component

File: `src/components/Volunteer/Chat/AgenticVolunteerChat.js`

```javascript
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Card, Typography, Alert } from '@mui/material';

export default function AgenticVolunteerChat({ conversationId }) {
  const [messages, setMessages] = useState([]);
  const [draftResponse, setDraftResponse] = useState('');
  const [agentAnalysis, setAgentAnalysis] = useState(null);
  const [agentLoading, setAgentLoading] = useState(false);

  const analysisTimeoutRef = useRef(null);

  // Analyze incoming user message
  const analyzeMessage = useCallback(async (userMessage) => {
    setAgentLoading(true);

    try {
      const response = await fetch('/api/volunteer/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          action: 'analyze_message',
          userMessage,
        }),
      });

      if (!response.ok) throw new Error('Analysis failed');

      const data = await response.json();
      setAgentAnalysis(data.analysis);

      // Show crisis alert if detected
      if (data.analysis.crisisDetection?.isCrisis) {
        showCrisisNotification(data.analysis.crisisDetection);
      }
    } catch (error) {
      console.error('Agent error:', error);
    } finally {
      setAgentLoading(false);
    }
  }, [conversationId]);

  // Analyze volunteer draft (debounced)
  const analyzeDraft = useCallback(async (draft) => {
    if (!draft || draft.trim().length < 10) return;

    const latestUserMessage = messages
      .filter(m => m.role === 'user')
      .slice(-1)[0]?.content;

    if (!latestUserMessage) return;

    try {
      const response = await fetch('/api/volunteer/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          action: 'coach_response',
          volunteerDraft: draft,
          userMessage: latestUserMessage,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAgentAnalysis(prev => ({
          ...prev,
          responseCoaching: data.analysis.responseCoaching,
        }));
      }
    } catch (error) {
      console.error('Draft analysis error:', error);
    }
  }, [conversationId, messages]);

  // Debounced draft analysis
  useEffect(() => {
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }

    if (draftResponse) {
      analysisTimeoutRef.current = setTimeout(() => {
        analyzeDraft(draftResponse);
      }, 2000); // 2 second delay
    }

    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, [draftResponse, analyzeDraft]);

  const showCrisisNotification = (crisisDetection) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🚨 Crisis Detected', {
        body: `Risk: ${crisisDetection.riskLevel}\n${crisisDetection.recommendedAction}`,
        requireInteraction: true,
      });
    }
  };

  return (
    <Box display="flex" height="100vh">
      {/* Chat Area */}
      <Box flex={1}>
        {/* Messages, input, etc. */}
      </Box>

      {/* AI Assistant Panel */}
      <Box width={400} borderLeft={1} p={2}>
        <Typography variant="h6">AI Assistant</Typography>

        {/* Crisis Alert */}
        {agentAnalysis?.crisisDetection?.isCrisis && (
          <Alert severity="error" sx={{ mb: 2 }}>
            🚨 Crisis Detected - {agentAnalysis.crisisDetection.riskLevel}
            <Typography variant="body2">
              {agentAnalysis.crisisDetection.recommendedAction}
            </Typography>
          </Alert>
        )}

        {/* Resource Suggestions */}
        {agentAnalysis?.resourceSuggestions?.length > 0 && (
          <Card sx={{ mb: 2 }}>
            <Typography variant="subtitle1">Suggested Resources</Typography>
            {agentAnalysis.resourceSuggestions.map((resource, idx) => (
              <Box key={idx}>
                <Typography variant="body2">{resource.title}</Typography>
                <Typography variant="caption">{resource.excerpt}</Typography>
              </Box>
            ))}
          </Card>
        )}

        {/* Response Coaching */}
        {agentAnalysis?.responseCoaching && (
          <Card sx={{ mb: 2 }}>
            <Typography variant="subtitle1">Response Coaching</Typography>
            <Typography>
              Empathy: {agentAnalysis.responseCoaching.empathyScore}/10
            </Typography>
            <Typography>
              Quality: {agentAnalysis.responseCoaching.qualityScore}/10
            </Typography>
            {/* Strengths, improvements, etc. */}
          </Card>
        )}

        {/* Conversation Insights */}
        {agentAnalysis?.conversationAnalysis && (
          <Card>
            <Typography variant="subtitle1">Insights</Typography>
            <Typography>
              Sentiment: {agentAnalysis.conversationAnalysis.sentiment}
            </Typography>
            <Typography>
              Topics: {agentAnalysis.conversationAnalysis.topics.join(', ')}
            </Typography>
          </Card>
        )}
      </Box>
    </Box>
  );
}
```

### Streaming Example

```javascript
// Using Server-Sent Events
const eventSource = new EventSource('/api/volunteer/agent/stream', {
  method: 'POST',
  body: JSON.stringify({
    conversationId: 'conv-123',
    userMessage: 'I need help'
  })
});

eventSource.addEventListener('start', (event) => {
  const data = JSON.parse(event.data);
  console.log('Starting:', data.message);
});

eventSource.addEventListener('agent_start', (event) => {
  const data = JSON.parse(event.data);
  showProgress(data.agent, data.message);
  // "Checking for crisis indicators..."
});

eventSource.addEventListener('crisis_detection', (event) => {
  const data = JSON.parse(event.data);
  if (data.crisisDetection.isCrisis) {
    showCrisisAlert(data.crisisDetection);
  }
});

eventSource.addEventListener('resources_found', (event) => {
  const data = JSON.parse(event.data);
  displayResources(data.resourceSuggestions);
});

eventSource.addEventListener('complete', (event) => {
  const data = JSON.parse(event.data);
  console.log('Complete! Events:', data.totalEvents);
  eventSource.close();
});

eventSource.addEventListener('error', (event) => {
  console.error('Stream error:', event);
  eventSource.close();
});
```

---

## Summary

### Key Files and Their Roles

| File | Type | Purpose |
|------|------|---------|
| `state.js` | Schema | Defines state structure with Zod |
| `tools.js` | Tools | 10 capabilities for agents |
| `graph.js` | Orchestration | Builds and compiles StateGraph |
| `nodes/*.js` | Agents | Individual agent implementations |
| `api/agent/route.js` | API | HTTP endpoint for execution |
| `api/agent/stream/route.js` | API | SSE endpoint for streaming |
| `AgenticVolunteerChat.js` | UI | React component for volunteers |

### Architecture Flow

```
User Input
   ↓
API Endpoint (/api/volunteer/agent)
   ↓
Create Initial State
   ↓
Invoke Graph (volunteerSupportGraph)
   ↓
┌─────────────────────────────┐
│  Graph Execution            │
│                             │
│  START                      │
│    ↓                        │
│  supervisor (decides)       │
│    ↓                        │
│  [crisis_check, resources,  │
│   coach, analyze, triage]   │
│    ↓                        │
│  supervisor (routes)        │
│    ↓                        │
│  END                        │
└─────────────────────────────┘
   ↓
Final State with Results
   ↓
Store in Database
   ↓
Return to Client
   ↓
Display in UI
```

### Core Concepts Summary

- **Nodes**: Agent functions that process state
- **Edges**: Routing between agents (regular or conditional)
- **Tools**: Capabilities bound to LLMs (database queries, calculations)
- **State**: Shared memory flowing through graph
- **Graph**: Compiled workflow orchestrator
- **Supervisor**: Central coordinator that routes execution
- **Streaming**: Real-time updates via Server-Sent Events

This architecture enables:
- ✅ Modular, specialized agents
- ✅ Explainable AI (execution path tracking)
- ✅ Safety-first design (crisis always checked first)
- ✅ Real-time progress updates
- ✅ Composability (easy to add new agents)
- ✅ Tool augmentation (LLMs + capabilities)

---

*This document provides the complete technical architecture of the Agentic AI system. For usage examples and testing, see `VOLUNTEER_AGENT_TESTING.md`.*
