/**
 * Script to create a MongoDB text search index
 *
 * This provides better text search capability as a fallback when vector search is unavailable
 *
 * Run with: node scripts/create-text-search-index.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

// Configuration
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'dailyreflections';
const COLLECTION_NAME = 'reflections';
const TEXT_INDEX_NAME = 'reflection_text_index';

async function createTextSearchIndex() {
  console.log('🔧 Creating MongoDB Text Search Index');
  console.log('====================================');

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
    const collection = db.collection(COLLECTION_NAME);

    // Check if collection exists
    const collections = await db.listCollections({ name: COLLECTION_NAME }).toArray();
    if (collections.length === 0) {
      console.error(`❌ Collection "${COLLECTION_NAME}" not found`);
      return;
    }
    console.log(`✅ Collection "${COLLECTION_NAME}" exists`);

    // Check if text index already exists
    const indexes = await collection.indexes();
    const textIndex = indexes.find(idx => idx.name === TEXT_INDEX_NAME);

    if (textIndex) {
      console.log(`⚠️ Text index "${TEXT_INDEX_NAME}" already exists`);
      console.log('Index info:', JSON.stringify(textIndex, null, 2));
      console.log('\nTo recreate the index, drop it first:');
      console.log(`db.${COLLECTION_NAME}.dropIndex("${TEXT_INDEX_NAME}")`);
      return;
    }

    // Create text index on title, quote, comment, and reference fields
    console.log(`\n📝 Creating text index "${TEXT_INDEX_NAME}"...`);

    const result = await collection.createIndex(
      {
        title: "text",
        quote: "text",
        comment: "text",
        reference: "text"
      },
      {
        name: TEXT_INDEX_NAME,
        weights: {
          title: 10,    // Title is most important
          quote: 5,     // Quote is next most important
          comment: 3,   // Comment is less important
          reference: 1  // Reference is least important
        },
        default_language: "english",
        language_override: "language"
      }
    );

    console.log('✅ Text index created successfully!');
    console.log('Index creation result:', result);

    // Print usage information
    console.log('\n📚 Usage Examples:');
    console.log('------------------');
    console.log('1. Basic text search:');
    console.log(`   db.${COLLECTION_NAME}.find({ $text: { $search: "acceptance surrender" } })`);
    console.log('\n2. Phrase search:');
    console.log(`   db.${COLLECTION_NAME}.find({ $text: { $search: '"spiritual awakening"' } })`);
    console.log('\n3. Search with score:');
    console.log(`   db.${COLLECTION_NAME}.find({ $text: { $search: "recovery" } }, { score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" } })`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run the script
if (require.main === module) {
  createTextSearchIndex().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { createTextSearchIndex };