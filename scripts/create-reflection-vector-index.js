/**
 * Script to create a reflection vector search index in MongoDB Atlas
 *
 * This creates the vector search index needed for semantic search using embeddings
 * on the daily reflections.
 *
 * Run with: node scripts/create-reflection-vector-index.js
 *
 * Note: This script provides the index definition. You'll need to create it in MongoDB Atlas UI
 * or use the MongoDB Atlas Search API if available.
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI || 'mongodb+srv://your-cluster.mongodb.net/dailyreflections';
const dbName = process.env.MONGODB_DB || 'dailyreflections';

const indexDefinition = {
  name: 'reflections_vector_index', // Updated to match the actual index name in MongoDB Atlas
  definition: {
    mappings: {
      dynamic: true,
      fields: {
        embedding: {
          type: 'knnVector',
          dimensions: 1536, // OpenAI embedding dimensions
          similarity: 'cosine',
        },
        // Add additional fields to include in search results
        title: {
          type: 'string'
        },
        quote: {
          type: 'string'
        },
        comment: {
          type: 'string'
        },
        reference: {
          type: 'string'
        },
        month: {
          type: 'number'
        },
        day: {
          type: 'number'
        }
      },
    },
  },
};

async function createVectorIndex() {
  try {
    console.log('📋 Creating Vector Search Index');
    console.log('='.repeat(60));

    // Connect to MongoDB Atlas cluster
    const client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    // Get database and collection
    const db = client.db(dbName);
    const collection = db.collection('reflections');

    // Check if vectors exist
    const sampleDoc = await collection.findOne({ embedding: { $exists: true } });
    if (!sampleDoc) {
      console.error('❌ No documents with embeddings found. Generate embeddings first.');
      await client.close();
      return;
    }

    console.log('📊 Sample embedding dimensions:', sampleDoc.embedding.length);

    // Command to create search index via API
    const command = {
      createSearchIndexes: collection.collectionName,
      indexes: [indexDefinition.definition]
    };

    // Just display the command - MongoDB Atlas UI is recommended for creating indexes
    console.log('\n📋 Command to create index via API:');
    console.log(JSON.stringify(command, null, 2));

    console.log('\n📋 Vector Search Index Definition');
    console.log('='.repeat(60));
    console.log('\nUse this configuration in MongoDB Atlas:\n');
    console.log(JSON.stringify(indexDefinition, null, 2));

    console.log('\n' + '='.repeat(60));
    console.log('📝 Instructions:');
    console.log('='.repeat(60));
    console.log('\n1. Go to MongoDB Atlas → Your Cluster → Search → Create Search Index');
    console.log('2. Select "JSON Editor"');
    console.log('3. Paste the JSON above');
    console.log('4. Click "Next" → "Create Search Index"');
    console.log('\nOr use MongoDB Compass / mongosh to create via API.');
    console.log('\n⚠️  Note: Vector search indexes can take several minutes to build.');

    await client.close();
    console.log('\n✅ MongoDB connection closed');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the function if script is executed directly
if (require.main === module) {
  createVectorIndex();
}

module.exports = {
  indexDefinition,
  createVectorIndex
};