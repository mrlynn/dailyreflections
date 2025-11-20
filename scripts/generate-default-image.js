/**
 * Generate Default Fallback Image Script
 *
 * This script generates a default fallback image for daily reflections
 * that will be used when a date-specific image is not available.
 */

import { generateDefaultImage } from './lib/imageProvider.js';
import { promises as fs } from 'fs';
import path from 'path';
import ora from 'ora';

// Constants
const DEFAULT_IMAGE_NAME = 'default.jpg';

/**
 * Save default image to disk
 * @param {Buffer} imageBuffer - Image data as Buffer
 * @returns {Promise<Object>} - Result object with path
 */
async function saveDefaultImage(imageBuffer) {
  // Ensure directory exists
  const dir = path.join(process.cwd(), 'public', 'reflections');
  await fs.mkdir(dir, { recursive: true });

  // Save the image
  const imagePath = path.join(dir, DEFAULT_IMAGE_NAME);
  await fs.writeFile(imagePath, imageBuffer);

  // Return result
  return {
    path: imagePath,
    status: 'completed',
    generatedAt: new Date(),
  };
}

/**
 * Main function to generate and save default image
 */
async function generateDefaultFallbackImage() {
  const spinner = ora('Starting default fallback image generation').start();

  try {
    // Generate default image
    spinner.text = `Generating default fallback image`;
    const imageBuffer = await generateDefaultImage();

    // Save image to disk
    spinner.text = `Saving default fallback image`;
    const result = await saveDefaultImage(imageBuffer);

    spinner.succeed(`Successfully generated and saved default fallback image to ${result.path}`);
    console.log(`\nImage details:`);
    console.log(`- Path: ${result.path}`);
    console.log(`- Size: ${imageBuffer.length} bytes`);
    console.log(`\nYou can now access this image at: http://localhost:3000/reflections/${DEFAULT_IMAGE_NAME}`);

  } catch (error) {
    spinner.fail(`Error generating default fallback image: ${error.message}`);
    console.error(error);
  }
}

// Run the main function
generateDefaultFallbackImage().catch(console.error);