/**
 * Script to update author avatar for blog articles
 * Run with: node scripts/update-author-avatar.js [article-slug]
 * If no slug provided, updates all articles by Michael Lynn
 */

import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB || 'dailyreflections';
const authorAvatarUrl = '/mike-avatar-circle.png'; // Path to your avatar image

if (!uri) {
  console.error('❌ MONGODB_URI is not defined. Please set it in .env.local');
  process.exit(1);
}

async function updateAuthorAvatar(articleSlug = null) {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('🔌 Connected to MongoDB');
    
    const db = client.db(databaseName);
    const collection = db.collection('resources');

    // Build filter
    const filter = {
      resourceType: 'article',
      'metadata.isBlog': true,
      'metadata.authorName': 'Michael Lynn',
    };

    // If specific slug provided, filter by that
    if (articleSlug) {
      filter.slug = articleSlug;
    }

    // Update the articles
    const result = await collection.updateMany(
      filter,
      {
        $set: {
          'metadata.authorAvatar': authorAvatarUrl,
          updatedAt: new Date(),
        }
      }
    );

    console.log(`✅ Successfully updated ${result.modifiedCount} article(s)`);
    console.log(`   Avatar URL: ${authorAvatarUrl}`);
    
    if (articleSlug) {
      console.log(`   Article slug: ${articleSlug}`);
    } else {
      console.log(`   Updated all articles by Michael Lynn`);
    }

  } catch (error) {
    console.error('❌ Error updating author avatar:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Get article slug from command line args if provided
const articleSlug = process.argv[2] || null;

updateAuthorAvatar(articleSlug);

