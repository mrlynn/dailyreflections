/**
 * Seed Script: First 30 Days Path Course
 *
 * This script seeds the initial course content for the "First 30 Days Path"
 * guided course system, using the exact content from the spec.
 *
 * Usage:
 *   node scripts/seed/seedFirstThirtyDaysCourse.js
 *
 * The script is idempotent - it will skip seeding if the course already exists.
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

async function seedCourse() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB');

    const db = client.db('dailyreflections');

    // ============================================================================
    // CHECK IF COURSE ALREADY EXISTS
    // ============================================================================

    const existingCourse = await db.collection(COLLECTION_NAMES.COURSES).findOne({ slug: 'first-30-days' });
    if (existingCourse) {
      console.log('⚠ Course "first-30-days" already exists. Skipping seed.');
      console.log('  To re-seed, first delete the existing course and its modules/lessons.');
      return;
    }

    // ============================================================================
    // CREATE COURSE
    // ============================================================================

    const now = new Date();
    const courseId = new ObjectId();

    const course = {
      _id: courseId,
      slug: 'first-30-days',
      title: 'first 30 days path',
      description: 'short, gentle steps to help you through your first month sober.',
      isActive: true,
      order: 1,
      modules: [], // Will populate after creating modules
      createdAt: now,
      updatedAt: now,
    };

    // ============================================================================
    // CREATE MODULE: "you're safe here"
    // ============================================================================

    const moduleId = new ObjectId();

    const module = {
      _id: moduleId,
      courseId: courseId,
      slug: 'youre-safe-here',
      title: "you're safe here",
      description: 'short, simple steps for your first days.',
      order: 1,
      minSobrietyDays: 0,
      maxSobrietyDays: 7,
      gatingRules: {
        requireMeetingsAttended: 0,
        requireCompletedLessonIds: [],
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

    // Lesson 1: welcome
    const lesson1 = {
      _id: lesson1Id,
      courseId: courseId,
      moduleId: moduleId,
      slug: 'welcome',
      title: 'welcome',
      subtitle: "you're not alone anymore.",
      order: 1,
      approximateDurationMinutes: 3,
      blocks: [
        {
          type: 'hero',
          props: {
            heading: "we're glad you're here.",
            body: "whatever brought you here, this space is for you. many of us arrived scared, confused, or not sure if we belonged.",
            mascotVariant: 'lantern-soft',
            imagePath: '/images/orientation/lesson1.jpg',
          },
        },
        {
          type: 'text',
          props: {
            body: "you don't have to figure everything out today. this path is made of small, simple steps you can take at your own pace. you can stop any time. you can come back any time.",
          },
        },
        {
          type: 'checkin',
          props: {
            question: 'how are you feeling right now?',
            scale: ['overwhelmed', 'scared', 'numb', 'hopeful'],
          },
        },
        {
          type: 'text',
          props: {
            body: "there are no right answers here. this isn't a test. it's just a way to notice where you are, one moment at a time.",
          },
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    // Lesson 2: what this path is (and isn't)
    const lesson2 = {
      _id: lesson2Id,
      courseId: courseId,
      moduleId: moduleId,
      slug: 'what-this-is',
      title: "what this path is (and isn't)",
      subtitle: 'a companion, not a commander.',
      order: 2,
      approximateDurationMinutes: 4,
      blocks: [
        {
          type: 'hero',
          props: {
            heading: 'this is a companion, not a set of rules.',
            body: "we'll show you patterns that helped many of us. you decide what to do with them.",
            mascotVariant: 'path',
            imagePath: '/images/orientation/lesson2.jpg',
          },
        },
        {
          type: 'text',
          props: {
            body: "this path doesn't replace meetings, sponsors, or the big book. it's here to help you find and use those things more easily.",
          },
        },
        {
          type: 'quote',
          props: {
            source: 'aa member',
            body: '"when i was new, i couldn\'t absorb much at once. i just needed to know i wasn\'t crazy and i wasn\'t alone."',
          },
        },
        {
          type: 'text',
          props: {
            body: "you can move forward, pause, or come back later. there's no 'behind' here. just the next right step when you're ready.",
          },
        },
        {
          type: 'divider',
          props: {},
        },
        {
          type: 'cta-feature-intro',
          props: {
            featureKey: 'daily-reflection',
            title: "see today's reflection",
            description: 'many of us like to start the day with a short reading. this feature shows you a fresh reflection each day.',
            buttonLabel: 'open daily reflection',
          },
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    // Lesson 3: your first concrete step
    const lesson3 = {
      _id: lesson3Id,
      courseId: courseId,
      moduleId: moduleId,
      slug: 'first-step',
      title: 'your first concrete step',
      subtitle: "finding a meeting — if and when you're ready.",
      order: 3,
      approximateDurationMinutes: 4,
      blocks: [
        {
          type: 'hero',
          props: {
            heading: 'most of us started by finding a meeting.',
            body: 'for a lot of us, just sitting in a meeting and listening was enough at first.',
            mascotVariant: 'lantern-soft',
            imagePath: '/images/orientation/lesson3.jpg',
          },
        },
        {
          type: 'text',
          props: {
            body: "This step is about attending a meeting.  It's important to note that you don't have to talk. you don't have to share. you can just show up, sit down, and listen. that alone has helped countless alcoholics.",
          },
        },
        {
          type: 'cta-feature-intro',
          props: {
            featureKey: 'meeting-finder',
            title: 'find a meeting near you',
            description: 'this tool can help you find an aa meeting online or nearby. many of us use it daily.',
            buttonLabel: 'open meeting finder',
          },
        },
        {
          type: 'divider',
          props: {},
        },
        {
          type: 'journal-prompt',
          props: {
            title: 'if you want, write a line or two',
            prompt: "what's one small thing you're willing to try in the next 24 hours? it could be as simple as 'i'll read a page' or 'i'll look at meetings.'",
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
    module.lessonIds = [lesson1Id, lesson2Id, lesson3Id];

    // Update course with module reference
    course.modules = [{ moduleId: moduleId, order: 1 }];

    // ============================================================================
    // INSERT INTO DATABASE
    // ============================================================================

    await db.collection(COLLECTION_NAMES.COURSES).insertOne(course);
    console.log('✓ Created course: first-30-days');

    await db.collection(COLLECTION_NAMES.MODULES).insertOne(module);
    console.log('✓ Created module: youre-safe-here');

    await db.collection(COLLECTION_NAMES.LESSONS).insertMany([lesson1, lesson2, lesson3]);
    console.log('✓ Created 3 lessons: welcome, what-this-is, first-step');

    // ============================================================================
    // ENSURE INDEXES
    // ============================================================================

    await db.collection(COLLECTION_NAMES.COURSES).createIndexes([
      { key: { slug: 1 }, unique: true, name: 'slug_unique' },
      { key: { isActive: 1, order: 1 }, name: 'active_order' },
    ]);

    await db.collection(COLLECTION_NAMES.MODULES).createIndexes([
      { key: { courseId: 1, order: 1 }, name: 'course_order' },
      { key: { slug: 1, courseId: 1 }, unique: true, name: 'slug_course_unique' },
    ]);

    await db.collection(COLLECTION_NAMES.LESSONS).createIndexes([
      { key: { courseId: 1, moduleId: 1, order: 1 }, name: 'course_module_order' },
      { key: { courseId: 1, slug: 1 }, unique: true, name: 'slug_course_unique' },
    ]);

    console.log('✓ Ensured indexes');

    // ============================================================================
    // SUMMARY
    // ============================================================================

    console.log('\n✅ Seed complete!');
    console.log('\nSummary:');
    console.log(`  Course: ${course.title} (slug: ${course.slug})`);
    console.log(`  Module: ${module.title} (slug: ${module.slug})`);
    console.log(`  Lessons:`);
    console.log(`    1. ${lesson1.title} (slug: ${lesson1.slug})`);
    console.log(`    2. ${lesson2.title} (slug: ${lesson2.slug})`);
    console.log(`    3. ${lesson3.title} (slug: ${lesson3.slug})`);
    console.log('\nNext steps:');
    console.log('  - Visit /course to see the course listing');
    console.log(`  - Visit /course/${course.slug} to see the course overview`);
    console.log(`  - Visit /course/${course.slug}/learn/${module.slug}/${lesson1.slug} to start the first lesson`);

  } catch (error) {
    console.error('❌ Error seeding course:', error);
    throw error;
  } finally {
    await client.close();
    console.log('\n✓ Database connection closed');
  }
}

// Run the seed function
seedCourse().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
