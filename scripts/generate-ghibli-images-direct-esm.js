/**
 * Direct MongoDB Ghibli Image Generator for Daily Reflections
 *
 * This script:
 * 1. Directly connects to MongoDB to fetch reflections
 * 2. Generates Studio Ghibli-style images using OpenAI's DALL-E API
 * 3. Saves images to the file system and updates MongoDB documents
 */

// Required modules - using ES modules syntax
import { promises as fs } from 'fs';
import path from 'path';
import { MongoClient, ObjectId } from 'mongodb';
import OpenAI from 'openai';
import axios from 'axios';
import { createHash } from 'crypto';
import { Command } from 'commander';

// Use dirname in ES modules
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define MongoDB connection string
const MONGODB_URI = 'mongodb+srv://mike:Password678%21@performance.zbcul.mongodb.net/dailyreflections';
const DB_NAME = 'dailyreflections';
const COLLECTION_NAME = 'reflections';

// Path to save images
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'reflections');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize commander
const program = new Command();

// Parse command line arguments
program
  .name('generate-ghibli-images-direct')
  .description('Generate Studio Ghibli style images for daily reflections')
  .option('-d, --date <date>', 'Generate image for a specific date (MM-DD format)')
  .option('-a, --all', 'Generate images for all reflections')
  .option('-f, --force', 'Force regeneration even if images exist')
  .option('--dry-run', 'Show what would be done without making changes')
  .version('1.0.0');

program.parse(process.argv);
const options = program.opts();

/**
 * Connect to MongoDB
 * @returns {Promise<MongoClient>} MongoDB client
 */
async function connectToMongoDB() {
  try {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB successfully');
    return client;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    throw error;
  }
}

/**
 * Get a reflection document by date
 * @param {MongoClient} client - MongoDB client
 * @param {string} dateKey - Date in MM-DD format
 * @returns {Promise<Object|null>} Reflection document
 */
async function getReflectionByDateKey(client, dateKey) {
  const [month, day] = dateKey.split('-').map(Number);

  const db = client.db(DB_NAME);
  const collection = db.collection(COLLECTION_NAME);

  return collection.findOne({ month, day });
}

/**
 * Get all reflections or those needing image generation
 * @param {MongoClient} client - MongoDB client
 * @param {Object} options - Options for filtering reflections
 * @returns {Promise<Array>} Array of reflection documents
 */
async function getReflections(client, { onlyFailed = false, force = false }) {
  const db = client.db(DB_NAME);
  const collection = db.collection(COLLECTION_NAME);

  const query = {};

  if (!force) {
    if (onlyFailed) {
      query["image.status"] = "failed";
    } else {
      query.$or = [
        { "image.url": { $exists: false } },
        { "image": { $exists: false } },
        { "image.status": "failed" }
      ];
    }
  }

  return collection.find(query).toArray();
}

/**
 * Update reflection document with image data
 * @param {MongoClient} client - MongoDB client
 * @param {string|ObjectId} id - Reflection document ID
 * @param {Object} imageData - Image metadata
 * @returns {Promise<Object>} Updated document
 */
async function updateReflectionWithImage(client, id, imageData) {
  const db = client.db(DB_NAME);
  const collection = db.collection(COLLECTION_NAME);

  const _id = typeof id === 'string' ? new ObjectId(id) : id;

  const result = await collection.findOneAndUpdate(
    { _id },
    { $set: { image: imageData } },
    { returnDocument: 'after' }
  );

  return result;
}

/**
 * Set reflection image status to pending
 * @param {MongoClient} client - MongoDB client
 * @param {string|ObjectId} id - Reflection document ID
 * @param {Object} data - Additional data
 * @returns {Promise<Object>} Updated document
 */
async function setReflectionImagePending(client, id, data = {}) {
  const db = client.db(DB_NAME);
  const collection = db.collection(COLLECTION_NAME);

  const _id = typeof id === 'string' ? new ObjectId(id) : id;
  const revision = data.revision || 0;

  const result = await collection.findOneAndUpdate(
    { _id },
    {
      $set: {
        image: {
          ...data,
          status: "pending",
          revision: revision,
          generatedAt: new Date()
        }
      }
    },
    { returnDocument: 'after' }
  );

  return result;
}

/**
 * Create a Studio Ghibli style prompt for image generation
 * @param {Object} reflection - Reflection document
 * @returns {string} DALL-E prompt
 */
function createGhibliImagePrompt(reflection) {
  const { title, quote, comment } = reflection;

  // Extract themes from reflection
  const themes = extractThemes(title, quote, comment);
  const themesString = themes.join(', ');

  // Base prompt elements - emphasizing Ghibli's specific art directors
  const basePrompt = `Create a Studio Ghibli animation cel style horizontal landscape inspired by the art direction of Kazuo Oga and Hayao Miyazaki, that visually represents a daily reflection with the theme "${title || 'Daily Reflection'}". The image should capture themes of ${themesString}.`;

  // Add reflection-specific content
  let contextPrompt = '';
  if (quote) {
    const quoteExcerpt = quote.length > 80 ? quote.substring(0, 80) + '...' : quote;
    contextPrompt += `The reflection includes this quote: "${quoteExcerpt}"\n\n`;
  }

  // Add detailed Ghibli style guidance with very specific elements
  const stylePrompt = `
Create this in the unmistakable style of Studio Ghibli with these essential characteristics:

1. COLOR PALETTE: Use Ghibli's signature palette with:
   - Sky gradients transitioning from pale to deep cerulean blue
   - Vibrant emerald and sage greens for vegetation
   - Rich earth tones (ochre, sienna, umber) for ground elements
   - Soft pastel accents for flowers or highlights
   - Overall slightly saturated, watercolor-like quality

2. LIGHTING AND ATMOSPHERE:
   - Strong directional lighting creating long shadows or dappled light through foliage
   - Distinctive Ghibli "god rays" of sunlight streaming through clouds/trees
   - Atmospheric perspective with distant elements having blue/hazy quality
   - Glowing rim lighting on foliage edges catching sunlight

3. DISTINCTIVE GHIBLI ELEMENTS (include at least 3):
   - Billowing, three-dimensional cumulus clouds with detailed internal structure
   - Wind-swept grass with visible directional flow like in "Princess Mononoke"
   - Detailed leaf/foliage rendering with individual leaves visible like in "Totoro"
   - Water bodies with characteristic Ghibli reflections and transparency as in "Spirited Away"
   - Ancient, gnarled tree with character similar to the camphor tree in "Totoro"
   - Winding path or steps leading through the landscape like in "Spirited Away"
   - Distant, tiny architectural element (like a shrine gate, small house, or windmill)

4. ARTISTIC TECHNIQUE:
   - Hand-painted appearance with visible but delicate brushstrokes
   - Clear cel-animation style linework for foreground elements
   - Layered composition with distinct foreground, midground and background
   - Combination of precise details in focal areas with softer backgrounds

The image MUST look like it could be a background plate from an actual Studio Ghibli film, not just "inspired by" or "in the style of" but truly capturing their signature artistic approach.

Critical requirements: NO text. NO recognizable human faces. NO religious symbols. The image MUST be in horizontal landscape format (1792x1024).`;

  return `${basePrompt}\n\n${contextPrompt}${stylePrompt}`;
}

/**
 * Extract themes from reflection text
 * @param {string} title - Reflection title
 * @param {string} quote - Reflection quote
 * @param {string} comment - Reflection comment
 * @returns {Array<string>} Array of themes
 */
function extractThemes(title, quote, comment) {
  const text = `${title || ""} ${quote || ""} ${comment || ""}`.toLowerCase();

  const themeKeywords = {
    "acceptance": ["accept", "acceptance", "accepting", "acknowledge"],
    "gratitude": ["grateful", "gratitude", "thankful", "thanks", "appreciate"],
    "serenity": ["serenity", "serene", "peace", "peaceful", "calm", "tranquil"],
    "hope": ["hope", "hopeful", "optimism", "optimistic", "faith", "believe"],
    "courage": ["courage", "brave", "bravery", "strength", "strong", "endure"],
    "recovery": ["recovery", "sobriety", "sober", "alcoholics", "alcoholism", "aa"],
    "growth": ["grow", "growth", "progress", "journey", "change", "transform"],
    "spirituality": ["god", "higher power", "spiritual", "prayer", "meditation", "faith"]
  };

  const detectedThemes = [];

  // Check for each theme
  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      detectedThemes.push(theme);
    }
  }

  // Add default themes if none detected
  if (detectedThemes.length === 0) {
    return ["recovery", "serenity", "nature"];
  }

  return detectedThemes;
}

/**
 * Check if image exists for date
 * @param {string} dateKey - Date in MM-DD format
 * @returns {Promise<boolean>} Whether image exists
 */
async function imageExists(dateKey) {
  try {
    const imagePath = path.join(OUTPUT_DIR, `${dateKey}.jpg`);
    await fs.access(imagePath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Generate image using OpenAI's DALL-E API
 * @param {string} prompt - Image generation prompt
 * @returns {Promise<Buffer>} Image buffer
 */
async function generateImage(prompt) {
  try {
    console.log('Generating image with DALL-E...');

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1792x1024",
      quality: "standard",
      style: "vivid",
      response_format: "url"
    });

    const imageUrl = response.data[0].url;
    console.log('Image generated, downloading...');

    // Download the image
    const imageResponse = await axios({
      url: imageUrl,
      responseType: 'arraybuffer'
    });

    return Buffer.from(imageResponse.data);
  } catch (error) {
    console.error('Error generating image:', error.message);
    throw error;
  }
}

/**
 * Save image to file system
 * @param {string} dateKey - Date in MM-DD format
 * @param {Buffer} imageBuffer - Image data
 * @returns {Promise<Object>} Image metadata
 */
async function saveImage(dateKey, imageBuffer) {
  try {
    // Ensure output directory exists
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    // Calculate image hash for verification
    const imageHash = createHash("md5").update(imageBuffer).digest("hex").substring(0, 8);

    // Define file path
    const filePath = path.join(OUTPUT_DIR, `${dateKey}.jpg`);

    // Write file
    await fs.writeFile(filePath, imageBuffer);
    console.log(`Image saved to: ${filePath}`);

    // Generate URL for the image (relative to public directory)
    const relativeUrl = `/reflections/${dateKey}.jpg`;

    return {
      url: relativeUrl,
      path: filePath,
      hash: imageHash,
      size: imageBuffer.length,
      dateKey,
      exists: true,
      status: 'completed',
      generatedAt: new Date()
    };
  } catch (error) {
    console.error('Error saving image:', error.message);
    throw error;
  }
}

/**
 * Format date string as MM-DD
 * @param {number} month - Month (1-12)
 * @param {number} day - Day (1-31)
 * @returns {string} Formatted date string (MM-DD)
 */
function formatDateKey(month, day) {
  return `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Get today's date in MM-DD format
 * @returns {string} Today's date (MM-DD)
 */
function getTodayDateKey() {
  const today = new Date();
  const month = today.getMonth() + 1; // Month is 0-indexed
  const day = today.getDate();
  return formatDateKey(month, day);
}

/**
 * Main function
 */
async function main() {
  console.log('=== Ghibli Image Generator for Daily Reflections ===');

  if (!process.env.OPENAI_API_KEY) {
    console.error('ERROR: OPENAI_API_KEY environment variable is not set');
    console.error('Please set your API key with: export OPENAI_API_KEY=your_api_key');
    process.exit(1);
  }

  let client;
  try {
    // Connect to MongoDB
    client = await connectToMongoDB();

    // Determine which reflections to process
    let reflections = [];

    if (options.all) {
      console.log('Processing all reflections...');
      reflections = await getReflections(client, { force: options.force });
    } else if (options.date) {
      const dateKey = options.date;
      console.log(`Processing reflection for date: ${dateKey}`);

      const reflection = await getReflectionByDateKey(client, dateKey);
      if (!reflection) {
        console.error(`No reflection found for date ${dateKey}`);
        process.exit(1);
      }

      if (!options.force && await imageExists(dateKey)) {
        console.log(`Image already exists for ${dateKey}. Use --force to regenerate.`);
        process.exit(0);
      }

      reflections = [reflection];
    } else {
      // Default to today's reflection
      const today = getTodayDateKey();
      console.log(`Processing today's reflection (${today})...`);

      const reflection = await getReflectionByDateKey(client, today);
      if (!reflection) {
        console.error(`No reflection found for today (${today})`);
        process.exit(1);
      }

      if (!options.force && await imageExists(today)) {
        console.log(`Image already exists for today (${today}). Use --force to regenerate.`);
        process.exit(0);
      }

      reflections = [reflection];
    }

    console.log(`Found ${reflections.length} reflections to process`);

    if (options.dryRun) {
      console.log('DRY RUN: No changes will be made');
      reflections.forEach(reflection => {
        const dateKey = formatDateKey(reflection.month, reflection.day);
        console.log(`- ${dateKey}: ${reflection.title}`);
      });
      process.exit(0);
    }

    // Process each reflection
    for (let i = 0; i < reflections.length; i++) {
      const reflection = reflections[i];
      const dateKey = formatDateKey(reflection.month, reflection.day);

      console.log(`\n[${i+1}/${reflections.length}] Processing ${dateKey}: ${reflection.title}`);

      try {
        // Skip if image exists and not forcing
        if (!options.force && await imageExists(dateKey)) {
          console.log(`Image already exists for ${dateKey} - skipping`);
          continue;
        }

        // Set status to pending in database
        await setReflectionImagePending(client, reflection._id, {
          dateKey,
          revision: (reflection.image?.revision || 0) + 1
        });

        // Create prompt for Ghibli-style image
        const prompt = createGhibliImagePrompt(reflection);

        // Generate image
        console.log(`Generating Ghibli-style image for ${dateKey}...`);
        const imageBuffer = await generateImage(prompt);

        // Save image
        console.log(`Saving image for ${dateKey}...`);
        const imageInfo = await saveImage(dateKey, imageBuffer);

        // Update MongoDB with image info
        console.log(`Updating reflection document for ${dateKey}...`);
        await updateReflectionWithImage(client, reflection._id, imageInfo);

        console.log(`Successfully generated image for ${dateKey}`);
      } catch (error) {
        console.error(`Error processing ${dateKey}:`, error.message);

        // Update database with error status
        await updateReflectionWithImage(client, reflection._id, {
          status: 'failed',
          error: error.message,
          generatedAt: new Date()
        });
      }
    }

    console.log('\n=== Image Generation Complete ===');
  } catch (error) {
    console.error('Error in main process:', error.message);
    process.exit(1);
  } finally {
    // Close MongoDB connection
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Execute the script
main();