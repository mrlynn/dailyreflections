import { StateGraph, END } from '@langchain/langgraph';
import { supervisorNode } from './nodes/supervisor';
import {
  collectVolunteerMetricsNode,
  collectMeetingDataNode,
  collectSupportDataNode,
  collectJourneyDataNode,
} from './nodes/dataCollector';
import { generateInsightsNode } from './nodes/insightsGenerator';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYSTEM OBSERVATION AGENT GRAPH
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This is a scheduled agentic AI system that monitors platform health and
 * generates actionable insights for administrators.
 *
 * Unlike the volunteer support agent (real-time, chat-based), this agent:
 * - Runs on a schedule (hourly, daily, weekly)
 * - Analyzes aggregate data across the entire platform
 * - Generates strategic insights rather than real-time responses
 * - Focuses on resource allocation and trend detection
 *
 * ─────────────────────────────────────────────────────────────────────────
 * GRAPH ARCHITECTURE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Flow:
 * 1. Supervisor decides what data to collect next
 * 2. Data collector nodes gather metrics from MongoDB
 * 3. Once all data is collected, insights generator analyzes patterns
 * 4. Supervisor marks as complete
 *
 * Visual representation:
 *
 *     START
 *       │
 *       ▼
 *  ┌──────────┐
 *  │Supervisor│◄─────┐
 *  └────┬─────┘      │
 *       │            │
 *  ┌────┴────────────┴─────┐
 *  │ Conditional Routing   │
 *  └────┬────────────┬─────┘
 *       │            │
 *       ▼            ▼
 *  ┌─────────┐  ┌─────────────┐
 *  │Volunteer│  │  Meeting    │
 *  │ Metrics │  │ Attendance  │
 *  └────┬────┘  └──────┬──────┘
 *       │              │
 *       │     ┌────────┴────────┐
 *       │     │                 │
 *       ▼     ▼                 ▼
 *  ┌─────────┐  ┌──────────────┐
 *  │Support  │  │   Journey    │
 *  │Hotspots │  │  Analytics   │
 *  └────┬────┘  └──────┬───────┘
 *       │              │
 *       └──────┬───────┘
 *              ▼
 *      ┌───────────────┐
 *      │   Insights    │
 *      │   Generator   │
 *      └───────┬───────┘
 *              │
 *              ▼
 *          Supervisor
 *              │
 *              ▼
 *             END
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * ─────────────────────────────────────────────────────────────────────────
 * STATE CHANNELS
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Define how state updates are merged. Similar to the volunteer agent,
 * but focused on observation-specific data.
 */
const graphState = {
  // Metadata
  observation_id: {
    value: (x, y) => y ?? x,
    default: () => null,
  },
  observation_type: {
    value: (x, y) => y ?? x,
    default: () => 'on-demand',
  },
  time_period: {
    value: (x, y) => y ?? x,
    default: () => ({
      start: new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: new Date(),
    }),
  },

  // Collected metrics (replace strategy - each node populates once)
  volunteer_metrics: {
    value: (x, y) => y ?? x,
    default: () => null,
  },
  meeting_attendance: {
    value: (x, y) => y ?? x,
    default: () => null,
  },
  support_hotspots: {
    value: (x, y) => y ?? x,
    default: () => null,
  },
  journey_analytics: {
    value: (x, y) => y ?? x,
    default: () => null,
  },

  // Analysis results
  insights: {
    value: (x, y) => y ?? x,
    default: () => null,
  },
  alerts: {
    value: (x, y) => y ?? x,
    default: () => [],
  },
  trends: {
    value: (x, y) => y ?? x,
    default: () => [],
  },

  // Routing
  nextAction: {
    value: (x, y) => y ?? x,
    default: () => null,
  },

  // Output
  summary_report: {
    value: (x, y) => y ?? x,
    default: () => null,
  },

  // Tracking
  processing_start_time: {
    value: (x, y) => y ?? x,
    default: () => new Date(),
  },
  processing_end_time: {
    value: (x, y) => y ?? x,
    default: () => null,
  },
  execution_path: {
    // Accumulate strategy - build up array of nodes executed
    value: (x, y) => {
      if (!y) return x || [];
      if (!x) return y;
      return [...x, ...y];
    },
    default: () => [],
  },
  errors: {
    // Accumulate errors
    value: (x, y) => {
      if (!y) return x || [];
      if (!x) return y;
      return [...x, ...y];
    },
    default: () => [],
  },
};

/**
 * ─────────────────────────────────────────────────────────────────────────
 * ROUTING FUNCTION
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Determines which node to execute next based on supervisor's decision
 */
function routeObservation(state) {
  const action = state.nextAction;

  console.log(`🔀 Routing to: ${action}`);

  switch (action) {
    case 'collect_volunteer_metrics':
      return 'collect_volunteer_metrics';
    case 'collect_meeting_data':
      return 'collect_meeting_data';
    case 'collect_support_data':
      return 'collect_support_data';
    case 'collect_journey_data':
      return 'collect_journey_data';
    case 'generate_insights':
      return 'generate_insights';
    case 'complete':
      return END;
    default:
      console.warn(`Unknown action: ${action}, defaulting to complete`);
      return END;
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * GRAPH CONSTRUCTION
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Build the state graph by:
 * 1. Creating a new StateGraph with our state channels
 * 2. Adding all nodes
 * 3. Defining edges (entry point and routing)
 * 4. Compiling the graph
 */
const workflow = new StateGraph({
  channels: graphState,
});

// Add nodes
workflow.addNode('supervisor', supervisorNode);
workflow.addNode('collect_volunteer_metrics', collectVolunteerMetricsNode);
workflow.addNode('collect_meeting_data', collectMeetingDataNode);
workflow.addNode('collect_support_data', collectSupportDataNode);
workflow.addNode('collect_journey_data', collectJourneyDataNode);
workflow.addNode('generate_insights', generateInsightsNode);

// Set entry point
workflow.setEntryPoint('supervisor');

// Add conditional edges from supervisor to specialized nodes
workflow.addConditionalEdges('supervisor', routeObservation);

// All specialized nodes return to supervisor for next decision
workflow.addEdge('collect_volunteer_metrics', 'supervisor');
workflow.addEdge('collect_meeting_data', 'supervisor');
workflow.addEdge('collect_support_data', 'supervisor');
workflow.addEdge('collect_journey_data', 'supervisor');
workflow.addEdge('generate_insights', 'supervisor');

// Compile the graph
const observationGraph = workflow.compile();

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GRAPH EXECUTION FUNCTION
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Runs the observation agent with the given parameters
 *
 * @param {Object} params - Observation parameters
 * @param {string} params.observationType - 'hourly', 'daily', 'weekly', or 'on-demand'
 * @param {Date} params.startTime - Start of observation period
 * @param {Date} params.endTime - End of observation period
 * @returns {Promise<Object>} - Final state with insights and metrics
 */
export async function runObservationAgent(params = {}) {
  console.log('🚀 Starting System Observation Agent...');

  const now = new Date();

  // Create initial state
  const initialState = {
    observation_id: params.observationId || `obs_${Date.now()}`,
    observation_type: params.observationType || 'on-demand',
    time_period: {
      start: params.startTime || new Date(now.getTime() - 24 * 60 * 60 * 1000), // Last 24 hours
      end: params.endTime || now,
    },
    processing_start_time: now,
    execution_path: [],
    errors: [],
  };

  console.log(`📅 Observation period: ${initialState.time_period.start.toLocaleString()} - ${initialState.time_period.end.toLocaleString()}`);

  try {
    // Run the graph
    const result = await observationGraph.invoke(initialState);

    console.log('✅ Observation complete!');
    console.log(`📊 Execution path: ${result.execution_path.join(' → ')}`);

    if (result.errors && result.errors.length > 0) {
      console.warn(`⚠️  Errors encountered: ${result.errors.length}`);
      result.errors.forEach(err => console.warn(`   - ${err}`));
    }

    return result;
  } catch (error) {
    console.error('❌ Error running observation agent:', error);
    throw error;
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EXPORTS
 * ═══════════════════════════════════════════════════════════════════════════
 */
export default observationGraph;
export { graphState, routeObservation };
