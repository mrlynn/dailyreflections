/**
 * Default Image Prompt for Daily Reflections
 *
 * This file contains the prompt used to generate the default fallback image
 * for daily reflections when a date-specific image is not available.
 */

/**
 * Get the default image prompt
 * @returns {string} - The prompt for generating the default image
 */
export function getDefaultImagePrompt() {
  return `Create a serene and inspiring horizontal banner image that represents the essence of daily reflection and recovery.

Theme: "Daily Reflection"

Key visual elements:
- A peaceful sunrise or sunset over water
- Gentle, flowing paths
- Soft light and hope
- Natural elements like mountains or trees in the distance
- Calm, serene water

Style: soft watercolor illustration style with a serene, hopeful, and contemplative feeling. Use a pastel color palette with gentle gradients. The image should embody the journey of reflection, growth, and serenity.

Important style notes:
- No text or words in the image
- Gentle, hopeful feeling
- Soft colors, not harsh or dark
- Semi-abstract interpretation rather than literal
- Avoid depicting specific human faces or identifiable people
- Simple composition with focus on the emotional essence
- Must be in horizontal banner format (1792x1024)`;
}