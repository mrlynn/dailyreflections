// scripts/seed-step8.js

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'dailyreflections';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

async function setupStep8Collection() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(MONGODB_DB);

    // Check if collection exists
    const collections = await db.listCollections({ name: 'step8inventories' }).toArray();

    if (collections.length > 0) {
      console.log('Step 8 collection already exists');
    } else {
      // Create the collection
      await db.createCollection('step8inventories');
      console.log('Created step8inventories collection');

      // Create indexes
      await db.collection('step8inventories').createIndex({ userId: 1 });
      console.log('Created index on userId');

      await db.collection('step8inventories').createIndex({
        userId: 1,
        status: 1
      });
      console.log('Created compound index on userId and status');
    }

    console.log('Step 8 collection setup complete');
  } catch (error) {
    console.error('Error setting up Step 8 collection:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the setup function
setupStep8Collection()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error running setup:', err);
    process.exit(1);
  });