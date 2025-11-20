/**
 * Seed Journal Entries Script
 * Populates the database with sample 10th Step journal entries for development
 *
 * Usage: node scripts/seed-journal-entries.js <user_id>
 *
 * Note: You must provide a valid user ID as an argument when running this script
 */

import dotenv from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createJournalEntry, createJournalIndexes } from '../src/lib/models/journalEntry.js';
import { MongoClient, ObjectId } from 'mongodb';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check for user ID argument
if (process.argv.length < 3) {
  console.error('Error: You must provide a valid user ID as an argument');
  console.log('Usage: node scripts/seed-journal-entries.js <user_id>');
  process.exit(1);
}

const userId = process.argv[2];

// Helper function to generate a date X days ago
const daysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

// Helper function to generate random gratitude items
const generateGratitude = () => {
  const gratitudeOptions = [
    'My sobriety',
    'My health',
    'My family',
    'My sponsor',
    'My home group',
    'The tools of recovery',
    'The serenity prayer',
    'Being of service to others',
    'The opportunity to make amends',
    'Another day sober',
    'Financial stability',
    'Peace of mind',
    'My higher power',
    'Friends who support my recovery',
    'Literature that guides me',
    'The ability to be honest',
    'Learning from my mistakes',
    'Having a purpose',
    'Nature and its beauty',
    'The gift of clarity'
  ];

  // Pick 1-3 gratitude items
  const count = Math.floor(Math.random() * 3) + 1;
  const shuffled = [...gratitudeOptions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Helper function to generate character assets
const generateAssets = () => {
  const assetOptions = [
    'Honesty',
    'Hope',
    'Faith',
    'Courage',
    'Integrity',
    'Willingness',
    'Humility',
    'Brotherly love',
    'Justice',
    'Perseverance',
    'Spirituality',
    'Service',
    'Patience',
    'Open-mindedness',
    'Acceptance',
    'Gratitude',
    'Forgiveness',
    'Self-discipline',
    'Awareness',
    'Responsibility'
  ];

  // Pick 1-4 assets
  const count = Math.floor(Math.random() * 4) + 1;
  const shuffled = [...assetOptions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Helper function to generate tags
const generateTags = (mood) => {
  const tagOptions = [
    'work', 'family', 'sponsor', 'meeting', 'service', 'step-work',
    'meditation', 'prayer', 'amends', 'challenge', 'victory', 'struggle',
    'growth', 'self-care', 'relapse-prevention', 'triggers'
  ];

  // Add mood-based tags
  if (mood >= 4) {
    tagOptions.push('good-day', 'peaceful', 'grateful');
  } else if (mood <= 2) {
    tagOptions.push('difficult-day', 'struggling', 'need-support');
  }

  // Pick 0-3 tags
  const count = Math.floor(Math.random() * 4);
  if (count === 0) return [];

  const shuffled = [...tagOptions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Generate various entry types
const generateEntryContent = (dayIndex) => {
  // Determine mood based on pattern (some ups and downs)
  let baseMood = 3; // neutral

  // Create some patterns
  if (dayIndex % 7 === 0) {
    baseMood = 4; // weekly good day
  } else if (dayIndex % 11 === 0) {
    baseMood = 2; // occasional tough day
  }

  // Add some randomness (-1, 0, or +1)
  const moodVariation = Math.floor(Math.random() * 3) - 1;
  let mood = Math.max(1, Math.min(5, baseMood + moodVariation));

  // More detailed entries for certain days
  const isDetailedEntry = dayIndex % 3 === 0;
  const entryType = isDetailedEntry ? 'full' : (Math.random() > 0.3 ? 'quick' : 'check-in');

  // Generate entry
  const entry = {
    userId: userId,
    date: daysAgo(dayIndex),
    mood: mood,
    gratitude: generateGratitude(),
    entryType: entryType,
    tags: generateTags(mood),
    isPrivate: true,
    assets: generateAssets()
  };

  // For check-in entries, just basic info
  if (entryType === 'check-in') {
    entry.reflections = ['Just checking in for today', 'Quick daily check-in', 'Marking my sobriety today'][Math.floor(Math.random() * 3)];
    return entry;
  }

  // Generate inventory content based on mood
  const inventory = {};

  // Resentments
  if (mood <= 3) {
    inventory.resentments = [
      'Felt resentful toward a coworker who took credit for my work',
      'Resented family member for not understanding my recovery needs',
      'Felt resentment toward someone who cut me off in traffic',
      'Resented my boss for giving me too much work with unrealistic deadlines',
      'Felt resentful when my boundaries weren\'t respected'
    ][Math.floor(Math.random() * 5)];
  } else {
    inventory.resentments = 'No significant resentments today';
  }

  // Fears
  if (mood <= 4) {
    inventory.fears = [
      'Worried about upcoming performance review at work',
      'Fear of not being able to maintain my sobriety during upcoming family event',
      'Anxiety about financial situation',
      'Fear of rejection when sharing at meeting',
      'Worried about relationship with my children'
    ][Math.floor(Math.random() * 5)];
  } else {
    inventory.fears = 'No major fears today';
  }

  // Honesty
  inventory.honesty = [
    'Was completely honest in all my interactions today',
    'Caught myself starting to exaggerate a story but corrected myself',
    'Didn\'t fully disclose my feelings when asked how I was doing',
    'Need to be more honest with myself about my motivations',
    'Shared honestly at my meeting today'
  ][Math.floor(Math.random() * 5)];

  // Amends
  if (Math.random() > 0.6) {
    inventory.amends = [
      'Need to make amends to my partner for being short-tempered this morning',
      'Should apologize to coworker for interrupting them in meeting',
      'Need to make amends to myself for not practicing self-care',
      'Should reach out to friend I was supposed to call back',
      'No amends needed today that I'm aware of'
    ][Math.floor(Math.random() * 5)];
  } else {
    inventory.amends = 'No immediate amends needed today';
  }

  // Service
  inventory.service = [
    'Helped clean up after the meeting',
    'Called a newcomer to check in on them',
    'Made coffee for the morning meeting',
    'Shared my experience with someone who needed support',
    'Volunteered to lead next week\'s meeting',
    'Listened to a friend who needed to talk'
  ][Math.floor(Math.random() * 6)];

  // Prayer
  inventory.prayer = [
    'Said the serenity prayer when feeling stressed',
    'Meditated for 15 minutes this morning',
    'Practiced mindfulness throughout the day',
    'Read from daily reflections book',
    'Prayed for guidance before a difficult conversation',
    'Ended the day with gratitude prayer'
  ][Math.floor(Math.random() * 6)];

  // Additional 10th step inventory items
  if (isDetailedEntry) {
    inventory.selfishness = [
      'Noticed I was thinking only of my needs during a conversation',
      'Wanted recognition for work I did on a group project',
      'Was upset when plans changed because it inconvenienced me',
      'Didn\'t want to help with a task because I was tired',
      'Didn\'t notice any significant selfishness today'
    ][Math.floor(Math.random() * 5)];

    inventory.dishonesty = [
      'Exaggerated a story to make myself look better',
      'Didn\'t speak up when I disagreed with something to avoid conflict',
      'Made an excuse instead of telling the real reason I was late',
      'Pretended to understand something when I didn\'t',
      'Was honest in all my interactions today'
    ][Math.floor(Math.random() * 5)];

    inventory.self_seeking = [
      'Tried to control a situation so it would work out in my favor',
      'Wanted attention during a group conversation',
      'Spent too much time thinking about how others perceive me',
      'Made a decision based on what would benefit me most without considering others',
      'Didn\'t notice any self-seeking behavior today'
    ][Math.floor(Math.random() * 5)];

    inventory.fear = [
      'Fear of financial insecurity affected my decision making',
      'Worried what others might think of me at the meeting',
      'Fear of failure kept me from trying something new',
      'Afraid of being vulnerable with my sponsor',
      'Managed my fears well today through prayer and program principles'
    ][Math.floor(Math.random() * 5)];
  }

  entry.inventory = inventory;

  // General reflections
  if (mood >= 4) {
    entry.reflections = [
      'Today was a good day overall. I'm grateful for my sobriety and the tools of recovery.',
      'Felt connected to my higher power today. Program principles are working in my life.',
      'Made progress on step work today. Feeling positive about my recovery journey.',
      'Had some challenges but handled them using the tools I've learned in recovery.',
      'Grateful for another day sober. Taking things one day at a time is working.'
    ][Math.floor(Math.random() * 5)];
  } else if (mood >= 3) {
    entry.reflections = [
      'Average day with some ups and downs. Staying sober and working my program.',
      'Nothing particularly noteworthy today, but maintaining my daily practices.',
      'Felt a bit disconnected but used program tools to stay centered.',
      'Mixed feelings today but didn't let them affect my sobriety.',
      'Neutral day - neither great nor terrible. Grateful for stability.'
    ][Math.floor(Math.random() * 5)];
  } else {
    entry.reflections = [
      'Difficult day but I didn't drink/use. That's what matters most.',
      'Struggling with emotions today but reached out to my sponsor which helped.',
      'Had to rely heavily on program principles to get through today.',
      'Not my best day but I'm learning that feelings aren't facts.',
      'Today was challenging. Tomorrow is a new day and a fresh start.'
    ][Math.floor(Math.random() * 5)];
  }

  // Promises noticed
  if (Math.random() > 0.5) {
    entry.promises = [
      'Noticed the promise of freedom from regret about the past - accepting it as it was.',
      'Experienced the promise of knowing a new freedom and happiness today.',
      'Felt the promise of comprehending the word serenity during meditation.',
      'The promise that fear of people would leave me came true in a social situation today.',
      'Experienced the promise of intuitive knowledge of how to handle situations.',
      'Felt the promise of a new relationship with my Higher Power today.'
    ][Math.floor(Math.random() * 6)];
  }

  // Areas for improvement
  if (Math.random() > 0.3) {
    entry.improvements = [
      'Need to spend more time in prayer and meditation tomorrow.',
      'Will try to be more patient with difficult people.',
      'Plan to reach out to another person in recovery tomorrow.',
      'Want to practice more gratitude throughout the day.',
      'Will focus on being more present in conversations.',
      'Need to set better boundaries at work tomorrow.',
      'Will try to listen more and talk less at the meeting.'
    ][Math.floor(Math.random() * 7)];
  }

  return entry;
};

// Main function to seed journal entries
async function seedJournalEntries() {
  try {
    console.log('Starting journal entries seeding...');
    console.log(`Using user ID: ${userId}`);

    // Create journal indexes
    await createJournalIndexes();

    // Get MongoDB connection string from .env.local
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    // Connect to MongoDB
    const client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const collection = db.collection('journal_entries');

    // Check if entries already exist for this user
    const existingCount = await collection.countDocuments({ userId: userId });
    if (existingCount > 0) {
      console.log(`${existingCount} journal entries already exist for this user.`);
      const overwrite = process.argv.includes('--overwrite');
      if (!overwrite) {
        console.log('Use --overwrite flag to replace existing entries.');
        await client.close();
        return;
      }
      // Clear existing entries if overwrite flag is set
      await collection.deleteMany({ userId: userId });
      console.log('Existing journal entries deleted.');
    }

    // Generate entries for the past 30 days
    // Some days will be skipped to simulate irregular journaling habits
    const entries = [];
    const daysToGenerate = 30;
    let entriesCreated = 0;

    for (let i = 0; i < daysToGenerate; i++) {
      // Skip some days randomly (about 20% of days)
      if (Math.random() < 0.2 && i !== 0) { // Don't skip today
        continue;
      }

      const entry = generateEntryContent(i);
      await createJournalEntry(entry);
      entriesCreated++;

      // Log progress
      if (entriesCreated % 5 === 0) {
        console.log(`Created ${entriesCreated} entries...`);
      }
    }

    console.log(`Seeded ${entriesCreated} journal entries successfully!`);
    await client.close();
  } catch (error) {
    console.error('Error seeding journal entries:', error);
    process.exit(1);
  }
}

// Run the seed function
seedJournalEntries();