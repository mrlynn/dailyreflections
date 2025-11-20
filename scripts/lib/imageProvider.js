/**
 * OpenAI Image Generation Module for Reflection Images
 *
 * This module provides utilities for generating images using OpenAI's DALL-E API
 * based on daily reflection texts.
 */

import OpenAI from 'openai';
import axios from 'axios';
import path from 'path';
import { getDefaultImagePrompt } from './defaultImagePrompt.js';
import { getGhibliStylePrompt, getCustomGhibliStylePrompt } from './ghibliStylePrompt.js';

// Lazy load sharp for JPG conversion (optional dependency)
let sharp = null;
async function loadSharp() {
  if (sharp !== null) return sharp; // Already loaded or attempted
  
  try {
    const sharpModule = await import('sharp');
    sharp = sharpModule.default;
    return sharp;
  } catch (error) {
    console.warn('Sharp not available - images will be saved as PNG. Install sharp for JPG conversion: npm install sharp');
    sharp = false; // Mark as unavailable
    return null;
  }
}

// Initialize the OpenAI client with API key if available
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * Generate an image for a reflection using OpenAI DALL-E
 *
 * @param {Object} options - Generation options
 * @param {Object} options.reflection - The reflection object from MongoDB
 * @param {string} options.style - Style prompt override (optional)
 * @param {string} options.size - Image size (default: "1792x1024")
 * @param {number} options.maxRetries - Maximum number of retries on failure (default: 2)
 * @returns {Promise<Buffer>} - Image data as Buffer
 */
export async function generateReflectionImage({
  reflection,
  style,
  size = "1792x1024",
  maxRetries = 2,
}) {
  if (!reflection) {
    throw new Error("No reflection provided");
  }

  // Extract relevant text from the reflection
  const { title, quote, comment, reference } = reflection;

  // Create a comprehensive, artistic prompt
  const basePrompt = createImagePrompt(reflection);

  // Extract emotional themes for custom Ghibli styling
  const emotionalThemes = extractEmotionalThemes(title || "", quote || "", comment || "");

  // Add style guidance - use Ghibli style by default, or custom style if provided
  const stylePrompt = style || getCustomGhibliStylePrompt(emotionalThemes);

  // Combine prompts into a single, cohesive artistic direction
  // DALL-E works best with a single, well-structured prompt
  const finalPrompt = `${basePrompt}\n\n${stylePrompt}`;

  // Log prompt for debugging
  console.log("Image generation prompt:", finalPrompt);

  // Check if this is a mock run (no API key)
  if (!openai) {
    console.log("Using mock image generation (no OpenAI API key available)");
    // Create a mock image buffer (1x1 transparent PNG)
    const mockImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      'base64'
    );
    return mockImageBuffer;
  }

  let lastError = null;

  // Try with retries
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Generate image with OpenAI
      const response = await openai.images.generate({
        model: "dall-e-3", // Use the latest model
        prompt: finalPrompt,
        n: 1,
        size: size,
        quality: "standard",
        response_format: "url",
      });

      // Get image URL from response
      const imageUrl = response.data[0].url;

      // Download image and convert to buffer
      const imageBuffer = await downloadImage(imageUrl);

      // Convert to JPG format for smaller file size
      const jpgBuffer = await convertToJpg(imageBuffer);

      return jpgBuffer;
    } catch (error) {
      console.error(`Image generation attempt ${attempt + 1} failed:`, error.message);
      lastError = error;

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const backoffTime = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
    }
  }

  // If we got here, all attempts failed
  throw new Error(`Failed to generate image after ${maxRetries + 1} attempts: ${lastError.message}`);
}

/**
 * Create a prompt for image generation from reflection text
 * Enhanced to create unique, artistic images deeply linked to the reflection content
 *
 * @param {Object} reflection - The reflection object from MongoDB
 * @returns {string} - Generated prompt for the image
 */
export function createImagePrompt(reflection) {
  const { title, quote, comment, reference } = reflection;

  // Extract key emotional themes and visual metaphors
  const emotionalThemes = extractEmotionalThemes(title, quote, comment);
  const visualMetaphors = extractVisualMetaphors(title, quote, comment);
  const specificImagery = extractSpecificImagery(quote, comment);
  
  // Build a rich, artistic prompt optimized for DALL-E
  // DALL-E works best with descriptive, flowing prose rather than structured lists
  let prompt = `Create a unique, artistic horizontal banner image that visually interprets this daily reflection on ${title || 'recovery'}.\n\n`;
  
  // Add the core reflection content in a natural way
  if (quote) {
    // Extract key phrase from quote (first 80 chars for context)
    const quoteExcerpt = quote.length > 80 ? quote.substring(0, 80) + '...' : quote;
    prompt += `The reflection speaks of: "${quoteExcerpt}"\n\n`;
  }
  
  // Build descriptive visual narrative
  const visualElements = [];
  
  // Add emotional context as visual mood
  if (emotionalThemes.length > 0) {
    visualElements.push(`capturing the essence of ${emotionalThemes.slice(0, 2).join(' and ')}`);
  }
  
  // Add visual metaphors as scene elements
  if (visualMetaphors.length > 0) {
    const metaphors = visualMetaphors.slice(0, 2).map(m => m.split(' and ')[0]);
    visualElements.push(`featuring ${metaphors.join(' and ')}`);
  }
  
  // Add specific imagery
  if (specificImagery.length > 0) {
    visualElements.push(`with ${specificImagery.slice(0, 3).join(', ')}`);
  }
  
  // Combine into flowing description
  if (visualElements.length > 0) {
    prompt += `The image should be ${visualElements.join(', ')}. `;
  }
  
  // Add unique artistic direction
  prompt += `Create a deeply personal and meaningful visual interpretation that feels unique to this specific reflection, not generic or stock-like.`;
  
  return prompt;
}

/**
 * Extract emotional themes from reflection text
 *
 * @param {string} title - Reflection title
 * @param {string} quote - Reflection quote
 * @param {string} comment - Reflection comment
 * @returns {Array<string>} - Array of emotional themes
 */
function extractEmotionalThemes(title, quote, comment) {
  const text = `${title || ""} ${quote || ""} ${comment || ""}`.toLowerCase();
  
  const emotionalKeywords = {
    acceptance: ["accept", "acceptance", "accepting", "acknowledge"],
    gratitude: ["grateful", "gratitude", "thankful", "thanks", "appreciate"],
    serenity: ["serenity", "serene", "peace", "peaceful", "calm", "tranquil"],
    hope: ["hope", "hopeful", "optimism", "optimistic", "faith", "believe"],
    courage: ["courage", "brave", "bravery", "strength", "strong", "endure"],
    humility: ["humble", "humility", "modest", "modesty", "meek"],
    forgiveness: ["forgive", "forgiveness", "pardon", "mercy", "compassion"],
    honesty: ["honest", "honesty", "truth", "truthful", "sincere", "authentic"],
    love: ["love", "loving", "care", "caring", "compassion", "kindness"],
    surrender: ["surrender", "let go", "release", "relinquish", "yield"]
  };
  
  const detected = [];
  for (const [theme, keywords] of Object.entries(emotionalKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      detected.push(theme);
    }
  }
  
  return detected;
}

/**
 * Extract visual metaphors from reflection text
 *
 * @param {string} title - Reflection title
 * @param {string} quote - Reflection quote
 * @param {string} comment - Reflection comment
 * @returns {Array<string>} - Array of visual metaphors
 */
function extractVisualMetaphors(title, quote, comment) {
  const text = `${title || ""} ${quote || ""} ${comment || ""}`.toLowerCase();
  
  const metaphors = {
    "journey and path": ["journey", "path", "road", "way", "walk", "step", "travel", "progress"],
    "light and illumination": ["light", "bright", "shine", "illuminate", "dawn", "sunrise", "ray", "glow"],
    "water and flow": ["water", "flow", "river", "stream", "ocean", "wave", "current", "tide"],
    "growth and renewal": ["grow", "growth", "bloom", "blossom", "sprout", "renew", "fresh", "new"],
    "connection and unity": ["together", "unite", "connect", "bond", "link", "join", "fellowship"],
    "foundation and stability": ["foundation", "base", "ground", "root", "anchor", "stable", "firm"],
    "transformation": ["transform", "change", "become", "evolve", "metamorphosis", "shift"]
  };
  
  const detected = [];
  for (const [metaphor, keywords] of Object.entries(metaphors)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      detected.push(metaphor);
    }
  }
  
  return detected;
}

/**
 * Extract specific imagery mentioned in the reflection
 *
 * @param {string} quote - Reflection quote
 * @param {string} comment - Reflection comment
 * @returns {Array<string>} - Array of specific visual elements
 */
function extractSpecificImagery(quote, comment) {
  const text = `${quote || ""} ${comment || ""}`.toLowerCase();
  
  const imageryKeywords = {
    "morning light": ["morning", "dawn", "sunrise", "early", "daybreak"],
    "sunset": ["sunset", "dusk", "evening", "twilight"],
    "mountains": ["mountain", "peak", "summit", "hill", "ridge"],
    "trees": ["tree", "forest", "wood", "grove", "branch"],
    "water": ["water", "lake", "pond", "river", "stream", "ocean", "sea"],
    "sky": ["sky", "cloud", "horizon", "heaven", "blue"],
    "garden": ["garden", "flower", "bloom", "petal", "plant"],
    "bridge": ["bridge", "crossing", "span"],
    "door": ["door", "gate", "entrance", "threshold", "opening"],
    "window": ["window", "light", "view", "opening"],
    "candle": ["candle", "flame", "light", "wick"],
    "hands": ["hand", "hands", "hold", "grasp", "reach"]
  };
  
  const detected = [];
  for (const [imagery, keywords] of Object.entries(imageryKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      detected.push(imagery);
    }
  }
  
  // If no specific imagery found, return some default recovery-themed elements
  if (detected.length === 0) {
    return ["gentle light", "peaceful landscape", "serene atmosphere"];
  }
  
  return detected;
}

/**
 * Get default style prompt for image generation
 * Enhanced for more artistic and unique results
 *
 * @returns {string} - Style description
 */
function getDefaultStylePrompt() {
  return `Artistic style: A unique, evocative watercolor and mixed-media illustration with soft, flowing brushstrokes, gentle color transitions, and a pastel palette with occasional warm accents. Use atmospheric perspective with depth and layers, subtle textures, and organic forms that create emotional resonance through color and composition.

The image should focus on the emotional and spiritual essence through symbolism and metaphor rather than literal representation. Create visual interest through light, shadow, and color harmony, balancing detail with simplicity.

Critical requirements: NO text, words, letters, or numbers. NO recognizable human faces or specific people. NO religious symbols or icons. The mood should be gentle, hopeful, and contemplative. This must be a unique artistic interpretation, not generic stock imagery. Professional quality suitable for spiritual and meditative context.`;
}

/**
 * Download image from URL and convert to buffer
 *
 * @param {string} url - Image URL
 * @returns {Promise<Buffer>} - Image buffer
 */
async function downloadImage(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
  } catch (error) {
    console.error('Error downloading image:', error.message);
    throw new Error(`Failed to download image: ${error.message}`);
  }
}

/**
 * Add watermark logo to image
 *
 * @param {Buffer} imageBuffer - Image buffer to watermark
 * @param {Object} options - Watermark options
 * @param {string} options.position - Position: 'bottom-right', 'bottom-left', 'top-right', 'top-left' (default: 'bottom-right')
 * @param {number} options.opacity - Opacity 0-1 (default: 0.7)
 * @param {number} options.size - Size as percentage of image width (default: 0.12 = 12%)
 * @param {number} options.padding - Padding from edge in pixels (default: 24)
 * @returns {Promise<Buffer>} - Watermarked image buffer
 */
async function addWatermark(imageBuffer, options = {}) {
  try {
    const sharpLib = await loadSharp();
    
    if (!sharpLib) {
      console.warn('Sharp not available, skipping watermark');
      return imageBuffer;
    }

    const {
      position = 'bottom-right',
      opacity = 0.7,
      size = 0.12, // 12% of image width
      padding = 24
    } = options;

    // Load the base image and get its metadata
    const baseImage = sharpLib(imageBuffer);
    const metadata = await baseImage.metadata();
    const { width: imageWidth, height: imageHeight } = metadata;

    // Calculate watermark size
    const watermarkWidth = Math.floor(imageWidth * size);
    
    // Load and resize watermark logo
    const logoPath = path.join(process.cwd(), 'public', 'logo-white.png');
    
    let watermarkImage;
    try {
      // Load logo, ensure it has alpha channel, and resize it
      const logoBuffer = await sharpLib(logoPath)
        .ensureAlpha() // Ensure alpha channel exists
        .resize(watermarkWidth, null, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .toBuffer();
      
      // Get logo metadata to check channels
      const logoMetadata = await sharpLib(logoBuffer).metadata();
      
      // If logo has 4 channels (RGBA), we can modify the alpha
      // If it only has 3 channels (RGB), we need to convert white to transparent
      if (logoMetadata.channels === 4) {
        // Extract and modify alpha channel to apply opacity
        const alphaChannel = await sharpLib(logoBuffer)
          .extractChannel(3) // Extract alpha channel
          .linear(1, opacity) // Multiply alpha by opacity value
          .toBuffer();
        
        // Recombine RGB channels with modified alpha
        watermarkImage = await sharpLib(logoBuffer)
          .extractChannel(0) // Red
          .joinChannel([
            await sharpLib(logoBuffer).extractChannel(1).toBuffer(), // Green
            await sharpLib(logoBuffer).extractChannel(2).toBuffer(), // Blue
            alphaChannel // Modified alpha
          ])
          .png()
          .toBuffer();
      } else {
        // Logo is RGB without alpha - convert white/light background to transparent
        // Use a composite approach: create alpha channel from white pixels
        const { width, height } = logoMetadata;
        
        // Create alpha mask: identify white/light pixels and make them transparent
        // Convert to greyscale, threshold to find white areas, then invert
        const alphaMask = await sharpLib(logoBuffer)
          .greyscale()
          .threshold(245, { grayscale: true }) // Pixels brighter than 245 become white
          .negate() // Invert: white areas become black (transparent)
          .linear(1, opacity) // Apply overall opacity
          .toBuffer();
        
        // Extract RGB channels
        const redChannel = await sharpLib(logoBuffer).extractChannel(0).toBuffer();
        const greenChannel = await sharpLib(logoBuffer).extractChannel(1).toBuffer();
        const blueChannel = await sharpLib(logoBuffer).extractChannel(2).toBuffer();
        
        // Combine RGB with alpha mask
        watermarkImage = await sharpLib(redChannel)
          .joinChannel([greenChannel, blueChannel, alphaMask])
          .png()
          .toBuffer();
      }
    } catch (error) {
      console.warn('Could not load watermark logo, skipping watermark:', error.message);
      return imageBuffer;
    }

    // Get watermark dimensions after resize
    const watermarkMetadata = await sharpLib(watermarkImage).metadata();
    const watermarkActualWidth = watermarkMetadata.width;
    const watermarkActualHeight = watermarkMetadata.height;

    // Calculate position based on placement option
    let left, top;
    switch (position) {
      case 'bottom-right':
        left = imageWidth - watermarkActualWidth - padding;
        top = imageHeight - watermarkActualHeight - padding;
        break;
      case 'bottom-left':
        left = padding;
        top = imageHeight - watermarkActualHeight - padding;
        break;
      case 'top-right':
        left = imageWidth - watermarkActualWidth - padding;
        top = padding;
        break;
      case 'top-left':
        left = padding;
        top = padding;
        break;
      default:
        left = imageWidth - watermarkActualWidth - padding;
        top = imageHeight - watermarkActualHeight - padding;
    }

    // Composite the watermark onto the base image
    const watermarkedBuffer = await baseImage
      .composite([
        {
          input: watermarkImage,
          left: Math.max(0, left),
          top: Math.max(0, top),
          blend: 'over'
        }
      ])
      .toBuffer();

    console.log(`Watermark added: ${position}, opacity ${(opacity * 100).toFixed(0)}%, size ${watermarkActualWidth}x${watermarkActualHeight}px`);
    
    return watermarkedBuffer;
  } catch (error) {
    console.error('Error adding watermark:', error.message);
    // If watermarking fails, return original buffer
    console.warn('Falling back to image without watermark');
    return imageBuffer;
  }
}

/**
 * Convert image buffer to JPG format with optimization
 * Reduces file size significantly while maintaining quality
 *
 * @param {Buffer} imageBuffer - Original image buffer (PNG from DALL-E)
 * @param {number} quality - JPG quality (1-100, default: 85)
 * @param {boolean} addWatermarkLogo - Whether to add watermark (default: false)
 * @returns {Promise<Buffer>} - JPG image buffer
 */
async function convertToJpg(imageBuffer, quality = 85, addWatermarkLogo = false) {
  try {
    // Lazy load sharp
    const sharpLib = await loadSharp();
    
    // Check if sharp is available
    if (!sharpLib) {
      console.warn('Sharp not available, returning original image buffer');
      return imageBuffer;
    }

    // Add watermark first (if enabled)
    let processedBuffer = imageBuffer;
    if (addWatermarkLogo) {
      processedBuffer = await addWatermark(imageBuffer, {
        position: 'bottom-right',
        opacity: 0.7,
        size: 0.12,
        padding: 24
      });
    }

    // Convert to JPG with optimization
    const jpgBuffer = await sharpLib(processedBuffer)
      .jpeg({ 
        quality: quality,
        progressive: true,
        mozjpeg: true // Use mozjpeg for better compression
      })
      .toBuffer();

    const originalSize = imageBuffer.length;
    const newSize = jpgBuffer.length;
    const reduction = ((originalSize - newSize) / originalSize * 100).toFixed(1);
    
    console.log(`Image converted to JPG: ${(originalSize / 1024).toFixed(1)}KB → ${(newSize / 1024).toFixed(1)}KB (${reduction}% reduction)`);

    return jpgBuffer;
  } catch (error) {
    console.error('Error converting image to JPG:', error.message);
    // If conversion fails, return original buffer
    console.warn('Falling back to original image format');
    return imageBuffer;
  }
}

/**
 * Generate a test image based on a simple prompt
 * Useful for testing API credentials and connectivity
 *
 * @returns {Promise<Buffer>} - Test image buffer
 */
export async function generateTestImage() {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: "A simple watercolor painting of a peaceful sunrise over calm water, in soft pastel colors. No text.",
      n: 1,
      size: "1792x1024", // Changed to match horizontal banner format
      response_format: "url",
    });

    const imageUrl = response.data[0].url;
    const imageBuffer = await downloadImage(imageUrl);
    return await convertToJpg(imageBuffer);
  } catch (error) {
    console.error('Test image generation failed:', error.message);
    throw error;
  }
}

/**
 * Generate default fallback image for daily reflections
 * Uses a specific prompt designed for general reflection imagery
 *
 * @returns {Promise<Buffer>} - Default fallback image as Buffer
 */
export async function generateDefaultImage() {
  if (!openai) {
    console.log("Using mock image generation (no OpenAI API key available)");
    // Create a mock image buffer (1x1 transparent PNG)
    const mockImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      'base64'
    );
    return mockImageBuffer;
  }

  try {
    // Get the specialized default image prompt
    const prompt = getDefaultImagePrompt();

    console.log("Default image generation prompt:", prompt);

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1792x1024", // Horizontal banner format
      quality: "standard",
      response_format: "url",
    });

    const imageUrl = response.data[0].url;
    const imageBuffer = await downloadImage(imageUrl);
    return await convertToJpg(imageBuffer);
  } catch (error) {
    console.error('Default image generation failed:', error.message);
    throw error;
  }
}