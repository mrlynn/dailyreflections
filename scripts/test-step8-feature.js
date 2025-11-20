// scripts/test-step8-feature.js

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'dailyreflections';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

async function testStep8Feature() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(MONGODB_DB);

    // Check if collection exists
    const collections = await db.listCollections({ name: 'step8inventories' }).toArray();

    if (collections.length === 0) {
      console.error('❌ step8inventories collection does not exist');
      console.log('Please run npm run seed-step8 first');
      process.exit(1);
    }

    console.log('✅ step8inventories collection exists');

    // Check indexes
    const indexes = await db.collection('step8inventories').indexes();

    console.log('Checking indexes...');
    const hasUserIdIndex = indexes.some(index => index.key && index.key.userId === 1);
    const hasCompoundIndex = indexes.some(
      index => index.key && index.key.userId === 1 && index.key.status === 1
    );

    if (hasUserIdIndex) {
      console.log('✅ userId index exists');
    } else {
      console.error('❌ userId index is missing');
    }

    if (hasCompoundIndex) {
      console.log('✅ compound index exists');
    } else {
      console.error('❌ compound index is missing');
    }

    // Check navigation in navConfig.js
    console.log('\nVerifying navigation configuration...');
    try {
      // Read the file content
      const navConfigPath = path.join(path.resolve(__dirname, '..'), 'src', 'components', 'Navigation', 'navConfig.js');

      const navConfigContent = fs.readFileSync(navConfigPath, 'utf8');

      // Check if Step 8 is included in the navigation
      if (navConfigContent.includes('8th Step Amends List')) {
        console.log('✅ 8th Step Amends List is included in navigation');
      } else {
        console.error('❌ 8th Step Amends List is not found in navigation');
      }
    } catch (err) {
      console.error('Error checking navigation:', err);
    }

    // Check API endpoints
    console.log('\nVerifying API endpoints...');
    const apiDir = path.join(path.resolve(__dirname, '..'), 'src', 'app', 'api', 'step8');

    if (fs.existsSync(apiDir)) {
      console.log('✅ step8 API directory exists');

      // Check main route handler
      if (fs.existsSync(path.join(apiDir, 'route.js'))) {
        console.log('✅ Main route handler exists');
      } else {
        console.error('❌ Main route handler is missing');
      }

      // Check stats endpoint
      if (fs.existsSync(path.join(apiDir, 'stats', 'route.js'))) {
        console.log('✅ Stats endpoint exists');
      } else {
        console.error('❌ Stats endpoint is missing');
      }

      // Check entries endpoints
      if (fs.existsSync(path.join(apiDir, 'entries', 'route.js'))) {
        console.log('✅ Entries endpoint exists');
      } else {
        console.error('❌ Entries endpoint is missing');
      }

      // Check individual entry endpoint
      if (fs.existsSync(path.join(apiDir, 'entries', '[entryId]', 'route.js'))) {
        console.log('✅ Individual entry endpoint exists');
      } else {
        console.error('❌ Individual entry endpoint is missing');
      }
    } else {
      console.error('❌ step8 API directory does not exist');
    }

    console.log('\nVerifying page components...');
    const pageDir = path.join(path.resolve(__dirname, '..'), 'src', 'app', 'step8');

    if (fs.existsSync(pageDir)) {
      console.log('✅ step8 page directory exists');

      // Check main page
      if (fs.existsSync(path.join(pageDir, 'page.js'))) {
        console.log('✅ Main page exists');
      } else {
        console.error('❌ Main page is missing');
      }

      // Check layout
      if (fs.existsSync(path.join(pageDir, 'layout.js'))) {
        console.log('✅ Layout file exists');
      } else {
        console.error('❌ Layout file is missing');
      }
    } else {
      console.error('❌ step8 page directory does not exist');
    }

    console.log('\n8th Step feature verification complete!');

  } catch (error) {
    console.error('Error testing Step 8 feature:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test function
testStep8Feature()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.error('Error running verification:', err);
    process.exit(1);
  });