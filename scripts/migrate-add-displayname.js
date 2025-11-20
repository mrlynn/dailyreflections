/**
 * Migration script to add displayName field to existing users
 * This sets displayName to the current name for all users who don't have it set
 */

require('dotenv').config({ path: '.env.local' });
const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ Error: MONGODB_URI not found in .env.local');
  process.exit(1);
}

async function migrateDisplayName() {
  const client = new MongoClient(uri);

  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    const db = client.db('dailyreflections');

    console.log('📊 Checking users without displayName...');
    
    // Find all users without displayName
    const usersWithoutDisplayName = await db.collection('users').find({
      displayName: { $exists: false },
      name: { $exists: true }
    }).toArray();

    if (usersWithoutDisplayName.length === 0) {
      console.log('✅ All users already have displayName set.');
      await client.close();
      process.exit(0);
    }

    console.log(`📝 Found ${usersWithoutDisplayName.length} users without displayName. Updating...`);

    // Update each user to set displayName = name
    let updated = 0;
    for (const user of usersWithoutDisplayName) {
      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { displayName: user.name } }
      );
      updated++;
    }

    console.log(`✅ Successfully updated ${updated} users with displayName.`);
    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await client.close();
    process.exit(1);
  }
}

migrateDisplayName();

