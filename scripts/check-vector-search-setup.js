/**
 * Script to verify vector search setup in MongoDB
 *
 * This script:
 * 1. Connects to MongoDB
 * 2. Checks if the vector search index exists
 * 3. Verifies if reflections have embeddings
 *
 * Run with: node scripts/check-vector-search-setup.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

// Configuration
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'dailyreflections';
const COLLECTION_NAME = 'reflections';
const INDEX_NAME = 'reflections_vector_index'; // Updated to match the actual index name in MongoDB Atlas

async function checkVectorSearchSetup() {
  console.log('🔍 Checking Vector Search Setup');
  console.log('==============================');

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

    // 1. Check if collection exists
    console.log('📊 Checking reflections collection...');
    const collections = await db.listCollections({ name: COLLECTION_NAME }).toArray();
    if (collections.length === 0) {
      console.error(`❌ Collection "${COLLECTION_NAME}" not found`);
      return;
    }
    console.log(`✅ Collection "${COLLECTION_NAME}" exists\n`);

    // 2. Check if vector search index exists
    console.log('🔍 Checking vector search index...');
    try {
      // List all indexes to find vector search index
      const indexes = await db.command({ listSearchIndexes: COLLECTION_NAME });

      const vectorIndex = indexes.cursor.firstBatch.find(
        index => index.name === INDEX_NAME
      );

      if (!vectorIndex) {
        console.error(`❌ Vector search index "${INDEX_NAME}" not found`);
        console.log('You need to create the vector search index first:');
        console.log('$ node scripts/create-reflection-vector-index.js');
        console.log('Then follow the instructions to create the index in MongoDB Atlas UI');
      } else {
        console.log(`✅ Vector search index "${INDEX_NAME}" exists`);
        console.log(`   Status: ${vectorIndex.status}`);
      }
    } catch (error) {
      console.error(`❌ Error checking vector search index: ${error.message}`);
      if (error.message.includes('no such command')) {
        console.log('This might be normal if not using Atlas - check Atlas UI instead');
      }
    }

    // 3. Check if reflections have embeddings
    console.log('\n📝 Checking for embeddings in reflections...');

    // Count total reflections
    const totalCount = await db.collection(COLLECTION_NAME).countDocuments();
    console.log(`Total reflections: ${totalCount}`);

    // Count reflections with embeddings
    const withEmbeddings = await db.collection(COLLECTION_NAME).countDocuments({
      embedding: { $exists: true }
    });
    console.log(`Reflections with embeddings: ${withEmbeddings}`);

    // Calculate percentage
    const percentage = Math.round((withEmbeddings / totalCount) * 100);
    console.log(`Percentage with embeddings: ${percentage}%`);

    if (withEmbeddings === 0) {
      console.error('\n❌ No reflections have embeddings');
      console.log('You need to generate embeddings:');
      console.log('$ node scripts/clean-and-embed-reflections.js');
    } else if (withEmbeddings < totalCount) {
      console.log('\n⚠️ Some reflections are missing embeddings');
      console.log('To generate all embeddings:');
      console.log('$ node scripts/clean-and-embed-reflections.js');
    } else {
      console.log('\n✅ All reflections have embeddings');
    }

    // 4. Check a sample reflection with embedding
    if (withEmbeddings > 0) {
      console.log('\n📄 Sample reflection with embedding:');
      const sample = await db.collection(COLLECTION_NAME).findOne(
        { embedding: { $exists: true } },
        { projection: { _id: 1, title: 1, month: 1, day: 1, 'embedding.0': 1 } }
      );

      console.log(`ID: ${sample._id}`);
      console.log(`Title: ${sample.title}`);
      console.log(`Date: ${sample.month.toString().padStart(2, '0')}-${sample.day.toString().padStart(2, '0')}`);
      console.log(`Has embedding: ${!!sample.embedding}`);
      if (sample.embedding) {
        console.log(`Embedding dimensions: ${Array.isArray(sample.embedding) ? '1536 (expected)' : 'unknown format'}`);
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run the script
if (require.main === module) {
  checkVectorSearchSetup().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { checkVectorSearchSetup };