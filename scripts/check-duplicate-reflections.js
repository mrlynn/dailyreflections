/**
 * Check for duplicate reflection dates
 */
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Missing MONGODB_URI environment variable');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(process.env.MONGODB_DB || 'dailyreflections');
    const reflectionsCollection = db.collection('reflections');

    // Get all reflections
    const reflections = await reflectionsCollection.find({}).toArray();
    console.log(`Found ${reflections.length} total reflections`);

    // Check for duplicate dates
    const counts = {};
    reflections.forEach(r => {
      const key = `${r.month}-${r.day}`;
      counts[key] = (counts[key] || 0) + 1;
    });

    // Find duplicates
    const duplicates = Object.entries(counts).filter(([key, count]) => count > 1);
    console.log('Duplicate dates:', duplicates);
    console.log(`Total duplicate dates: ${duplicates.length}`);

    // Show details of first duplicate if exists
    if (duplicates.length > 0) {
      const firstDuplicate = duplicates[0][0];
      const [month, day] = firstDuplicate.split('-').map(Number);
      const dups = await reflectionsCollection.find({ month, day }).toArray();

      console.log(`\nDetails for duplicates on ${firstDuplicate}:`);
      dups.forEach((d, i) => {
        console.log(`\n--- Duplicate ${i + 1} ---`);
        console.log(`ID: ${d._id}`);
        console.log(`Title: ${d.title}`);
        console.log(`Month: ${d.month}, Day: ${d.day}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

main().catch(console.error);