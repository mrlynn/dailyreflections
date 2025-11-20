/**
 * Generate Daily Thoughts for the Entire Year
 *
 * This script generates daily recovery thoughts for all dates in the year
 * by processing the daily reflections and using AI to create insightful,
 * contextual thoughts based on each reflection's content.
 */

const { MongoClient } = require('mongodb');
const { OpenAI } = require('openai');
require('dotenv').config({ path: '.env.local' });

// MongoDB Connection
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('Missing MONGODB_URI environment variable');
  process.exit(1);
}

// OpenAI Configuration
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('Missing OPENAI_API_KEY environment variable');
  process.exit(1);
}

const openai = new OpenAI({ apiKey });

// Database name
const dbName = process.env.MONGODB_DB || 'dailyreflections';

/**
 * Format a date key (MM-DD) to a readable string
 * @param {string|Object} dateKeyOrReflection - Date in MM-DD format or reflection object with month and day
 * @returns {string} Formatted date string (e.g., "January 1")
 */
function formatDateKey(dateKeyOrReflection) {
  let month, day;

  if (typeof dateKeyOrReflection === 'string' && dateKeyOrReflection.includes('-')) {
    [month, day] = dateKeyOrReflection.split('-').map(num => parseInt(num, 10));
  } else if (dateKeyOrReflection && typeof dateKeyOrReflection === 'object') {
    month = dateKeyOrReflection.month;
    day = dateKeyOrReflection.day;
  } else {
    console.error('Invalid dateKey or reflection:', dateKeyOrReflection);
    return 'Unknown Date';
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return `${months[month - 1]} ${day}`;
}

/**
 * Generate a daily thought based on reflection content
 * @param {Object} reflection - The daily reflection object
 * @returns {Object} Generated thought
 */
async function generateThought(reflection) {
  try {
    // Create dateKey from month and day if it doesn't exist
    if (!reflection.dateKey) {
      reflection.dateKey = `${String(reflection.month).padStart(2, '0')}-${String(reflection.day).padStart(2, '0')}`;
    }

    console.log(`Generating thought for ${formatDateKey(reflection)}...`);

    // Create a prompt for the AI
    const prompt = `
You are an expert in recovery principles and modern psychology. Your task is to create a thoughtful, inspiring "Daily Thought" based on an AA Daily Reflection.

The Daily Reflection for ${formatDateKey(reflection)} is:
Title: ${reflection.title}
Quote: ${reflection.quote}
Reflection: ${reflection.comment}
Reference: ${reflection.reference}

Please create a daily thought that:
1. Distills the essence of this reflection into a modern context
2. Is concise, thoughtful and inspiring (2-3 sentences maximum)
3. Includes a brief, practical challenge that someone could act on today
4. Is accessible to people in all stages of recovery

Format your response as valid JSON with this exact structure:
{
  "title": "A concise, catchy title (3-6 words)",
  "thought": "The main insight or thought (2-3 sentences)",
  "challenge": "A brief, practical challenge related to the thought (1-2 sentences)"
}

Make sure the JSON is properly formatted and valid.`;

    // Get AI-generated response
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    });

    // Parse the response content
    const content = response.choices[0].message.content;
    let thoughtData;

    try {
      thoughtData = JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse AI response as JSON:', error);
      console.log('Raw response:', content);
      return null;
    }

    // Build the complete thought object
    return {
      month: reflection.month,
      day: reflection.day,
      dateKey: reflection.dateKey,
      title: thoughtData.title,
      thought: thoughtData.thought,
      challenge: thoughtData.challenge,
      relatedReflectionDateKey: reflection.dateKey,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    console.error(`Error generating thought for ${formatDateKey(reflection)}:`, error);
    return null;
  }
}

/**
 * Main function to run the script
 */
async function main() {
  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
  });

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);
    const reflectionsCollection = db.collection('reflections');
    const thoughtsCollection = db.collection('dailyThoughts');

    // Create index for dailyThoughts collection if it doesn't exist
    const indexes = await thoughtsCollection.indexes();
    const hasMonthDayIndex = indexes.some(index =>
      index.key && index.key.month === 1 && index.key.day === 1);

    if (!hasMonthDayIndex) {
      console.log('Creating month/day index on dailyThoughts collection...');
      await thoughtsCollection.createIndex({ month: 1, day: 1 }, { unique: true });
    }

    // Get command line arguments
    const args = process.argv.slice(2);
    const options = {
      force: args.includes('--force'),
      reset: args.includes('--reset'),
      dryRun: args.includes('--dry-run')
    };

    // If --reset flag is provided, drop the collection
    if (options.reset) {
      console.log('Resetting dailyThoughts collection...');
      await thoughtsCollection.drop().catch(() => console.log('Collection did not exist, nothing to drop'));

      // Recreate the index
      await thoughtsCollection.createIndex({ month: 1, day: 1 }, { unique: true });
    }

    // Get all reflections
    const allReflections = await reflectionsCollection.find({}).toArray();

    if (allReflections.length === 0) {
      console.log('No reflections found');
      return;
    }

    console.log(`Found ${allReflections.length} total reflections`);

    // Handle duplicate dates by keeping only the first reflection for each date
    const dateMap = {};
    const reflections = [];

    allReflections.forEach(reflection => {
      const key = `${reflection.month}-${reflection.day}`;
      if (!dateMap[key]) {
        dateMap[key] = true;
        reflections.push(reflection);
      }
    });

    console.log(`Found ${reflections.length} unique date reflections to process (eliminated ${allReflections.length - reflections.length} duplicates)`);

    // Count how many thoughts we need to generate
    const existingThoughts = await thoughtsCollection.find({}).toArray();
    console.log(`Found ${existingThoughts.length} existing thoughts in the database`);

    // Create a map of existing thoughts for quick lookup
    const existingThoughtsMap = {};
    existingThoughts.forEach(thought => {
      const key = `${thought.month}-${thought.day}`;
      existingThoughtsMap[key] = thought;
    });

    // Process each reflection and generate a thought
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const reflection of reflections) {
      // Create a key for lookup
      const key = `${reflection.month}-${reflection.day}`;
      const existingThought = existingThoughtsMap[key];

      // Skip if thought exists and force flag is not set
      if (existingThought && !options.force) {
        console.log(`Thought already exists for ${formatDateKey(reflection)}, skipping...`);
        skippedCount++;
        continue;
      }

      // Generate a new thought
      const thought = await generateThought(reflection);

      if (!thought) {
        console.log(`Failed to generate thought for ${formatDateKey(reflection)}, skipping...`);
        errorCount++;
        continue;
      }

      // In dry run mode, we don't insert/update
      if (options.dryRun) {
        console.log(`[DRY RUN] Would ${existingThought ? 'update' : 'insert'} thought for ${formatDateKey(reflection)}`);
        continue;
      }

      // Insert or update the thought
      if (existingThought) {
        console.log(`Updating thought for ${formatDateKey(reflection)}...`);
        await thoughtsCollection.updateOne(
          { _id: existingThought._id },
          { $set: thought }
        );
        updatedCount++;
      } else {
        console.log(`Inserting new thought for ${formatDateKey(reflection)}...`);
        await thoughtsCollection.insertOne(thought);
        createdCount++;
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Summary
    console.log('\n=== Summary ===');
    console.log(`Total reflections processed: ${reflections.length}`);
    console.log(`Created: ${createdCount}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Failed: ${errorCount}`);

    console.log('Generation completed successfully');
  } catch (error) {
    console.error('Script error:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
main().catch(console.error);