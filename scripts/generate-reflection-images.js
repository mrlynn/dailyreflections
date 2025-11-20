#!/usr/bin/env node
/**
 * Reflection Image Generator
 *
 * This script generates images for daily reflections using OpenAI's DALL-E.
 * Images are stored in /public/reflections and metadata is updated in MongoDB.
 *
 * Usage:
 *   node generate-reflection-images.js [options]
 *
 * Options:
 *   --date MM-DD          Generate image for a specific date (MM-DD format)
 *   --failed              Regenerate only failed images
 *   --all                 Generate images for all reflections (overrides --date)
 *   --force               Force regeneration even if images exist
 *   --dry-run             Show what would be generated without making changes
 *   --help                Show this help message
 */

// Use ESM for modules
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Import packages with ESM compatibility
import { Command } from 'commander';
import * as dotenv from 'dotenv';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';

const program = new Command();

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Import file storage first (it doesn't have any dependencies)
import {
  saveReflectionImage,
  reflectionImageExists,
  writeManifest,
  getAllReflectionImages
} from './lib/fileStorage.js';

import { generateReflectionImage } from './lib/imageProvider.js';

// MongoDB functions - will be imported conditionally
let getReflectionByDateKey = null;
let getReflectionsForImageGeneration = null;
let setReflectionImagePending = null;
let updateReflectionWithImage = null;

// Import utilities from the main app
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current module's file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import utility functions
import { getTodayKey } from '../src/utils/dateUtils.js';

// Define CLI options
program
  .name('generate-reflection-images')
  .description('Generate images for daily reflections')
  .option('-d, --date <dateKey>', 'Generate image for specific date (MM-DD format)')
  .option('-f, --failed', 'Regenerate only failed images')
  .option('-a, --all', 'Generate images for all reflections (overrides --date)')
  .option('--force', 'Force regeneration even if images exist')
  .option('--dry-run', 'Show what would be generated without making changes')
  .option('--mock', 'Run with mock data (for testing without MongoDB)')
  .version('1.0.0');

program.parse(process.argv);

const options = program.opts();

// Import MongoDB functions conditionally if not in mock mode
if (!options.mock) {
  try {
    const mongodbModule = await import('./lib/mongodb.js');
    getReflectionByDateKey = mongodbModule.getReflectionByDateKey;
    getReflectionsForImageGeneration = mongodbModule.getReflectionsForImageGeneration;
    setReflectionImagePending = mongodbModule.setReflectionImagePending;
    updateReflectionWithImage = mongodbModule.updateReflectionWithImage;
  } catch (error) {
    if (!options.mock) {
      console.error(chalk.red('Error importing MongoDB module:'), error.message);
      console.error(chalk.yellow('Use --mock flag to run with mock data'));
      process.exit(1);
    }
  }
}

/**
 * Generate mock reflections for testing
 */
function getMockReflections() {
  const today = getTodayKey();
  const [month, day] = today.split('-').map(Number);

  return [
    {
      _id: 'mock_id_1',
      title: 'ACCEPTANCE',
      quote: 'Acceptance is the answer to all my problems today.',
      comment: 'When I am disturbed, it is because I find some person, place, thing, or situation – some fact of my life – unacceptable to me, and I can find no serenity until I accept that person, place, thing, or situation as being exactly the way it is supposed to be at this moment.',
      reference: 'ALCOHOLICS ANONYMOUS, p. 417',
      month,
      day
    },
    {
      _id: 'mock_id_2',
      title: 'SERENITY',
      quote: 'God grant me the serenity to accept the things I cannot change, the courage to change the things I can, and the wisdom to know the difference.',
      comment: 'The Serenity Prayer is a reminder of the peace that comes from accepting life on life\'s terms, and the freedom that comes from focusing my energy on what I can actually change - my own attitudes and actions.',
      reference: 'TWELVE STEPS AND TWELVE TRADITIONS, p. 125',
      month: (month % 12) + 1,
      day: ((day % 28) + 1)
    },
    {
      _id: 'mock_id_3',
      title: 'GRATITUDE',
      quote: 'Gratitude is a form of acceptance.',
      comment: 'When I focus on what I am grateful for in my life, my mind shifts from what I lack to the abundance that is already present. Gratitude brings me into acceptance of the now, and opens me to the infinite possibilities of the future.',
      reference: 'AS BILL SEES IT, p. 271',
      month: ((month + 1) % 12) + 1,
      day: ((day + 10) % 28) + 1
    }
  ];
}

/**
 * Main function to run the image generator
 */
async function main() {
  try {
    console.log(chalk.blue('=== Reflection Image Generator ==='));

    // Validate and normalize date format
    if (options.date) {
      // Allow both MM-DD and MMDD formats, normalize to MM-DD
      if (options.date.match(/^\d{4}$/)) {
        // Format: 1106 -> 11-06
        options.date = `${options.date.substring(0, 2)}-${options.date.substring(2, 4)}`;
        console.log(chalk.blue(`Normalized date format: ${options.date}`));
      } else if (!options.date.match(/^\d{2}-\d{2}$/)) {
        console.error(chalk.red('Error: Date must be in MM-DD format (e.g., 11-06) or MMDD format (e.g., 1106)'));
        process.exit(1);
      }
    }

    // Determine which reflections to process
    let reflections = [];
    let processingMessage = '';

    // Use mock data if requested
    if (options.mock) {
      console.log(chalk.yellow('Using mock data for testing (MongoDB connection not required)'));
      reflections = getMockReflections();

      if (options.date) {
        const dateKey = options.date;
        const [month, day] = dateKey.split('-').map(Number);
        reflections = [
          {
            ...reflections[0],
            month,
            day
          }
        ];
        processingMessage = `Processing mock reflection for date ${dateKey}`;
      } else {
        processingMessage = 'Processing mock reflections';
      }
    } else if (options.all) {
      // Process all reflections
      processingMessage = 'Processing all reflections';
      reflections = await getReflectionsForImageGeneration({ force: options.force });
    } else if (options.failed) {
      // Process failed reflections
      processingMessage = 'Processing failed reflections';
      reflections = await getReflectionsForImageGeneration({ onlyFailed: true });
    } else if (options.date) {
      // Process specific date
      processingMessage = `Processing reflection for date ${options.date}`;
      const reflection = await getReflectionByDateKey(options.date);

      if (!reflection) {
        console.error(chalk.red(`No reflection found for date ${options.date}`));
        process.exit(1);
      }

      if (!options.force && reflectionImageExists(options.date)) {
        console.log(chalk.yellow(`Image already exists for ${options.date}. Use --force to regenerate.`));
        process.exit(0);
      }

      reflections = [reflection];
    } else {
      // Default to today's reflection
      const today = getTodayKey();
      processingMessage = `Processing today's reflection (${today})`;
      const reflection = await getReflectionByDateKey(today);

      if (!reflection) {
        console.error(chalk.red(`No reflection found for today (${today})`));
        process.exit(1);
      }

      if (!options.force && reflectionImageExists(today)) {
        console.log(chalk.yellow(`Image already exists for today (${today}). Use --force to regenerate.`));
        process.exit(0);
      }

      reflections = [reflection];
    }

    // Show summary of what we'll process
    console.log(chalk.green(`${processingMessage} (${reflections.length} total)`));

    if (options.dryRun) {
      console.log(chalk.yellow('DRY RUN: No changes will be made'));

      // List reflections that would be processed
      reflections.forEach(reflection => {
        const dateKey = `${String(reflection.month).padStart(2, '0')}-${String(reflection.day).padStart(2, '0')}`;
        console.log(`- ${dateKey}: ${reflection.title}`);
      });

      process.exit(0);
    }

    // Process each reflection
    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      total: reflections.length
    };

    const generatedImages = [];

    for (let i = 0; i < reflections.length; i++) {
      const reflection = reflections[i];
      const dateKey = `${String(reflection.month).padStart(2, '0')}-${String(reflection.day).padStart(2, '0')}`;

      const spinner = ora(`Generating image for ${dateKey}: ${reflection.title} (${i + 1}/${reflections.length})`).start();

      try {
        // Skip if image exists and not forcing
        if (!options.force && reflectionImageExists(dateKey)) {
          spinner.info(`Image already exists for ${dateKey} - skipping`);
          results.skipped++;
          continue;
        }

        // Set status to pending in database (skip for mock mode)
        if (!options.dryRun && !options.mock) {
          await setReflectionImagePending(reflection._id, {
            dateKey,
            revision: (reflection.image?.revision || 0) + 1
          });
        }

        // Generate image
        spinner.text = `Generating image for ${dateKey}...`;
        const imageBuffer = await generateReflectionImage({ reflection });

        // Save image to disk
        spinner.text = `Saving image for ${dateKey}...`;
        const imageResult = await saveReflectionImage({ dateKey, imageBuffer });

        // Update database with image metadata (skip for mock mode)
        if (!options.dryRun && !options.mock) {
          await updateReflectionWithImage(reflection._id, {
            ...imageResult,
            status: 'completed',
            generatedAt: new Date()
          });
        }

        generatedImages.push({
          dateKey,
          title: reflection.title,
          ...imageResult
        });

        spinner.succeed(`Generated image for ${dateKey}`);
        results.success++;
      } catch (error) {
        spinner.fail(`Failed to generate image for ${dateKey}: ${error.message}`);

        // Update database with failed status (skip for mock mode)
        if (!options.dryRun && !options.mock) {
          await updateReflectionWithImage(reflection._id, {
            status: 'failed',
            error: error.message,
            generatedAt: new Date()
          });
        }

        results.failed++;
      }
    }

    // Write manifest file
    if (generatedImages.length > 0 && !options.dryRun) {
      const allImages = await getAllReflectionImages();
      // getAllReflectionImages now returns objects with dateKey, format, and url
      const manifestPath = await writeManifest(allImages);
      console.log(chalk.blue(`Image manifest written to ${manifestPath}`));
    }

    // Show summary
    console.log(chalk.blue('\n=== Summary ==='));
    console.log(chalk.green(`Total reflections: ${results.total}`));
    console.log(chalk.green(`Successfully generated: ${results.success}`));

    if (results.skipped > 0) {
      console.log(chalk.yellow(`Skipped (already exists): ${results.skipped}`));
    }

    if (results.failed > 0) {
      console.log(chalk.red(`Failed: ${results.failed}`));
    }

  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main();