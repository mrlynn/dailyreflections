/**
 * Script to create a vector search index in MongoDB Atlas
 * 
 * This creates the vector search index needed for semantic search using embeddings.
 * 
 * Run with: node scripts/create-vector-index.js
 * 
 * Note: This script provides the index definition. You'll need to create it in MongoDB Atlas UI
 * or use the MongoDB Atlas Search API if available.
 */

const indexDefinition = {
  name: 'vector_index',
  definition: {
    mappings: {
      dynamic: true,
      fields: {
        embedding: {
          type: 'knnVector',
          dimensions: 1536, // OpenAI text-embedding-3-small dimensions
          similarity: 'cosine',
        },
      },
    },
  },
};

console.log('📋 Vector Search Index Definition');
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

module.exports = { indexDefinition };

