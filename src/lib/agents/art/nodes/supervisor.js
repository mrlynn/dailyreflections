/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ART DIRECTOR SUPERVISOR NODE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The supervisor orchestrates the art generation workflow:
 * 1. Checks if there are more items to generate
 * 2. Routes to the appropriate generator based on art type
 * 3. Continues until all items are processed
 * 4. Marks as complete when finished
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

export async function supervisorNode(state) {
  console.log('🎯 Art Director Supervisor: Determining next action...');

  const currentIndex = state.current_item_index || 0;
  const totalItems = state.total_items || 0;

  console.log(`📊 Progress: ${currentIndex}/${totalItems} items processed`);
  console.log(`✅ Successful: ${state.successful_generations || 0}`);
  console.log(`❌ Failed: ${state.failed_generations || 0}`);
  console.log(`⏭️  Skipped: ${state.skipped_generations || 0}`);

  // Check if we're done
  if (currentIndex >= totalItems) {
    console.log('✅ All items processed - marking as complete');
    return {
      nextAction: 'complete',
      execution_path: ['supervisor'],
      status: 'completed',
      processing_end_time: new Date(),
    };
  }

  // Get the current item
  const currentItem = state.generation_items[currentIndex];
  console.log(`🎨 Next item: ${currentItem.reference_key}=${currentItem.reference_value}`);

  // Route based on art type
  let nextAction;
  switch (state.art_type) {
    case 'daily_reflection':
      nextAction = 'generate_daily_reflection';
      console.log('📅 → Generating daily reflection art...');
      break;
    case 'step_illustration':
      nextAction = 'generate_step_illustration';
      console.log('👣 → Generating step illustration...');
      break;
    case 'milestone_badge':
      nextAction = 'generate_milestone_badge';
      console.log('🏆 → Generating milestone badge...');
      break;
    case 'seasonal_graphic':
      nextAction = 'generate_seasonal_graphic';
      console.log('🌸 → Generating seasonal graphic...');
      break;
    default:
      console.error(`❌ Unknown art type: ${state.art_type}`);
      return {
        nextAction: 'complete',
        execution_path: ['supervisor'],
        status: 'failed',
        errors: [{
          item_reference: 'supervisor',
          error_type: 'unknown_art_type',
          message: `Unknown art type: ${state.art_type}`,
          timestamp: new Date(),
        }],
      };
  }

  return {
    nextAction,
    execution_path: ['supervisor'],
  };
}
