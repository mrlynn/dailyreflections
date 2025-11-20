/**
 * Test script to generate an image for today's reflection (Nov 5)
 * This script will generate a single image for testing the new horizontal format
 */

import { generateReflectionImage } from './lib/imageProvider.js';
import { promises as fs } from 'fs';
import path from 'path';
import ora from 'ora';
import { MongoClient } from 'mongodb';

// Constants
const TEST_DATE_KEY = '11-05';  // November 5
const MONGODB_URI = 'mongodb+srv://mike:Password678%21@performance.zbcul.mongodb.net/dailyreflections?authSource=admin';

// MongoDB client options
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// Create a direct connection to MongoDB
const client = new MongoClient(MONGODB_URI, options);
const clientPromise = client.connect();

/**
 * Get reflection from database for a specific date
 * @param {string} dateKey - Date key in MM-DD format
 * @returns {Promise<Object>} - The reflection object from the database
 */
async function getReflection(dateKey) {
  const [monthStr, dayStr] = dateKey.split('-');
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const reflection = await db.collection('reflections').findOne({
    month,
    day,
  });

  if (!reflection) {
    throw new Error(`No reflection found for ${dateKey}`);
  }

  return reflection;
}

/**
 * Save image to disk
 * @param {string} dateKey - Date key in MM-DD format
 * @param {Buffer} imageBuffer - Image data as Buffer
 * @returns {Promise<Object>} - Result object with path
 */
async function saveReflectionImage({ dateKey, imageBuffer }) {
  // Ensure directory exists
  const dir = path.join(process.cwd(), 'public', 'reflections');
  await fs.mkdir(dir, { recursive: true });

  // Save the image
  const imagePath = path.join(dir, `${dateKey}.png`);
  await fs.writeFile(imagePath, imageBuffer);

  // Return result
  return {
    path: imagePath,
    dateKey,
    status: 'completed',
    generatedAt: new Date(),
  };
}

/**
 * Main function to generate and save test image
 */
async function generateTestImage() {
  const spinner = ora('Starting test image generation').start();

  try {
    // Get reflection from database
    spinner.text = `Fetching reflection for ${TEST_DATE_KEY}`;
    const reflection = await getReflection(TEST_DATE_KEY);

    // Generate image
    spinner.text = `Generating image for ${TEST_DATE_KEY}: ${reflection.title}`;
    const imageBuffer = await generateReflectionImage({ reflection });

    // Save image to disk
    spinner.text = `Saving image for ${TEST_DATE_KEY}`;
    const result = await saveReflectionImage({ dateKey: TEST_DATE_KEY, imageBuffer });

    spinner.succeed(`Successfully generated and saved test image to ${result.path}`);
    console.log(`\nImage details:`);
    console.log(`- Date key: ${TEST_DATE_KEY}`);
    console.log(`- Title: ${reflection.title}`);
    console.log(`- Path: ${result.path}`);
    console.log(`- Size: ${imageBuffer.length} bytes`);
    console.log(`\nYou can now access this image at: http://localhost:3000/reflections/${TEST_DATE_KEY}.png`);
    console.log(`Or view it in context at: http://localhost:3000/${TEST_DATE_KEY}`);

  } catch (error) {
    spinner.fail(`Error generating test image: ${error.message}`);
    console.error(error);
  }
}

// Run the main function
generateTestImage().catch(console.error);