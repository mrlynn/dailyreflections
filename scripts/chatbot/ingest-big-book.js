/**
 * Script to ingest AA Big Book content into MongoDB with OpenAI vector embeddings
 *
 * This script:
 * 1. Reads the chunked AA Big Book content from the JSON files
 * 2. Generates embeddings using OpenAI API
 * 3. Uploads the content with embeddings to MongoDB
 * 4. Creates a vector search index for efficient semantic search
 *
 * Run with: node scripts/chatbot/ingest-big-book.js
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const { OpenAI } = require('openai');
require('dotenv').config({ path: '.env.local' });

// Configuration
const MONGODB_URI = process.env.MONGODB_URI;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DB_NAME = 'dailyreflections';
const COLLECTION_NAME = 'text_chunks';
const VECTOR_INDEX_NAME = 'vector_index';
const CHUNK_FILE_PATH = path.join(__dirname, '../../rag/files/aa_chunks_paragraph.json');
const EMBEDDING_MODEL = 'text-embedding-3-small'; // OpenAI embedding model (1536 dimensions)
const BATCH_SIZE = 5; // Process chunks in batches to avoid rate limits

/**
 * Main ingestion function
 */
async function ingestBigBookContent() {
  console.log('🔍 AA Big Book Content Ingestion');
  console.log('=================================');

  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    console.error('Please add MONGODB_URI to .env.local file');
    process.exit(1);
  }

  if (!OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in environment variables');
    console.error('Please add OPENAI_API_KEY to .env.local file');
    process.exit(1);
  }

  // Initialize OpenAI client
  console.log(`📊 Initializing OpenAI embedding model: ${EMBEDDING_MODEL}`);
  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });

  // Connect to MongoDB
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected successfully');

    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Read chunks from JSON file
    console.log(`📖 Reading chunks from ${CHUNK_FILE_PATH}`);
    const chunksData = JSON.parse(fs.readFileSync(CHUNK_FILE_PATH, 'utf8'));
    console.log(`📚 Found ${chunksData.length} chunks`);

    // Check if chunks already exist in database
    const existingCount = await collection.countDocuments({ source: 'AA Big Book 4th Edition' });
    if (existingCount > 0) {
      console.log(`⚠️ Found ${existingCount} existing Big Book chunks in database`);
      const answer = await promptYesNo('Delete existing chunks and reimport? (y/n)');

      if (answer) {
        console.log('🗑️ Deleting existing chunks...');
        await collection.deleteMany({ source: 'AA Big Book 4th Edition' });
        console.log('✅ Existing chunks deleted');
      } else {
        console.log('⚠️ Aborting import process');
        return;
      }
    }

    // Process chunks in batches
    console.log('🔄 Processing chunks and generating embeddings...');

    let processed = 0;
    let batches = Math.ceil(chunksData.length / BATCH_SIZE);

    for (let i = 0; i < batches; i++) {
      const startIdx = i * BATCH_SIZE;
      const endIdx = Math.min(startIdx + BATCH_SIZE, chunksData.length);
      const batchChunks = chunksData.slice(startIdx, endIdx);

      console.log(`⏳ Processing batch ${i + 1}/${batches} (chunks ${startIdx + 1}-${endIdx})...`);

      try {
        // Generate embeddings for each chunk in the batch
        const augmentedChunks = await Promise.all(batchChunks.map(async (chunk) => {
          try {
            // Generate embedding using OpenAI API
            const response = await openai.embeddings.create({
              model: EMBEDDING_MODEL,
              input: chunk.text,
            });

            // Extract embedding from response
            const embedding = response.data[0].embedding;

            // Return chunk with embedding
            return {
              ...chunk,
              embedding: embedding,
              embedding_model: EMBEDDING_MODEL,
              dimensions: embedding.length,
              created_at: new Date(),
            };
          } catch (embedError) {
            console.error(`❌ Error generating embedding for chunk ${chunk.chunk_id}:`, embedError.message);
            // Sleep for a moment to respect API rate limits
            await new Promise(resolve => setTimeout(resolve, 2000));
            throw embedError;
          }
        }));

        // Insert batch into database
        if (augmentedChunks.length > 0) {
          await collection.insertMany(augmentedChunks);
        }

        processed += batchChunks.length;
        console.log(`✅ Batch ${i + 1} complete. Total progress: ${processed}/${chunksData.length} (${Math.round((processed / chunksData.length) * 100)}%)`);

        // Sleep between batches to respect API rate limits
        if (i < batches - 1) {
          console.log('Waiting 2 seconds before next batch...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (batchError) {
        console.error(`❌ Error processing batch ${i + 1}:`, batchError.message);
        console.log('Waiting 5 seconds before retrying...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        i--; // Retry this batch
      }
    }

    console.log(`✅ Successfully processed ${processed} chunks`);

    // Create vector search index if it doesn't exist
    console.log('🔍 Checking for vector search index...');

    const indexes = await collection.listIndexes().toArray();
    const vectorIndex = indexes.find(idx => idx.name === VECTOR_INDEX_NAME);

    if (!vectorIndex) {
      console.log(`📝 Creating vector search index "${VECTOR_INDEX_NAME}"...`);

      const indexDefinition = {
        name: VECTOR_INDEX_NAME,
        type: "vectorSearch",
        definition: {
          fields: [
            {
              type: "vector",
              path: "embedding",
              numDimensions: 1536,  // Dimensions of OpenAI text-embedding-3-small
              similarity: "cosine"
            },
            {
              type: "filter",
              path: "page_number"
            },
            {
              type: "filter",
              path: "source"
            }
          ]
        }
      };

      try {
        // Atlas command (requires MongoDB 5.0+)
        await db.command({
          createSearchIndex: COLLECTION_NAME,
          definition: indexDefinition
        });
        console.log('✅ Vector search index created successfully!');
      } catch (indexError) {
        console.error('❌ Error creating vector search index:', indexError);
        console.log('⚠️ You may need to create the index manually in MongoDB Atlas console.');
        console.log('Use the following definition:');
        console.log(JSON.stringify(indexDefinition, null, 2));
      }
    } else {
      console.log(`✅ Vector search index "${VECTOR_INDEX_NAME}" already exists`);
    }

    console.log('\n🎉 Import complete!');
    console.log(`📊 Total chunks in database: ${await collection.countDocuments()}`);
    console.log('🔍 Your RAG chatbot is now ready to use with AA Big Book content!');

  } catch (error) {
    console.error('❌ Error during ingestion:', error);
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

/**
 * Prompts the user for a yes/no response
 * @param {string} question - The question to ask
 * @returns {Promise<boolean>} - True for yes, false for no
 */
function promptYesNo(question) {
  return new Promise((resolve) => {
    process.stdout.write(`${question} `);

    process.stdin.once('data', (data) => {
      const answer = data.toString().trim().toLowerCase();
      resolve(answer === 'y' || answer === 'yes');
    });
  });
}

// Run the script
if (require.main === module) {
  ingestBigBookContent().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { ingestBigBookContent };