import { config as loadEnv } from 'dotenv';
import { MongoClient } from 'mongodb';

loadEnv({ path: '.env.local' });

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ Error: MONGODB_URI not found in .env.local');
  process.exit(1);
}

const forceSeed = process.argv.includes('--force');

const baseDate = new Date();

const toSlug = (value) =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const generalResources = [
  {
    title: 'AA Big Book Online',
    summary: 'The foundational text of Alcoholics Anonymous, available online for free reading.',
    link: 'https://www.aa.org/the-big-book',
    resourceType: 'resource',
    topics: ['core', 'big-book', 'official'],
    aaType: 'Literature',
  },
  {
    title: 'Twelve Steps and Twelve Traditions',
    summary: 'A detailed guide to the Twelve Steps and Twelve Traditions of AA.',
    link: 'https://www.aa.org/twelve-steps-twelve-traditions',
    resourceType: 'resource',
    topics: ['steps', 'traditions', 'official'],
    aaType: 'Literature',
  },
  {
    title: 'AA Meeting Finder',
    summary: 'Find AA meetings near you using the official AA meeting finder.',
    link: 'https://www.aa.org/find-aa',
    resourceType: 'resource',
    topics: ['meetings', 'newcomer', 'official'],
    aaType: 'Fellowship',
  },
  {
    title: 'AA Grapevine',
    summary: 'The international journal of Alcoholics Anonymous, featuring stories, articles, and insights from the recovery community.',
    link: 'https://www.aagrapevine.org/',
    resourceType: 'resource',
    topics: ['stories', 'spiritual-growth'],
    aaType: 'Literature',
  },
  {
    title: 'Living Sober',
    summary: 'A practical guide to maintaining sobriety and living a fulfilling life in recovery.',
    link: 'https://www.aa.org/living-sober',
    resourceType: 'resource',
    topics: ['practical', 'sobriety'],
    aaType: 'Literature',
  },
  {
    title: 'Daily Reflections',
    summary: 'Official AA Daily Reflections book, providing daily meditations and thoughts for the recovery journey.',
    link: 'https://www.aa.org/daily-reflections',
    resourceType: 'resource',
    topics: ['daily', 'meditation'],
    aaType: 'Literature',
  },
  {
    title: 'AA Service Manual',
    summary: 'Guidelines for AA service work and how to effectively serve in various AA service positions.',
    link: 'https://www.aa.org/service-manual',
    resourceType: 'resource',
    topics: ['service', 'general-service'],
    aaType: 'Service',
  },
  {
    title: 'AA Literature Library',
    summary: 'Browse and access official AA literature, including books, pamphlets, and audio resources.',
    link: 'https://www.aa.org/aa-literature',
    resourceType: 'resource',
    topics: ['library', 'official'],
    aaType: 'Literature',
  },
];

const literatureResources = [
  {
    title: 'How It Works',
    summary: 'Pages 58-71 of the Big Book outlining the core principles of AA recovery.',
    link: '/resources/literature/how-it-works',
    resourceType: 'literature',
    topics: ['steps', 'principles', 'core'],
    aaType: 'BigBook',
    isFeatured: true,
    metadata: {
      literatureType: 'chapter',
    },
  },
  {
    title: 'Alcoholics Anonymous (The Big Book)',
    summary: 'The primary text of AA that outlines the program of recovery.',
    link: 'https://www.aa.org/the-big-book',
    resourceType: 'literature',
    topics: ['core', 'recovery', 'steps'],
    aaType: 'BigBook',
    metadata: {
      literatureType: 'book',
      imageUrl: 'https://www.aa.org/sites/default/files/2021-11/en_bigbook_softcover_4th.jpg',
    },
  },
  {
    title: 'Twelve Steps and Twelve Traditions',
    summary: 'Detailed explanation of AA\'s Twelve Steps and Twelve Traditions.',
    link: 'https://www.aa.org/twelve-steps-twelve-traditions',
    resourceType: 'literature',
    topics: ['steps', 'traditions', 'core'],
    aaType: 'StepsAndTraditions',
    metadata: {
      literatureType: 'book',
      imageUrl: 'https://www.aa.org/sites/default/files/2021-11/en_step_12_12.jpg',
    },
  },
  {
    title: 'Living Sober',
    summary: 'Practical methods for staying sober in daily life.',
    link: 'https://www.aa.org/living-sober-book',
    resourceType: 'literature',
    topics: ['practical', 'recovery'],
    aaType: 'LivingSober',
    metadata: {
      literatureType: 'book',
      imageUrl: 'https://www.aa.org/sites/default/files/2021-11/en_livingsober.jpg',
    },
  },
  {
    title: 'Daily Reflections',
    summary: 'A collection of daily readings from AA literature.',
    link: 'https://www.aa.org/daily-reflections',
    resourceType: 'literature',
    topics: ['daily', 'meditation', 'recovery'],
    aaType: 'DailyReflections',
    metadata: {
      literatureType: 'book',
      imageUrl: 'https://www.aa.org/sites/default/files/2021-11/en_dailyreflections.jpg',
    },
  },
  {
    title: 'Is AA for You?',
    summary: 'Pamphlet to help individuals determine if AA might help them.',
    link: 'https://www.aa.org/is-aa-for-you',
    resourceType: 'literature',
    topics: ['newcomer', 'introduction'],
    aaType: 'Pamphlet',
    metadata: {
      literatureType: 'pamphlet',
    },
  },
  {
    title: 'This is AA',
    summary: 'An introduction to the AA recovery program.',
    link: 'https://www.aa.org/this-is-aa',
    resourceType: 'literature',
    topics: ['newcomer', 'introduction'],
    aaType: 'Pamphlet',
    metadata: {
      literatureType: 'pamphlet',
    },
  },
];

const defaultResources = [...generalResources, ...literatureResources].map((resource, index) => {
  const slug = toSlug(resource.title);
  const timestamp = new Date(baseDate.getTime() - index * 60000);
  return {
    slug,
    title: resource.title,
    summary: resource.summary || '',
    body: resource.body || '',
    resourceType: resource.resourceType || 'resource',
    topics: resource.topics || [],
    aaType: resource.aaType || '',
    link: resource.link || '',
    isFeatured: resource.isFeatured === true,
    status: 'published',
    publishedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    metadata: resource.metadata || {},
  };
});

async function seedResources() {
  const client = new MongoClient(uri);

  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    const db = client.db('dailyreflections');
    const collection = db.collection('resources');

    if (forceSeed) {
      console.log('⚠️  --force flag detected. Clearing existing resources...');
      await collection.deleteMany({});
    } else {
      console.log('📚 Checking existing resources...');
      const existingCount = await collection.countDocuments();
      if (existingCount > 0) {
        console.log(`⚠️  Found ${existingCount} existing resources. Skipping seed.`);
        console.log('   Re-run with "--force" to overwrite existing resources.');
        await client.close();
        process.exit(0);
      }
    }

    console.log('🌱 Seeding default resources...');
    const result = await collection.insertMany(defaultResources);

    console.log(`✅ Successfully seeded ${result.insertedCount} resources!`);
    console.log('\n📋 Resources created:');
    defaultResources.forEach((resource, index) => {
      console.log(`   ${index + 1}. ${resource.title} (${resource.resourceType})`);
    });

    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    await client.close();
    process.exit(1);
  }
}

seedResources();

