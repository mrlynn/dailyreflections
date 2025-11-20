/**
 * Ghibli Style Image Prompt for Daily Reflections
 *
 * This file contains the prompt used to generate Studio Ghibli-style images
 * for daily reflections.
 */

/**
 * Get the Ghibli style prompt for image generation
 * @returns {string} - Style description for Ghibli-inspired images
 */
export function getGhibliStylePrompt() {
  return `Artistic style: Create a Studio Ghibli style landscape illustration with the following specific characteristics:

1. Composition: Design a horizontal landscape with layered depths - foreground, middle ground, and distance. Use Ghibli's signature sweeping panoramic views with a dramatic sense of scale.

2. Light and atmosphere: Incorporate Ghibli's distinctive luminous quality - soft, diffused lighting with gentle glows, particularly at horizon points. Create atmospheric perspective with hazy, distant elements.

3. Color palette: Use Ghibli's signature vibrant yet natural palette - rich greens, soft blues, warm earth tones, and highlights of warm golden light. Color gradients should be gentle and harmonious, not harsh.

4. Environment elements:
   - Clouds should have that distinctive Ghibli cumulus formation - plump, dimensional, and with soft edges
   - Foliage and grass should show subtle motion as if caught in a gentle breeze, with feathery edges
   - Any water elements should have that quintessential Ghibli reflective quality with minimal ripples
   - Include subtle environmental particles like pollen, dust motes, or leaves in the air

5. Technique: The illustration should have the appearance of hand-painted animation cels with visible but gentle brushwork, particularly in foliage and clouds. Areas of flat color should be contrasted with areas of fine detail.

6. Mood: Create a serene, contemplative atmosphere that evokes wonder and reflection. The image should feel peaceful yet vibrant with life, capturing the Ghibli balance of realism and fantasy.

Critical requirements: NO text, words, letters, or numbers. NO recognizable human faces or specific people. NO religious symbols or icons. This must be a unique artistic interpretation, not generic stock imagery. Professional quality suitable for spiritual and meditative context.

The image MUST be in landscape orientation format (1792x1024), perfectly suited to serve as a banner header image.`;
}

/**
 * Get a custom Ghibli style prompt for specific themes
 *
 * @param {Array<string>} themes - Array of themes detected in the reflection
 * @returns {string} - Custom Ghibli style description based on themes
 */
export function getCustomGhibliStylePrompt(themes = []) {
  // Base Ghibli style that applies to all images
  const baseStyle = `Artistic style: Create a Studio Ghibli style landscape illustration with soft, hand-painted appearance, vibrant yet natural colors, and Ghibli's signature atmospheric perspective.`;

  // Theme-specific style additions
  const themeStyles = {
    acceptance: `Include gentle rolling hills with paths that wind into the distance, soft clouds drifting peacefully, and a serene body of water reflecting the sky - all rendered in Miyazaki's gentle brushstrokes and atmospheric perspective.`,

    gratitude: `Feature a lush Ghibli-style meadow with wildflowers catching golden light, the distinctive Ghibli clouds billowing gently overhead, and perhaps a distant cottage with warm light - all with that characteristic Ghibli sense of abundance and pastoral peace.`,

    serenity: `Create a classic Ghibli tranquil scene with a perfectly still reflective lake or ocean at dawn/dusk, distant mountains with that distinctive Ghibli haze, and perhaps gentle mist rising - all with the studio's masterful use of light and atmosphere.`,

    hope: `Design a Ghibli-inspired landscape with their signature dramatic skies where light breaks through clouds, a winding path leading toward the horizon, and perhaps subtle elements of new growth - all with Ghibli's characteristic luminous quality.`,

    struggle: `Incorporate a Ghibli-style dramatic weather element like wind-bent trees or approaching storm clouds balanced with breaks of light, perhaps a path ascending through challenging terrain - all with Miyazaki's sense of facing natural elements with dignity.`,

    spirituality: `Create a Ghibli-inspired scene with ethereal light filtering through clouds or trees creating those distinctive Ghibli light shafts, perhaps with subtle symbolic elements like birds in flight or ancient stones - all with the studio's sense of magic within nature.`,

    growth: `Design a landscape with Ghibli's detailed rendering of varied vegetation at different stages, perhaps including their distinctive way of showing plants reaching toward light, or a small stream becoming larger - all with the studio's meticulous attention to natural processes.`,

    nature: `Craft a landscape showcasing Ghibli's renowned detailed natural environments - their distinctive trees with individual leaves catching light, textured grasses moving in the breeze, layered forest depths - all with their signature balance of realism and gentle stylization.`
  };

  // Select style additions based on themes present
  let customStyle = baseStyle;
  const matchedThemes = themes.filter(theme => themeStyles[theme]);

  if (matchedThemes.length > 0) {
    // Add the first matched theme style
    customStyle += "\n\n" + themeStyles[matchedThemes[0]];
  }

  // Add general requirements
  customStyle += `\n\nCritical requirements: NO text, words, letters, or numbers. NO recognizable human faces or specific people. NO religious symbols or icons. The image MUST be in landscape orientation format (1792x1024), perfectly suited to serve as a banner header image.`;

  return customStyle;
}