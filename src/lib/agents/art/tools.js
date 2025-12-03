import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import OpenAI from 'openai';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GHIBLI ART DIRECTOR AGENT - TOOLS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Tools for generating Studio Ghibli-style artwork using DALL-E 3.
 * Each tool specializes in a different type of art asset.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Ghibli Style Enhancement System
 *
 * Takes a basic prompt and enhances it with Ghibli characteristics:
 * - Soft, watercolor-like aesthetics
 * - Natural lighting and atmospheric depth
 * - Whimsical yet grounded elements
 * - Peaceful, contemplative mood
 * - Rich environmental details
 */
function enhanceWithGhibliStyle(basePrompt, styleLevel = 'moderate') {
  const ghibliElements = {
    subtle: {
      prefix: 'In a soft, illustrated style: ',
      suffix: '. Gentle lighting, peaceful atmosphere.',
    },
    moderate: {
      prefix: 'In the style of Studio Ghibli watercolor paintings: ',
      suffix: '. Soft natural lighting, atmospheric depth, serene and contemplative mood, delicate details.',
    },
    strong: {
      prefix: 'In the distinctive style of Studio Ghibli films, with watercolor textures and hand-painted aesthetics: ',
      suffix: '. Golden hour lighting filtering through clouds, rich atmospheric perspective with layers of depth, whimsical yet grounded elements, peaceful and hopeful mood, intricate natural details like swaying grass and dappled light, color palette of soft pastels with warm earth tones.',
    },
  };

  const enhancement = ghibliElements[styleLevel] || ghibliElements.moderate;
  return `${enhancement.prefix}${basePrompt}${enhancement.suffix}`;
}

/**
 * DALL-E 3 Image Generation
 */
async function generateImageWithDALLE(prompt, options = {}) {
  try {
    const {
      size = '1024x1024',
      quality = 'standard',
      style = 'natural',
    } = options;

    console.log('🎨 Generating image with DALL-E 3...');
    console.log('Prompt:', prompt);

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size,
      quality,
      style,
    });

    const imageUrl = response.data[0].url;
    const revisedPrompt = response.data[0].revised_prompt;

    console.log('✅ Image generated successfully');

    return {
      url: imageUrl,
      revised_prompt: revisedPrompt,
      model: 'dall-e-3',
      parameters: { size, quality, style },
    };
  } catch (error) {
    console.error('Error generating image with DALL-E:', error);
    throw error;
  }
}

/**
 * Cost calculation for DALL-E 3
 */
function calculateDALLECost(size, quality) {
  // DALL-E 3 pricing (as of 2024)
  const pricing = {
    'standard': {
      '1024x1024': 0.040,
      '1024x1792': 0.080,
      '1792x1024': 0.080,
    },
    'hd': {
      '1024x1024': 0.080,
      '1024x1792': 0.120,
      '1792x1024': 0.120,
    },
  };

  return pricing[quality]?.[size] || 0.040;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TOOL 1: Generate Daily Reflection Art
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const generateDailyReflectionArt = tool(
  async ({ reflection_text, reflection_date, style_level }) => {
    try {
      // Create base prompt from reflection content
      const basePrompt = `A peaceful scene representing this daily AA reflection: "${reflection_text.substring(0, 200)}...". The scene should evoke hope, serenity, and personal growth.`;

      // Enhance with Ghibli style
      const enhancedPrompt = enhanceWithGhibliStyle(basePrompt, style_level);

      // Generate image (landscape format for hero headers)
      const result = await generateImageWithDALLE(enhancedPrompt, {
        size: '1792x1024',
        quality: 'standard',
        style: 'natural',
      });

      const cost = calculateDALLECost('1792x1024', 'standard');

      return JSON.stringify({
        success: true,
        image_url: result.url,
        original_prompt: basePrompt,
        enhanced_prompt: enhancedPrompt,
        revised_prompt: result.revised_prompt,
        model_parameters: result.parameters,
        cost_usd: cost,
        art_type: 'daily_reflection',
        reference: {
          key: 'date',
          value: reflection_date,
        },
        style_characteristics: {
          color_palette: ['warm', 'pastel', 'nature-inspired'],
          mood: 'peaceful',
          elements: ['nature', 'sky', 'light'],
          composition: 'panoramic',
        },
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error.message,
      });
    }
  },
  {
    name: 'generate_daily_reflection_art',
    description: 'Generates a Studio Ghibli-style illustration for a daily AA reflection. Creates peaceful, hopeful imagery that complements the reflection text.',
    schema: z.object({
      reflection_text: z.string().describe('The text content of the daily reflection'),
      reflection_date: z.string().describe('The date of the reflection (YYYY-MM-DD format)'),
      style_level: z.enum(['subtle', 'moderate', 'strong']).default('moderate').describe('How strongly to apply Ghibli style'),
    }),
  }
);

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TOOL 2: Generate Step Illustration
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const generateStepIllustration = tool(
  async ({ step_number, step_text, style_level }) => {
    try {
      // Create base prompt from step content
      const stepThemes = {
        1: 'Admitting powerlessness, facing personal limitations, vulnerability',
        2: 'Higher power, hope, spiritual awakening, faith',
        3: 'Surrender, letting go, trust, decision to change',
        4: 'Self-examination, personal inventory, introspection',
        5: 'Confession, sharing truth, honesty with others',
        6: 'Readiness for change, acceptance, transformation',
        7: 'Humility, asking for help, spiritual connection',
        8: 'Making amends list, accountability, awareness of harm',
        9: 'Direct amends, healing relationships, making things right',
        10: 'Ongoing inventory, self-awareness, daily reflection',
        11: 'Prayer and meditation, spiritual practice, conscious contact',
        12: 'Service, helping others, spiritual awakening, carrying the message',
      };

      const theme = stepThemes[step_number] || 'personal growth and recovery';
      const basePrompt = `An symbolic illustration representing AA Step ${step_number}: ${theme}. Visual metaphor for "${step_text.substring(0, 150)}...". Hopeful, transformative, and spiritually uplifting.`;

      // Enhance with Ghibli style
      const enhancedPrompt = enhanceWithGhibliStyle(basePrompt, style_level);

      // Generate image
      const result = await generateImageWithDALLE(enhancedPrompt, {
        size: '1024x1024',
        quality: 'standard',
        style: 'natural',
      });

      const cost = calculateDALLECost('1024x1024', 'standard');

      return JSON.stringify({
        success: true,
        image_url: result.url,
        original_prompt: basePrompt,
        enhanced_prompt: enhancedPrompt,
        revised_prompt: result.revised_prompt,
        model_parameters: result.parameters,
        cost_usd: cost,
        art_type: 'step_illustration',
        reference: {
          key: 'step_number',
          value: step_number.toString(),
        },
        style_characteristics: {
          color_palette: ['warm', 'hopeful', 'spiritual'],
          mood: 'transformative',
          elements: ['symbolic', 'metaphorical', 'light'],
          composition: 'centered',
        },
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error.message,
      });
    }
  },
  {
    name: 'generate_step_illustration',
    description: 'Generates a Studio Ghibli-style illustration for one of the 12 steps of AA. Creates symbolic, hopeful imagery representing the step theme.',
    schema: z.object({
      step_number: z.number().min(1).max(12).describe('The step number (1-12)'),
      step_text: z.string().describe('The text content of the step'),
      style_level: z.enum(['subtle', 'moderate', 'strong']).default('moderate').describe('How strongly to apply Ghibli style'),
    }),
  }
);

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TOOL 3: Generate Milestone Badge
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const generateMilestoneBadge = tool(
  async ({ milestone_type, milestone_days, style_level }) => {
    try {
      // Create base prompt for milestone badge
      const milestoneThemes = {
        '24_hours': 'First 24 hours of sobriety - new beginning, hope, fresh start',
        '7_days': 'One week - early strength, daily commitment, building foundation',
        '30_days': 'One month - significant progress, growing confidence, establishing habits',
        '60_days': 'Two months - deepening commitment, steady progress, resilience',
        '90_days': 'Three months - major milestone, transformation visible, strong foundation',
        '6_months': 'Six months - sustained recovery, life changes, renewed purpose',
        '1_year': 'One year - full cycle of seasons, major achievement, celebration',
        '18_months': 'Eighteen months - deepening wisdom, helping others, gratitude',
        '2_years': 'Two years - long-term recovery, stable foundation, inspiring others',
        '5_years': 'Five years - veteran recovery, profound transformation, legacy',
        '10_years': 'Ten years - decade of sobriety, wisdom, spiritual growth',
      };

      const theme = milestoneThemes[milestone_type] || `${milestone_days} days of recovery achievement`;
      const basePrompt = `A celebratory badge or emblem design representing ${theme}. Should feel like an achievement, with symbols of growth, light, and personal transformation. Include subtle visual reference to the time period.`;

      // Enhance with Ghibli style
      const enhancedPrompt = enhanceWithGhibliStyle(basePrompt, style_level);

      // Generate image
      const result = await generateImageWithDALLE(enhancedPrompt, {
        size: '1024x1024',
        quality: 'standard',
        style: 'natural',
      });

      const cost = calculateDALLECost('1024x1024', 'standard');

      return JSON.stringify({
        success: true,
        image_url: result.url,
        original_prompt: basePrompt,
        enhanced_prompt: enhancedPrompt,
        revised_prompt: result.revised_prompt,
        model_parameters: result.parameters,
        cost_usd: cost,
        art_type: 'milestone_badge',
        reference: {
          key: 'milestone_type',
          value: milestone_type,
        },
        style_characteristics: {
          color_palette: ['celebratory', 'gold', 'warm'],
          mood: 'achievement',
          elements: ['badge', 'emblem', 'growth symbols'],
          composition: 'centered',
        },
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error.message,
      });
    }
  },
  {
    name: 'generate_milestone_badge',
    description: 'Generates a Studio Ghibli-style badge or emblem for recovery milestones (24 hours, 30 days, 1 year, etc.). Creates celebratory, achievement-focused imagery.',
    schema: z.object({
      milestone_type: z.string().describe('The type of milestone (e.g., "24_hours", "30_days", "1_year")'),
      milestone_days: z.number().describe('Number of days represented by this milestone'),
      style_level: z.enum(['subtle', 'moderate', 'strong']).default('moderate').describe('How strongly to apply Ghibli style'),
    }),
  }
);

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TOOL 4: Generate Seasonal Graphic
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const generateSeasonalGraphic = tool(
  async ({ season, theme, style_level }) => {
    try {
      // Create base prompt for seasonal graphic
      const seasonalThemes = {
        spring: 'New beginnings, renewal, cherry blossoms, fresh growth, hope awakening',
        summer: 'Warmth, vitality, long days, vibrant life, abundance of light',
        fall: 'Transformation, letting go, beautiful change, harvest, gratitude',
        winter: 'Rest, reflection, inner peace, quiet strength, preparation for renewal',
      };

      const seasonTheme = seasonalThemes[season.toLowerCase()] || 'seasonal beauty and natural cycles';
      const basePrompt = `A seasonal landscape representing ${season} with themes of ${theme}. Emphasize ${seasonTheme}. Should evoke the spirit of recovery and personal growth within the natural cycle of seasons.`;

      // Enhance with Ghibli style
      const enhancedPrompt = enhanceWithGhibliStyle(basePrompt, style_level);

      // Generate image
      const result = await generateImageWithDALLE(enhancedPrompt, {
        size: '1792x1024', // Wide format for seasonal banners
        quality: 'standard',
        style: 'natural',
      });

      const cost = calculateDALLECost('1792x1024', 'standard');

      return JSON.stringify({
        success: true,
        image_url: result.url,
        original_prompt: basePrompt,
        enhanced_prompt: enhancedPrompt,
        revised_prompt: result.revised_prompt,
        model_parameters: result.parameters,
        cost_usd: cost,
        art_type: 'seasonal_graphic',
        reference: {
          key: 'season',
          value: season.toLowerCase(),
        },
        style_characteristics: {
          color_palette: [`${season.toLowerCase()}-themed`, 'natural', 'harmonious'],
          mood: 'seasonal',
          elements: ['landscape', 'nature', 'atmospheric'],
          composition: 'panoramic',
        },
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error.message,
      });
    }
  },
  {
    name: 'generate_seasonal_graphic',
    description: 'Generates a Studio Ghibli-style seasonal landscape or graphic for spring, summer, fall, or winter. Creates atmospheric, nature-focused imagery.',
    schema: z.object({
      season: z.enum(['spring', 'summer', 'fall', 'winter']).describe('The season to represent'),
      theme: z.string().describe('Additional theme or focus for the seasonal graphic'),
      style_level: z.enum(['subtle', 'moderate', 'strong']).default('moderate').describe('How strongly to apply Ghibli style'),
    }),
  }
);

export const allArtTools = [
  generateDailyReflectionArt,
  generateStepIllustration,
  generateMilestoneBadge,
  generateSeasonalGraphic,
];
