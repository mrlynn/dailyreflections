/**
 * Script to recreate a broken vector search index in MongoDB Atlas
 *
 * This script:
 * 1. Connects to MongoDB
 * 2. Checks if the current vector index is in FAILED state
 * 3. If broken, provides instructions to fix it
 *
 * Run with: node scripts/fix-vector-index.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

// Configuration
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'dailyreflections';
const COLLECTION_NAME = 'reflections';
const INDEX_NAME = 'reflections_vector_index';

async function checkAndFixVectorIndex() {
  console.log('🔧 Vector Search Index Repair Tool');
  console.log('=================================');

  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    console.error('Please add MONGODB_URI to .env.local file');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    const db = client.db(DB_NAME);

    // Check if the collection exists
    const collections = await db.listCollections({ name: COLLECTION_NAME }).toArray();
    if (collections.length === 0) {
      console.error(`❌ Collection "${COLLECTION_NAME}" not found`);
      return;
    }

    // Check if vector search index exists and get its status
    let indexExists = false;
    let indexStatus = 'UNKNOWN';

    try {
      const indexes = await db.command({ listSearchIndexes: COLLECTION_NAME });
      const vectorIndex = indexes.cursor.firstBatch.find(index => index.name === INDEX_NAME);

      if (vectorIndex) {
        indexExists = true;
        indexStatus = vectorIndex.status;
        console.log(`📊 Vector index "${INDEX_NAME}" status: ${indexStatus}`);
      }
    } catch (error) {
      console.error(`❌ Error checking search indexes: ${error.message}`);
    }

    // Check if any document has embeddings
    const hasEmbeddings = await db.collection(COLLECTION_NAME).findOne(
      { embedding: { $exists: true } }
    );

    if (!hasEmbeddings) {
      console.error('❌ No documents with embeddings found');
      console.log('Run the embedding generation script first:');
      console.log('$ node scripts/clean-and-embed-reflections.js');
      return;
    }

    console.log('✅ Documents with embeddings exist');

    // Define a new index configuration
    const newIndexDefinition = {
      name: INDEX_NAME,
      definition: {
        mappings: {
          dynamic: true,
          fields: {
            embedding: {
              type: 'knnVector',
              dimensions: 1536,
              similarity: 'cosine',
            },
          }
        }
      }
    };

    // Instructions for recreating the index
    console.log('\n📝 To fix the vector search index:');
    console.log('----------------------------------');
    if (indexExists) {
      if (indexStatus === 'FAILED' || indexStatus === 'UNKNOWN') {
        console.log('1. First, delete the existing failed index in MongoDB Atlas:');
        console.log(`   - Go to Atlas UI → Your Cluster → Search`);
        console.log(`   - Find index "${INDEX_NAME}" and delete it`);
      }
    }

    console.log('\n2. Create a new vector search index:');
    console.log('   - Go to MongoDB Atlas → Your Cluster → Search → Create Search Index');
    console.log('   - Select "JSON Editor"');
    console.log('   - Paste the following JSON:');
    console.log('\n```json');
    console.log(JSON.stringify(newIndexDefinition, null, 2));
    console.log('```\n');
    console.log('   - Click "Next" → "Create Search Index"');
    console.log('\n⚠️  The index may take a few minutes to build');

    // Test embedding dimensions from a sample document
    const sample = await db.collection(COLLECTION_NAME).findOne(
      { embedding: { $exists: true } },
      { projection: { embedding: 1 } }
    );

    if (sample && Array.isArray(sample.embedding)) {
      console.log(`\n📊 Sample embedding dimensions: ${sample.embedding.length}`);
      if (sample.embedding.length !== 1536) {
        console.log(`⚠️  WARNING: Expected 1536 dimensions but found ${sample.embedding.length}`);
        console.log('You may need to adjust the dimensions in the index definition above');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run the script
if (require.main === module) {
  checkAndFixVectorIndex().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { checkAndFixVectorIndex };