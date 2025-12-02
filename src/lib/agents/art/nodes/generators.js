import GeneratedArt from '../../../models/GeneratedArt.js';
import {
  generateDailyReflectionArt,
  generateStepIllustration,
  generateMilestoneBadge,
  generateSeasonalGraphic,
} from '../tools.js';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ART GENERATION NODES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Each generator node handles one type of art generation:
 * 1. Gets the current item from state
 * 2. Calls the appropriate DALL-E tool
 * 3. Saves to MongoDB
 * 4. Updates state with results
 * 5. Increments the current item index
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Helper function to save generated art to database
 */
async function saveGeneratedArt(artData, configuration) {
  try {
    const generatedArt = new GeneratedArt({
      art_type: artData.art_type,
      content_reference: {
        reference_key: artData.reference.key,
        reference_value: artData.reference.value,
      },
      prompt: {
        original_prompt: artData.original_prompt,
        enhanced_prompt: artData.enhanced_prompt,
        generation_model: 'dall-e-3',
        model_parameters: artData.model_parameters,
      },
      image: {
        url: artData.image_url,
        // stored_url will be set later when we move to permanent storage
        width: artData.model_parameters.size.split('x')[0],
        height: artData.model_parameters.size.split('x')[1],
        format: 'png',
      },
      style_characteristics: artData.style_characteristics,
      generation: {
        requested_at: new Date(),
        completed_at: new Date(),
        duration_ms: 0, // Will be calculated by MongoDB timestamps
        attempt_number: 1,
        cost_usd: artData.cost_usd,
      },
      status: 'completed',
      quality_review: {
        auto_approved: configuration.auto_approve,
        manual_review_required: configuration.manual_review_required,
        approved: configuration.auto_approve ? true : undefined,
      },
    });

    await generatedArt.save();
    console.log(`💾 Saved to database with ID: ${generatedArt._id}`);

    return generatedArt;
  } catch (error) {
    console.error('Error saving generated art:', error);
    throw error;
  }
}

/**
 * Generate Daily Reflection Art Node
 */
export async function generateDailyReflectionNode(state) {
  console.log('📅 Generating daily reflection art...');

  const currentIndex = state.current_item_index || 0;
  const currentItem = state.generation_items[currentIndex];

  try {
    // Call the DALL-E tool
    const result = await generateDailyReflectionArt.invoke({
      reflection_text: currentItem.content_data?.text || 'Daily reflection on recovery and sobriety',
      reflection_date: currentItem.reference_value,
      style_level: state.configuration.ghibli_style_level,
    });

    const artData = JSON.parse(result);

    if (!artData.success) {
      throw new Error(artData.error);
    }

    // Save to database
    const savedArt = await saveGeneratedArt(artData, state.configuration);

    console.log(`✅ Successfully generated daily reflection art for ${currentItem.reference_value}`);

    return {
      current_item_index: currentIndex + 1,
      successful_generations: 1,
      total_cost_usd: artData.cost_usd,
      total_api_calls: 1,
      generated_art: [{
        asset_id: savedArt.asset_id,
        reference: artData.reference,
        image_url: artData.image_url,
        cost_usd: artData.cost_usd,
      }],
      execution_path: ['generate_daily_reflection'],
    };
  } catch (error) {
    console.error('❌ Error generating daily reflection art:', error);

    return {
      current_item_index: currentIndex + 1,
      failed_generations: 1,
      errors: [{
        item_reference: `${currentItem.reference_key}=${currentItem.reference_value}`,
        error_type: 'generation_failed',
        message: error.message,
        timestamp: new Date(),
      }],
      execution_path: ['generate_daily_reflection'],
    };
  }
}

/**
 * Generate Step Illustration Node
 */
export async function generateStepIllustrationNode(state) {
  console.log('👣 Generating step illustration...');

  const currentIndex = state.current_item_index || 0;
  const currentItem = state.generation_items[currentIndex];

  try {
    const stepNumber = parseInt(currentItem.reference_value, 10);

    // Call the DALL-E tool
    const result = await generateStepIllustration.invoke({
      step_number: stepNumber,
      step_text: currentItem.content_data?.text || `Step ${stepNumber} of Alcoholics Anonymous`,
      style_level: state.configuration.ghibli_style_level,
    });

    const artData = JSON.parse(result);

    if (!artData.success) {
      throw new Error(artData.error);
    }

    // Save to database
    const savedArt = await saveGeneratedArt(artData, state.configuration);

    console.log(`✅ Successfully generated step ${stepNumber} illustration`);

    return {
      current_item_index: currentIndex + 1,
      successful_generations: 1,
      total_cost_usd: artData.cost_usd,
      total_api_calls: 1,
      generated_art: [{
        asset_id: savedArt.asset_id,
        reference: artData.reference,
        image_url: artData.image_url,
        cost_usd: artData.cost_usd,
      }],
      execution_path: ['generate_step_illustration'],
    };
  } catch (error) {
    console.error('❌ Error generating step illustration:', error);

    return {
      current_item_index: currentIndex + 1,
      failed_generations: 1,
      errors: [{
        item_reference: `${currentItem.reference_key}=${currentItem.reference_value}`,
        error_type: 'generation_failed',
        message: error.message,
        timestamp: new Date(),
      }],
      execution_path: ['generate_step_illustration'],
    };
  }
}

/**
 * Generate Milestone Badge Node
 */
export async function generateMilestoneBadgeNode(state) {
  console.log('🏆 Generating milestone badge...');

  const currentIndex = state.current_item_index || 0;
  const currentItem = state.generation_items[currentIndex];

  try {
    // Call the DALL-E tool
    const result = await generateMilestoneBadge.invoke({
      milestone_type: currentItem.reference_value,
      milestone_days: currentItem.content_data?.days || 0,
      style_level: state.configuration.ghibli_style_level,
    });

    const artData = JSON.parse(result);

    if (!artData.success) {
      throw new Error(artData.error);
    }

    // Save to database
    const savedArt = await saveGeneratedArt(artData, state.configuration);

    console.log(`✅ Successfully generated milestone badge for ${currentItem.reference_value}`);

    return {
      current_item_index: currentIndex + 1,
      successful_generations: 1,
      total_cost_usd: artData.cost_usd,
      total_api_calls: 1,
      generated_art: [{
        asset_id: savedArt.asset_id,
        reference: artData.reference,
        image_url: artData.image_url,
        cost_usd: artData.cost_usd,
      }],
      execution_path: ['generate_milestone_badge'],
    };
  } catch (error) {
    console.error('❌ Error generating milestone badge:', error);

    return {
      current_item_index: currentIndex + 1,
      failed_generations: 1,
      errors: [{
        item_reference: `${currentItem.reference_key}=${currentItem.reference_value}`,
        error_type: 'generation_failed',
        message: error.message,
        timestamp: new Date(),
      }],
      execution_path: ['generate_milestone_badge'],
    };
  }
}

/**
 * Generate Seasonal Graphic Node
 */
export async function generateSeasonalGraphicNode(state) {
  console.log('🌸 Generating seasonal graphic...');

  const currentIndex = state.current_item_index || 0;
  const currentItem = state.generation_items[currentIndex];

  try {
    // Call the DALL-E tool
    const result = await generateSeasonalGraphic.invoke({
      season: currentItem.reference_value,
      theme: currentItem.content_data?.theme || 'recovery and renewal',
      style_level: state.configuration.ghibli_style_level,
    });

    const artData = JSON.parse(result);

    if (!artData.success) {
      throw new Error(artData.error);
    }

    // Save to database
    const savedArt = await saveGeneratedArt(artData, state.configuration);

    console.log(`✅ Successfully generated seasonal graphic for ${currentItem.reference_value}`);

    return {
      current_item_index: currentIndex + 1,
      successful_generations: 1,
      total_cost_usd: artData.cost_usd,
      total_api_calls: 1,
      generated_art: [{
        asset_id: savedArt.asset_id,
        reference: artData.reference,
        image_url: artData.image_url,
        cost_usd: artData.cost_usd,
      }],
      execution_path: ['generate_seasonal_graphic'],
    };
  } catch (error) {
    console.error('❌ Error generating seasonal graphic:', error);

    return {
      current_item_index: currentIndex + 1,
      failed_generations: 1,
      errors: [{
        item_reference: `${currentItem.reference_key}=${currentItem.reference_value}`,
        error_type: 'generation_failed',
        message: error.message,
        timestamp: new Date(),
      }],
      execution_path: ['generate_seasonal_graphic'],
    };
  }
}
