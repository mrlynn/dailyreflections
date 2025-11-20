/**
 * Script to make a user an admin
 * Run with: node scripts/make-admin.js email@example.com
 */

// Load environment variables
require('dotenv').config();

const { MongoClient } = require('mongodb');

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('Please provide an email address as an argument');
  console.error('Usage: node scripts/make-admin.js email@example.com');
  process.exit(1);
}

// MongoDB connection string
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI environment variable not set');
  process.exit(1);
}

async function makeAdmin() {
  // Connect to MongoDB
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('dailyreflections');
    const usersCollection = db.collection('users');

    // Find the user
    const user = await usersCollection.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }

    console.log(`User found: ${user.name || user.email}`);

    // Update the user to be an admin
    const result = await usersCollection.updateOne(
      { email: email.toLowerCase() },
      { $set: { isAdmin: true } }
    );

    if (result.modifiedCount === 1) {
      console.log(`✅ ${email} is now an admin`);
    } else if (result.matchedCount === 1 && result.modifiedCount === 0) {
      console.log(`User ${email} is already an admin`);
    } else {
      console.error('Failed to update user');
    }
  } catch (error) {
    console.error('Error making user admin:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

makeAdmin().catch(console.error);