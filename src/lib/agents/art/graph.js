import { StateGraph, END } from '@langchain/langgraph';
import { createInitialState } from './state.js';
import { supervisorNode } from './nodes/supervisor.js';
import {
  generateDailyReflectionNode,
  generateStepIllustrationNode,
  generateMilestoneBadgeNode,
  generateSeasonalGraphicNode,
} from './nodes/generators.js';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GHIBLI ART DIRECTOR AGENT - MAIN GRAPH
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * LangGraph StateGraph that orchestrates the art generation workflow.
 *
 * ARCHITECTURE:
 * - Supervisor pattern with central hub
 * - Specialized generator nodes for each art type
 * - Loops through all items in the generation request
 * - Tracks costs, successes, failures
 *
 * FLOW:
 * 1. Start → Supervisor
 * 2. Supervisor → Generator (based on art type)
 * 3. Generator → Supervisor (with results)
 * 4. Repeat steps 2-3 until all items processed
 * 5. Supervisor → Complete (when done)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Router function for the supervisor
 * Determines which node to execute next based on nextAction
 */
function routeSupervisor(state) {
  const nextAction = state.nextAction;
  console.log(`🔀 Routing to: ${nextAction}`);
  return nextAction;
}

/**
 * Build the Art Director Agent Graph
 */
export function buildArtDirectorGraph() {
  // Create the state graph with plain object channels
  const workflow = new StateGraph({
    channels: {
      generation_request_id: null,
      request_type: null,
      trigger_type: null,
      initiated_by: null,
      art_type: null,
      generation_items: null,
      configuration: null,
      current_item_index: null,
      total_items: null,
      processing_start_time: null,
      processing_end_time: null,
      generated_art: null,
      successful_generations: null,
      failed_generations: null,
      skipped_generations: null,
      total_cost_usd: null,
      total_api_calls: null,
      errors: null,
      execution_path: null,
      nextAction: null,
      status: null,
    }
  });

  // Add nodes
  workflow.addNode('supervisor', supervisorNode);
  workflow.addNode('generate_daily_reflection', generateDailyReflectionNode);
  workflow.addNode('generate_step_illustration', generateStepIllustrationNode);
  workflow.addNode('generate_milestone_badge', generateMilestoneBadgeNode);
  workflow.addNode('generate_seasonal_graphic', generateSeasonalGraphicNode);

  // Set entry point
  workflow.addEdge('__start__', 'supervisor');

  // Add conditional edges from supervisor to generators
  workflow.addConditionalEdges('supervisor', routeSupervisor, {
    generate_daily_reflection: 'generate_daily_reflection',
    generate_step_illustration: 'generate_step_illustration',
    generate_milestone_badge: 'generate_milestone_badge',
    generate_seasonal_graphic: 'generate_seasonal_graphic',
    complete: END,
  });

  // Add edges from generators back to supervisor (feedback loop)
  workflow.addEdge('generate_daily_reflection', 'supervisor');
  workflow.addEdge('generate_step_illustration', 'supervisor');
  workflow.addEdge('generate_milestone_badge', 'supervisor');
  workflow.addEdge('generate_seasonal_graphic', 'supervisor');

  // Compile the graph
  const app = workflow.compile();

  return app;
}

/**
 * Run the Art Director Agent
 *
 * @param {Object} request - The generation request
 * @param {string} request.request_type - Type of request ('batch_daily', 'single_daily', etc.)
 * @param {string} request.art_type - Type of art to generate
 * @param {Array} request.generation_items - Items to generate
 * @param {Object} request.configuration - Generation configuration
 * @param {string} request.trigger_type - How this was triggered
 * @param {string} request.initiated_by - User ID who initiated (optional)
 * @returns {Object} Final state with all results
 */
export async function runArtDirectorAgent(request) {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🎨 GHIBLI ART DIRECTOR AGENT - STARTING');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Request Type: ${request.request_type}`);
  console.log(`Art Type: ${request.art_type}`);
  console.log(`Items to Generate: ${request.generation_items.length}`);
  console.log(`Style Level: ${request.configuration.ghibli_style_level}`);
  console.log(`Quality: ${request.configuration.quality_setting}`);
  console.log('═══════════════════════════════════════════════════════════════');

  try {
    // Generate unique request ID
    const requestId = `art_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Build initial state using the helper function
    const initialState = createInitialState({
      generation_request_id: requestId,
      request_type: request.request_type,
      trigger_type: request.trigger_type,
      initiated_by: request.initiated_by,
      art_type: request.art_type,
      generation_items: request.generation_items,
      configuration: request.configuration,
    });

    // Build and run the graph
    const graph = buildArtDirectorGraph();
    const finalState = await graph.invoke(initialState);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ ART DIRECTOR AGENT - COMPLETED');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Total Requested: ${finalState.total_items}`);
    console.log(`Successful: ${finalState.successful_generations || 0}`);
    console.log(`Failed: ${finalState.failed_generations || 0}`);
    console.log(`Skipped: ${finalState.skipped_generations || 0}`);
    console.log(`Total Cost: $${(finalState.total_cost_usd || 0).toFixed(4)}`);
    console.log(`Execution Path Length: ${(finalState.execution_path || []).length}`);
    console.log('═══════════════════════════════════════════════════════════════');

    return finalState;
  } catch (error) {
    console.error('═══════════════════════════════════════════════════════════════');
    console.error('❌ ART DIRECTOR AGENT - FAILED');
    console.error('═══════════════════════════════════════════════════════════════');
    console.error('Error:', error);
    console.error('═══════════════════════════════════════════════════════════════');
    throw error;
  }
}
