/**
 * Script to create rate limiting indexes in MongoDB
 * Run with: node scripts/setup-rate-limit-indexes.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ Error: MONGODB_URI not found in .env.local');
  process.exit(1);
}

async function setupIndexes() {
  const client = new MongoClient(uri);

  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    const db = client.db('dailyreflections');

    console.log('📊 Creating rate limit indexes...');

    // Create unique index on IP address (for anonymous users)
    await db.collection('rateLimits').createIndex(
      { ipAddress: 1 },
      { unique: true, sparse: true, name: 'ipAddress_unique' }
    );
    console.log('✅ Created ipAddress_unique index (sparse)');

    // Create unique index on userId (for authenticated users)
    await db.collection('rateLimits').createIndex(
      { userId: 1 },
      { unique: true, sparse: true, name: 'userId_unique' }
    );
    console.log('✅ Created userId_unique index (sparse)');

    // Create index on windowStart for TTL (expires after 2 hours)
    // Note: MongoDB TTL indexes work with Date fields, not timestamps
    await db.collection('rateLimits').createIndex(
      { windowStart: 1 },
      { 
        name: 'windowStart_index',
        expireAfterSeconds: 7200 // 2 hours (longer than our 1 hour window)
      }
    );
    console.log('✅ Created windowStart_index with TTL');

    console.log('\n✅ Rate limit indexes setup complete!');
    console.log('\nThe rateLimits collection will automatically clean up old entries.');

    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    await client.close();
    process.exit(1);
  }
}

setupIndexes();

