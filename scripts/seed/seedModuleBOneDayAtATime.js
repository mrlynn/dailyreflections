/**
 * Seed Script: Module B - "one day at a time"
 *
 * This script adds Module B to the existing "First 30 Days Path" course.
 *
 * Usage:
 *   node scripts/seed/seedModuleBOneDayAtATime.js
 *
 * The script is idempotent - it will skip seeding if the module already exists.
 */

import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env.local') });

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('Please add your Mongo URI to .env.local');
}

const COLLECTION_NAMES = {
  COURSES: 'courses',
  MODULES: 'modules',
  LESSONS: 'lessons',
};

async function seedModuleB() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB');

    const db = client.db('dailyreflections');

    // ============================================================================
    // CHECK IF COURSE EXISTS
    // ============================================================================

    const course = await db.collection(COLLECTION_NAMES.COURSES).findOne({ slug: 'first-30-days' });
    if (!course) {
      console.log('❌ Course "first-30-days" not found. Please run the main course seed script first.');
      return;
    }

    console.log('✓ Found course: first-30-days');

    // ============================================================================
    // CHECK IF MODULE B ALREADY EXISTS
    // ============================================================================

    const existingModule = await db.collection(COLLECTION_NAMES.MODULES).findOne({
      courseId: course._id,
      slug: 'one-day-at-a-time'
    });

    if (existingModule) {
      console.log('⚠ Module "one-day-at-a-time" already exists. Skipping seed.');
      console.log('  To re-seed, first delete the existing module and its lessons.');
      return;
    }

    // ============================================================================
    // GET MODULE A FOR GATING REQUIREMENTS
    // ============================================================================

    const moduleA = await db.collection(COLLECTION_NAMES.MODULES).findOne({
      courseId: course._id,
      slug: 'youre-safe-here'
    });

    if (!moduleA) {
      console.log('❌ Module A not found. Module B requires Module A to exist for gating.');
      return;
    }

    // Get Module A's lessons for gating requirement
    const moduleALessons = await db.collection(COLLECTION_NAMES.LESSONS)
      .find({ moduleId: moduleA._id })
      .toArray();

    const moduleALessonIds = moduleALessons.map(l => l._id);

    console.log('✓ Found Module A with', moduleALessonIds.length, 'lessons');

    // ============================================================================
    // CREATE MODULE B
    // ============================================================================

    const now = new Date();
    const moduleBId = new ObjectId();

    const moduleB = {
      _id: moduleBId,
      courseId: course._id,
      slug: 'one-day-at-a-time',
      title: 'one day at a time',
      description: 'building daily practices and embracing the 24-hour concept.',
      order: 2,
      minSobrietyDays: 3,
      maxSobrietyDays: null,
      gatingRules: {
        requireMeetingsAttended: 1,
        requireCompletedLessonIds: moduleALessonIds, // Must complete Module A
      },
      lessonIds: [], // Will populate after creating lessons
      createdAt: now,
      updatedAt: now,
    };

    // ============================================================================
    // CREATE LESSONS
    // ============================================================================

    const lesson1Id = new ObjectId();
    const lesson2Id = new ObjectId();
    const lesson3Id = new ObjectId();
    const lesson4Id = new ObjectId();

    // Lesson 1: just today
    const lesson1 = {
      _id: lesson1Id,
      courseId: course._id,
      moduleId: moduleBId,
      slug: 'just-today',
      title: 'just today',
      subtitle: "you don't have to do this forever.",
      order: 1,
      approximateDurationMinutes: 4,
      blocks: [
        {
          type: 'hero',
          props: {
            heading: "you don't have to do this forever.",
            body: "for many of us, 'forever' felt impossible. but today? today we can do.",
            mascotVariant: 'lantern-soft',
            imagePath: '/images/one-day/lesson1.jpg',
          },
        },
        {
          type: 'text',
          props: {
            body: "when people said 'one day at a time,' i thought it was a cliché. but when i tried to think about staying sober forever, i froze. so i stopped thinking about forever.",
          },
        },
        {
          type: 'text',
          props: {
            body: "today is all you have. not tomorrow, not next week, not next year. just the 24 hours in front of you. and most of us have found we can do almost anything for 24 hours.",
          },
        },
        {
          type: 'quote',
          props: {
            source: 'big book, page 85',
            body: 'we are not cured of alcoholism. what we really have is a daily reprieve contingent on the maintenance of our spiritual condition.',
          },
        },
        {
          type: 'text',
          props: {
            body: "this doesn't mean you'll never think about drinking. it means when you do, you can say: 'not today. i don't have to drink today.'",
          },
        },
        {
          type: 'checkin',
          props: {
            question: 'when you think about staying sober, which feels more manageable?',
            scale: ['forever (it\'s fine)', 'one year', 'one month', 'just today'],
          },
        },
        {
          type: 'text',
          props: {
            body: "wherever you are is okay. this is about finding what works for you.",
          },
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    // Lesson 2: small rituals
    const lesson2 = {
      _id: lesson2Id,
      courseId: course._id,
      moduleId: moduleBId,
      slug: 'small-rituals',
      title: 'small rituals',
      subtitle: 'a lot of us needed rituals to replace the old ones.',
      order: 2,
      approximateDurationMinutes: 5,
      blocks: [
        {
          type: 'hero',
          props: {
            heading: 'a lot of us needed rituals to replace the old ones.',
            body: 'drinking had its rituals. early recovery needs them too.',
            mascotVariant: 'path',
            imagePath: '/images/one-day/lesson2.jpg',
          },
        },
        {
          type: 'text',
          props: {
            body: "for years, drinking was woven into my day. the 'after work drink.' the 'weekend ritual.' the 'stress relief.' when i stopped, there were these empty spaces.",
          },
        },
        {
          type: 'text',
          props: {
            body: "many of us found we needed new rituals—small, intentional actions that anchor the day. these aren't rules. they're just patterns that helped.",
          },
        },
        {
          type: 'text',
          props: {
            body: 'here are some rituals other people use:',
          },
        },
        {
          type: 'text',
          props: {
            body: '• reading a daily reflection each morning\n• calling another alcoholic\n• taking a walk before bed\n• 10 minutes of quiet in the morning\n• checking in with a sponsor\n• attending a regular home group meeting',
          },
        },
        {
          type: 'text',
          props: {
            body: "you don't need all of these. you don't need any of these. but you might need something—a small anchor that says 'i'm choosing this today.'",
          },
        },
        {
          type: 'divider',
          props: {},
        },
        {
          type: 'cta-feature-intro',
          props: {
            featureKey: 'sobriety-tracker',
            title: 'track your days',
            description: "many of us check our day count each morning. it's a small ritual that reminds us: we did it yesterday. we can do it today.",
            buttonLabel: 'open sobriety tracker',
          },
        },
        {
          type: 'journal-prompt',
          props: {
            title: 'if you want, reflect on this',
            prompt: "what's one small thing you could do each day that would help you feel grounded? it doesn't have to be aa-related. it just has to matter to you.",
            linkToJournalFeature: true,
          },
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    // Lesson 3: the middle of the day
    const lesson3 = {
      _id: lesson3Id,
      courseId: course._id,
      moduleId: moduleBId,
      slug: 'middle-of-the-day',
      title: 'the middle of the day',
      subtitle: "the hardest time isn't always the evening.",
      order: 3,
      approximateDurationMinutes: 4,
      blocks: [
        {
          type: 'hero',
          props: {
            heading: "the hardest time isn't always the evening.",
            body: "for a lot of us, it's 2pm on a tuesday when nothing's wrong but nothing's right either.",
            mascotVariant: 'lantern-soft',
            imagePath: '/images/one-day/lesson3.jpg',
          },
        },
        {
          type: 'text',
          props: {
            body: "everyone talks about avoiding 'drinking times'—happy hour, late night, weekends. and those are real. but what about the random wednesday afternoon when you're bored, restless, irritable, and discontent?",
          },
        },
        {
          type: 'text',
          props: {
            body: "that's not a trigger. that's just... being an alcoholic.",
          },
        },
        {
          type: 'quote',
          props: {
            source: 'aa member',
            body: "my sponsor told me: 'when you're restless, irritable, and discontent, you're in spiritual trouble. that's when we reach out.'",
          },
        },
        {
          type: 'text',
          props: {
            body: "this is what 'one day at a time' actually means in practice. when the day gets heavy, you don't have to power through alone. you can:",
          },
        },
        {
          type: 'text',
          props: {
            body: '• call someone in the program\n• go to a meeting (there are always meetings)\n• read something recovery-related\n• take a walk\n• pray (even if you\'re not sure you believe)\n• ask for help',
          },
        },
        {
          type: 'text',
          props: {
            body: "the key is interrupting the spiral before it becomes a crisis. most of us didn't drink because things went wrong. we drank because we didn't know what else to do with how we felt.",
          },
        },
        {
          type: 'divider',
          props: {},
        },
        {
          type: 'cta-feature-intro',
          props: {
            featureKey: 'meeting-finder',
            title: 'find a meeting right now',
            description: "if you're struggling today, there's probably a meeting happening soon—online or nearby. you don't have to wait.",
            buttonLabel: 'find a meeting',
          },
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    // Lesson 4: one day at a time doesn't mean one day alone
    const lesson4 = {
      _id: lesson4Id,
      courseId: course._id,
      moduleId: moduleBId,
      slug: 'not-alone',
      title: "one day at a time doesn't mean one day alone",
      subtitle: "you're not supposed to do this alone.",
      order: 4,
      approximateDurationMinutes: 5,
      blocks: [
        {
          type: 'hero',
          props: {
            heading: "you're not supposed to do this alone.",
            body: "one day at a time works because we're doing it together.",
            mascotVariant: 'path',
            imagePath: '/images/one-day/lesson4.jpg',
          },
        },
        {
          type: 'text',
          props: {
            body: "here's what i misunderstood at first: 'one day at a time' didn't mean 'handle each day by yourself.' it meant 'we'll help you get through today. and then tomorrow, we'll help you again.'",
          },
        },
        {
          type: 'text',
          props: {
            body: 'this program is built on connection. the steps are done with a sponsor. meetings are done with others. phone calls, coffee, service—it\'s all shared.',
          },
        },
        {
          type: 'quote',
          props: {
            source: 'big book, page 89',
            body: 'practical experience shows that nothing will so much insure immunity from drinking as intensive work with other alcoholics.',
          },
        },
        {
          type: 'text',
          props: {
            body: "this doesn't mean you need to be social all the time or make best friends immediately. it means:",
          },
        },
        {
          type: 'text',
          props: {
            body: "• going to meetings and listening\n• getting phone numbers (even if you don't call them yet)\n• saying 'i'm new' when you introduce yourself\n• staying for coffee after the meeting\n• eventually, calling someone when you're struggling",
          },
        },
        {
          type: 'text',
          props: {
            body: "a lot of us were terrified of this part. we thought we could do recovery 'our way'—alone, private, self-sufficient. but that's the same thinking that kept us drinking.",
          },
        },
        {
          type: 'checkin',
          props: {
            question: 'how do you feel about reaching out to other people in recovery?',
            scale: ['comfortable', 'willing to try', 'uncomfortable but i\'ll do it', 'terrified'],
          },
        },
        {
          type: 'text',
          props: {
            body: "wherever you are is okay. connection gets easier with time. and it's worth it.",
          },
        },
        {
          type: 'divider',
          props: {},
        },
        {
          type: 'journal-prompt',
          props: {
            title: 'a small step toward connection',
            prompt: 'what\'s one small thing you could do this week to connect with another person in recovery? (examples: introduce yourself at a meeting, get one phone number, stay for coffee, send a text to someone you met)',
            linkToJournalFeature: true,
          },
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    // ============================================================================
    // UPDATE REFERENCES
    // ============================================================================

    // Update module with lesson IDs
    moduleB.lessonIds = [lesson1Id, lesson2Id, lesson3Id, lesson4Id];

    // ============================================================================
    // INSERT INTO DATABASE
    // ============================================================================

    await db.collection(COLLECTION_NAMES.MODULES).insertOne(moduleB);
    console.log('✓ Created module: one-day-at-a-time');

    await db.collection(COLLECTION_NAMES.LESSONS).insertMany([lesson1, lesson2, lesson3, lesson4]);
    console.log('✓ Created 4 lessons: just-today, small-rituals, middle-of-the-day, not-alone');

    // Update course to include Module B reference
    await db.collection(COLLECTION_NAMES.COURSES).updateOne(
      { _id: course._id },
      {
        $push: {
          modules: {
            moduleId: moduleBId,
            order: 2,
          },
        },
        $set: {
          updatedAt: now,
        },
      }
    );
    console.log('✓ Updated course to include Module B');

    // ============================================================================
    // SUMMARY
    // ============================================================================

    console.log('\n✅ Module B seed complete!');
    console.log('\nSummary:');
    console.log(`  Module: ${moduleB.title} (slug: ${moduleB.slug})`);
    console.log(`  Gating: ${moduleB.minSobrietyDays}+ days sober, ${moduleB.gatingRules.requireMeetingsAttended}+ meetings, Module A complete`);
    console.log(`  Lessons:`);
    console.log(`    1. ${lesson1.title} (slug: ${lesson1.slug})`);
    console.log(`    2. ${lesson2.title} (slug: ${lesson2.slug})`);
    console.log(`    3. ${lesson3.title} (slug: ${lesson3.slug})`);
    console.log(`    4. ${lesson4.title} (slug: ${lesson4.slug})`);
    console.log('\nNext steps:');
    console.log('  - Create placeholder images for Module B lessons');
    console.log(`  - Visit /course/${course.slug} to see both modules`);
    console.log(`  - Complete Module A to unlock Module B`);

  } catch (error) {
    console.error('❌ Error seeding Module B:', error);
    throw error;
  } finally {
    await client.close();
    console.log('\n✓ Database connection closed');
  }
}

// Run the seed function
seedModuleB().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
