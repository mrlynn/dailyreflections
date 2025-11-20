/**
 * Script to clean HTML tags from reflections, normalize text, and generate embeddings
 * 
 * This script:
 * 1. Fetches all reflections from MongoDB
 * 2. Uses OpenAI to clean HTML and normalize text (preserving meaning)
 * 3. Generates embeddings for vector search
 * 4. Updates MongoDB with cleaned content and embeddings
 * 
 * Run with: node scripts/clean-and-embed-reflections.js
 * 
 * Required environment variables:
 * - MONGODB_URI: MongoDB connection string
 * - OPENAI_API_KEY: OpenAI API key
 */

const { MongoClient, ObjectId } = require('mongodb');
const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

// Configuration
const MONGODB_URI = process.env.MONGODB_URI;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DB_NAME = 'dailyreflections';
const COLLECTION_NAME = 'reflections';

// Initialize OpenAI client
if (!OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY not found in .env.local');
  console.error('Please add OPENAI_API_KEY=your-key to .env.local');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Rate limiting: Add delay between API calls
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Clean HTML and normalize text using OpenAI
 * Preserves original meaning while removing HTML tags and fixing issues
 */
async function cleanReflectionText(originalComment, title, quote, reference) {
  const prompt = `You are a text cleaning assistant for a recovery-focused application. Your task is to clean HTML and normalize text while PRESERVING THE EXACT MEANING AND TONE.

ORIGINAL TEXT (may contain HTML tags):
${originalComment}

INSTRUCTIONS:
1. Remove ALL HTML tags (like <p>, </p>, <br>, etc.) but keep the text content
2. Fix broken symbols or corrupted characters (e.g., "&quot;" → ", "&amp;" → &, "â€™" → ')
3. Normalize whitespace (remove extra spaces, fix line breaks)
4. Fix any broken words or formatting issues
5. PRESERVE the original meaning, tone, and structure exactly
6. Do NOT rewrite or paraphrase - keep the original text as close as possible
7. Return ONLY the cleaned text, no explanations or markdown

Return the cleaned text:`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Cost-effective and fast
      messages: [
        {
          role: 'system',
          content: 'You are a precise text cleaning assistant. You remove HTML tags and fix formatting while preserving the exact original meaning and tone.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1, // Low temperature for consistency
      max_tokens: 2000,
    });

    const cleanedText = response.choices[0].message.content.trim();
    return cleanedText;
  } catch (error) {
    console.error('Error cleaning text with OpenAI:', error.message);
    throw error;
  }
}

/**
 * Generate embedding for vector search
 * Combines title, quote, comment, and reference for comprehensive search
 */
async function generateEmbedding(title, quote, comment, reference) {
  // Combine all text fields for comprehensive embedding
  const combinedText = `${title}\n\n${quote}\n\n${comment}\n\nReference: ${reference}`;

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small', // Cost-effective, 1536 dimensions
      input: combinedText,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error.message);
    throw error;
  }
}

/**
 * Process a single reflection
 */
async function processReflection(reflection, client, dryRun = false) {
  const { _id, title, quote, comment, reference, month, day } = reflection;
  const dateKey = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  console.log(`\n📖 Processing: ${dateKey} - ${title}`);

  try {
    // Clean the comment text
    console.log('  🔄 Cleaning HTML and normalizing text...');
    const cleanedComment = await cleanReflectionText(comment, title, quote, reference);
    await delay(200); // Rate limiting

    // Generate embedding
    console.log('  🧠 Generating embedding...');
    const embedding = await generateEmbedding(title, quote, cleanedComment, reference);
    await delay(200); // Rate limiting

    // Update database
    if (!dryRun) {
      const db = client.db(DB_NAME);
      await db.collection(COLLECTION_NAME).updateOne(
        { _id },
        {
          $set: {
            comment: cleanedComment, // Replace HTML with cleaned text
            commentCleaned: true, // Flag to indicate cleaning completed
            embedding: embedding, // Vector embedding
            cleanedAt: new Date(), // Timestamp
          },
        }
      );
      console.log('  ✅ Updated in database');
    } else {
      console.log('  ⚠️  DRY RUN - Would update database');
      console.log(`  Original: ${comment.substring(0, 100)}...`);
      console.log(`  Cleaned:  ${cleanedComment.substring(0, 100)}...`);
    }

    return { success: true, reflectionId: _id, dateKey };
  } catch (error) {
    console.error(`  ❌ Error processing reflection ${dateKey}:`, error.message);
    return { success: false, reflectionId: _id, dateKey, error: error.message };
  }
}

/**
 * Main processing function
 */
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limit = args.find(arg => arg.startsWith('--limit='))?.split('=')[1];

  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be saved to database\n');
  }

  if (!MONGODB_URI) {
    console.error('❌ Error: MONGODB_URI not found in .env.local');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    const db = client.db(DB_NAME);

    // Check if collection exists
    const collections = await db.listCollections({ name: COLLECTION_NAME }).toArray();
    if (collections.length === 0) {
      console.error(`❌ Error: Collection "${COLLECTION_NAME}" not found`);
      process.exit(1);
    }

    // Fetch reflections
    console.log('📚 Fetching reflections...');
    let query = {};
    
    // Optional: only process reflections that haven't been cleaned yet
    const onlyUncleaned = args.includes('--only-uncleaned');
    if (onlyUncleaned) {
      query = { commentCleaned: { $ne: true } };
    }

    let reflections = await db.collection(COLLECTION_NAME).find(query).toArray();
    
    if (limit) {
      const limitNum = parseInt(limit, 10);
      reflections = reflections.slice(0, limitNum);
      console.log(`⚠️  Limited to first ${limitNum} reflections`);
    }

    const totalCount = reflections.length;
    console.log(`📊 Found ${totalCount} reflection${totalCount === 1 ? '' : 's'} to process\n`);

    if (totalCount === 0) {
      console.log('✅ No reflections to process');
      await client.close();
      process.exit(0);
    }

    // Process reflections
    const results = {
      success: [],
      failed: [],
    };

    for (let i = 0; i < reflections.length; i++) {
      const reflection = reflections[i];
      const progress = `[${i + 1}/${totalCount}]`;
      console.log(`\n${progress} Processing reflection ${i + 1} of ${totalCount}...`);

      const result = await processReflection(reflection, client, dryRun);
      
      if (result.success) {
        results.success.push(result);
      } else {
        results.failed.push(result);
      }

      // Progress summary every 10 items
      if ((i + 1) % 10 === 0) {
        console.log(`\n📊 Progress: ${i + 1}/${totalCount} processed (${results.success.length} success, ${results.failed.length} failed)`);
      }
    }

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 PROCESSING COMPLETE');
    console.log('='.repeat(60));
    console.log(`✅ Successfully processed: ${results.success.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    console.log(`📝 Total: ${totalCount}`);

    if (results.failed.length > 0) {
      console.log('\n❌ Failed reflections:');
      results.failed.forEach(({ dateKey, error }) => {
        console.log(`  - ${dateKey}: ${error}`);
      });
    }

    if (dryRun) {
      console.log('\n⚠️  DRY RUN MODE - No changes were saved');
      console.log('Run without --dry-run to apply changes');
    } else {
      console.log('\n✅ All changes have been saved to the database');
    }

    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    await client.close();
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  console.log('🧹 Daily Reflections Cleaning & Embedding Script');
  console.log('='.repeat(60));
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { cleanReflectionText, generateEmbedding };

