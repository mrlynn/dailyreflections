/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GHIBLI ART DIRECTOR AGENT - STATE DEFINITION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Defines the state structure for the art generation agent.
 * State is passed between nodes in the LangGraph workflow.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Initial state structure for the Art Director Agent
 *
 * This is a plain JavaScript object that gets passed through the graph nodes.
 * Each node can read from and update this state.
 */
export function createInitialState(request) {
  return {
    // Generation request metadata
    generation_request_id: request.generation_request_id || `art_${Date.now()}`,
    request_type: request.request_type,
    trigger_type: request.trigger_type,
    initiated_by: request.initiated_by || null,

    // What to generate
    art_type: request.art_type,
    generation_items: request.generation_items || [],

    // Configuration
    configuration: {
      ghibli_style_level: request.configuration?.ghibli_style_level || 'moderate',
      quality_setting: request.configuration?.quality_setting || 'standard',
      auto_approve: request.configuration?.auto_approve !== false,
      manual_review_required: request.configuration?.manual_review_required || false,
    },

    // Execution tracking
    current_item_index: 0,
    total_items: request.generation_items?.length || 0,
    processing_start_time: new Date(),
    processing_end_time: null,

    // Results tracking (accumulated arrays)
    generated_art: [],

    // Counts
    successful_generations: 0,
    failed_generations: 0,
    skipped_generations: 0,

    // Cost tracking
    total_cost_usd: 0,
    total_api_calls: 0,

    // Error tracking
    errors: [],

    // Execution path (for debugging)
    execution_path: [],

    // Next action (for supervisor routing)
    nextAction: null,

    // Status
    status: 'running',
  };
}

/**
 * State reducer functions
 *
 * These functions handle how state updates are merged.
 * Arrays are accumulated, numbers are added, single values are replaced.
 */
export const stateReducers = {
  // Replace single values
  replaceValue: (oldValue, newValue) => newValue,

  // Accumulate arrays
  accumulateArray: (oldArray, newItems) => {
    if (!Array.isArray(newItems)) {
      return [...(oldArray || []), newItems];
    }
    return [...(oldArray || []), ...newItems];
  },

  // Add numbers
  addNumbers: (oldValue, increment) => (oldValue || 0) + (increment || 0),
};
