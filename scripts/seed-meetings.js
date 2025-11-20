/**
 * Seed script for AA meetings in Meeting Guide format
 *
 * This script populates the database with sample meeting data
 * that follows the Meeting Guide JSON spec.
 *
 * Run with: node scripts/seed-meetings.js
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

// Sample meeting data that follows Meeting Guide JSON spec
const sampleMeetings = [
  {
    name: "Sunrise Semester",
    slug: "sunrise-semester-sunday",
    day: 0, // Sunday
    time: "8:00",
    end_time: "9:00",
    location: "Online",
    types: ["O", "D"],
    group: "Sunrise Semester",
    conference_url: "https://us02web.zoom.us/j/901964988?pwd=QkhEY1FFOUF2b1AzMmRwZ0VtejdVQT09",
    conference_phone: "+13126266799,,901964988#,,1#,417417#",
    notes: "Open Discussion meeting. Beginners are welcome.",
    updated: new Date().toISOString().replace('T', ' ').split('.')[0]
  },
  {
    name: "Sunrise Semester",
    slug: "sunrise-semester-monday",
    day: 1, // Monday
    time: "7:15",
    end_time: "8:15",
    location: "Online",
    types: ["O", "D", "BB"],
    group: "Sunrise Semester",
    conference_url: "https://us02web.zoom.us/j/901964988?pwd=QkhEY1FFOUF2b1AzMmRwZ0VtejdVQT09",
    conference_phone: "+13126266799,,901964988#,,1#,417417#",
    notes: "Open Discussion meeting. Beginners are welcome.",
    updated: new Date().toISOString().replace('T', ' ').split('.')[0]
  },
  {
    name: "Sunrise Semester",
    slug: "sunrise-semester-tuesday",
    day: 2, // Monday
    time: "7:15",
    end_time: "8:15",
    location: "Online",
    types: ["O", "D", "BE"],
    group: "Sunrise Semester",
    conference_url: "https://us02web.zoom.us/j/901964988?pwd=QkhEY1FFOUF2b1AzMmRwZ0VtejdVQT09",
    conference_phone: "+13126266799,,901964988#,,1#,417417#",
    notes: "Open Discussion meeting. Beginners are welcome.",
    updated: new Date().toISOString().replace('T', ' ').split('.')[0]
  },
  {
    name: "Sunrise Semester",
    slug: "sunrise-semester-wednesday",
    day: 3, // Wednesday
    time: "7:15",
    end_time: "8:15",
    location: "Online",
    types: ["O", "D", "SP"],
    group: "Sunrise Semester",
    conference_url: "https://us02web.zoom.us/j/901964988?pwd=QkhEY1FFOUF2b1AzMmRwZ0VtejdVQT09",
    conference_phone: "+13126266799,,901964988#,,1#,417417#",
    notes: "Open Discussion meeting. Beginners are welcome.",
    updated: new Date().toISOString().replace('T', ' ').split('.')[0]
  },
  {
    name: "Sunrise Semester",
    slug: "sunrise-semester-thursday",
    day: 4, // Thursday
    time: "7:15",
    end_time: "8:15",
    location: "Online",
    types: ["O", "D", "BE"],
    group: "Sunrise Semester",
    conference_url: "https://us02web.zoom.us/j/901964988?pwd=QkhEY1FFOUF2b1AzMmRwZ0VtejdVQT09",
    conference_phone: "+13126266799,,901964988#,,1#,417417#",
    notes: "Open Discussion meeting. Beginners are welcome.",
    updated: new Date().toISOString().replace('T', ' ').split('.')[0]
  },
  {
    name: "Sunrise Semester",
    slug: "sunrise-semester-friday",
    day: 5, // Friday
    time: "7:15",
    end_time: "8:15",
    location: "Online",
    types: ["O", "D", "ONL"],
    group: "Sunrise Semester",
    conference_url: "https://us02web.zoom.us/j/901964988?pwd=QkhEY1FFOUF2b1AzMmRwZ0VtejdVQT09",
    conference_phone: "+13126266799,,901964988#,,1#,417417#",
    notes: "Open Discussion meeting. Beginners are welcome.",
    updated: new Date().toISOString().replace('T', ' ').split('.')[0]
  },
  {
    name: "Sunrise Semester",
    slug: "sunrise-semester-saturday-men",
    day: 6, // Saturday
    time: "8:00",
    end_time: "9:15",
    location: "Online",
    types: ["O", "D", "BE", "MEN"],
    group: "Sunrise Semester",
    conference_url: "https://us02web.zoom.us/j/901964988?pwd=QkhEY1FFOUF2b1AzMmRwZ0VtejdVQT09",
    conference_phone: "+13126266799,,901964988#,,1#,417417#",
    notes: "Open Discussion meeting. Beginners are welcome.",
    updated: new Date().toISOString().replace('T', ' ').split('.')[0]
  }
];

/**
 * Seed the meetings collection with sample data
 */
async function seedMeetings() {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://your-cluster.mongodb.net/dailyreflections';
  const client = new MongoClient(uri);

  try {
    console.log('Connecting to database...');
    await client.connect();
    const db = client.db();

    // Collection name
    const COLLECTION_NAME = 'meetings';

    // Create collection if it doesn't exist
    try {
      await db.createCollection(COLLECTION_NAME);
      console.log('Meetings collection created');
    } catch (err) {
      // Collection might already exist, which is fine
      console.log('Using existing meetings collection');
    }

    const collection = db.collection(COLLECTION_NAME);

    // Create indexes
    console.log('Creating indexes...');

    // Create unique index on slug
    await collection.createIndex({ slug: 1 }, { unique: true });

    // Create index on day for quick lookup by day of week
    await collection.createIndex({ day: 1 });

    // Create index on location fields for geographic queries
    await collection.createIndex({ city: 1, state: 1 });

    // Create geospatial index
    await collection.createIndex({
      latitude: 1,
      longitude: 1
    }, { sparse: true });

    // Create text index for search
    await collection.createIndex({
      name: 'text',
      location: 'text',
      group: 'text',
      notes: 'text',
      formatted_address: 'text'
    });

    console.log('Checking for existing meetings...');
    const existingCount = await collection.countDocuments();
    console.log(`Found ${existingCount} existing meetings`);

    // Only seed if collection is empty
    if (existingCount === 0) {
      console.log('Seeding meetings collection...');

      // Set timestamps and prepare data
      const now = new Date();
      const formattedNow = now.toISOString().replace('T', ' ').split('.')[0];

      for (const meetingData of sampleMeetings) {
        // Add timestamps
        meetingData.created_at = now;
        meetingData.updated_at = now;
        meetingData.updated = formattedNow;

        // Set active status
        meetingData.active = meetingData.active !== false;

        // Insert the meeting
        await collection.insertOne(meetingData);
        console.log(`Created meeting: ${meetingData.name}`);
      }

      console.log(`Successfully seeded ${sampleMeetings.length} meetings`);
    } else {
      console.log('Meetings collection already contains data, skipping seed');
    }

    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding meetings:', error);
    process.exit(1);
  }
}

// Run the seed function
seedMeetings();