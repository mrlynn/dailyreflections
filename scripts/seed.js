/**
 * Seed script for Daily Reflections MongoDB database
 * Run with: npm run seed
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI || 'mongodb+srv://your-cluster.mongodb.net/dailyreflections';
const client = new MongoClient(uri);

// Sample reflection data
const sampleReflections = [
  {
    _id: new ObjectId('507f1f77bcf86cd799439011'),
    title: 'DO I HAVE A CHOICE?',
    quote: 'The fact is that most alcoholics, for reasons yet obscure, have lost the power of choice in drink. Our so-called willpower becomes practically nonexistent. We are unable, at certain times, to bring into our consciousness with sufficient force the memory of the suffering and humiliation of even a week or a month ago. We are without defense against the first drink.',
    comment: '<p>My powerlessness over alcohol affects me mentally, spiritually, and physically. When my thinking becomes obsessive, and I cannot dismiss my mental obsession about drinking from my consciousness, I am powerless. When my negative emotions and anxieties about life become unmanageable, I am powerless. When I cannot stop my compulsive behavior, I am powerless. Yet I do have a choice—I can stop and surrender to the God of my understanding.</p>',
    reference: '--ALCOHOLICS ANONYMOUS, p. 24',
    month: 1,
    day: 8,
  },
  {
    _id: new ObjectId('507f1f77bcf86cd799439012'),
    title: 'THE TEST OF TIME',
    quote: 'In God\'s economy, nothing is wasted. Through failure, we learn a lesson in humility which is probably needed, painful though it is.',
    comment: '<p>When I came into A.A., I wanted to find some of my high school drinking companions who had "made it big." I looked forward to impressive "success" stories. Instead, I heard experiences of which most people would be ashamed. I heard about marital failures, troubled hearts, and burned-out cases. I puzzled over these accounts until I came to understand that A.A. really does not demand worldly success. Even failures are turned to good account. Through surrender, those apparent failings were changed into practical experience that makes us helpful to others.</p>',
    reference: '--AS BILL SEES IT, p. 114',
    month: 1,
    day: 9,
  },
  {
    _id: new ObjectId('507f1f77bcf86cd799439013'),
    title: 'WHY WE SIGNIFY',
    quote: 'We alcoholics have stories to tell, if anybody cares to listen.',
    comment: '<p>We tell our stories in A.A. to help others, but sharing our experience, strength, and hope can help us too. When we talk about ourselves with someone else, we often gain perspective on our own situation. Through sharing, we clarify our thinking and, sometimes, we receive the courage to take the action we need to take. We all have stories to tell, and the sharing of those stories often benefits not only the listener, but the teller as well.</p>',
    reference: '--ALCOHOLICS ANONYMOUS, p. 58',
    month: 1,
    day: 10,
  },
  {
    _id: new ObjectId('507f1f77bcf86cd799439014'),
    title: 'MEASURING READINESS',
    quote: 'Nothing is so undesirable as that which could not be avoided.',
    comment: '<p>When I started to drink, I felt a sense of relief. I wanted to feel different. The first drink removed the fear I was experiencing. I desired to be free of pain. Drinking wasn\'t about wanting to get drunk; it was about wanting to feel good. But now I see that I cannot drink successfully. I have to be willing to go to any length to stay sober. If I am truly honest with myself, I have to admit that I am not ready to drink again, even though some part of me continues to believe that one day I might be able to drink "normally." In reality, there is no "normal" drinking for me. I must accept that I am an alcoholic and that my only hope is to remain sober one day at a time.</p>',
    reference: '--AS BILL SEES IT, p. 154',
    month: 1,
    day: 11,
  },
  {
    _id: new ObjectId('507f1f77bcf86cd799439015'),
    title: 'SHARING IN DEMAND',
    quote: 'Alcoholics Anonymous is a fellowship of men and women who share their experience, strength and hope with each other...',
    comment: '<p>I have to share my story with others. It\'s not about me, it\'s about helping another alcoholic who still suffers. When I tell my story, I connect with others who have had similar experiences. I am not alone. I have a place to belong. I am part of something greater than myself. Through sharing, I find meaning and purpose in my life. I can help someone else avoid the pain I went through. That is why I share my story.</p>',
    reference: '--ALCOHOLICS ANONYMOUS, p. xx',
    month: 1,
    day: 12,
  },
];

const sampleComments = [
  {
    _id: new ObjectId('507f191e810c19729de860ea'),
    dateKey: '01-08',
    parentId: null,
    path: [],
    author: 'RecoveryOne',
    body: 'This really resonated with me today. The idea that I have a choice to surrender is powerful.',
    createdAt: new Date('2024-01-08T10:00:00Z'),
  },
  {
    _id: new ObjectId('507f191e810c19729de860eb'),
    dateKey: '01-08',
    parentId: '507f191e810c19729de860ea',
    path: ['507f191e810c19729de860ea'],
    author: 'Hopeful',
    body: 'Thanks for sharing. The surrender part has been the hardest for me, but it\'s getting easier.',
    createdAt: new Date('2024-01-08T11:30:00Z'),
  },
  {
    _id: new ObjectId('507f191e810c19729de860ec'),
    dateKey: '01-08',
    parentId: null,
    path: [],
    author: 'Grateful',
    body: 'Powerlessness. What a concept. I finally understand that I can\'t control everything, and that\'s okay.',
    createdAt: new Date('2024-01-08T14:00:00Z'),
  },
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    const db = client.db();

    // Create collections
    console.log('Creating collections...');
    await db.createCollection('reflections');
    await db.createCollection('comments');

    // Create indexes
    console.log('Creating indexes...');
    
    // Reflections: compound index on month/day for fast lookups
    await db.collection('reflections').createIndex(
      { month: 1, day: 1 },
      { unique: true, name: 'month_day_unique' }
    );
    
    // Comments: index on dateKey for filtering by date
    await db.collection('comments').createIndex(
      { dateKey: 1, createdAt: -1 },
      { name: 'dateKey_created_desc' }
    );
    
    // Comments: index on parentId for threading
    await db.collection('comments').createIndex(
      { parentId: 1 },
      { name: 'parentId_index' }
    );

    // Insert sample data
    console.log('Inserting sample reflections...');
    const reflectionsResult = await db.collection('reflections').insertMany(sampleReflections);
    console.log(`Inserted ${reflectionsResult.insertedCount} reflections`);

    console.log('Inserting sample comments...');
    const commentsResult = await db.collection('comments').insertMany(sampleComments);
    console.log(`Inserted ${commentsResult.insertedCount} comments`);

    console.log('\n✅ Seed completed successfully!');
    console.log('\nTo verify:');
    console.log(`  Reflections: ${await db.collection('reflections').countDocuments()} documents`);
    console.log(`  Comments: ${await db.collection('comments').countDocuments()} documents`);

    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run seed
seed();

