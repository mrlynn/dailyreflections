/**
 * Script to create a new blog article: "What is an AA Meeting?"
 * Run with: node scripts/create-aa-meeting-article.js
 */

import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import crypto from 'crypto';

dotenv.config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB || 'dailyreflections';

if (!uri) {
  console.error('❌ MONGODB_URI is not defined. Please set it in .env.local');
  process.exit(1);
}

function slugify(value = '') {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function ensureUniqueSlug(collection, baseSlug) {
  let slug = baseSlug;
  let counter = 1;
  
  while (await collection.findOne({ slug, resourceType: 'article', 'metadata.isBlog': true })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}

const article = {
  title: "What is an AA Meeting?",
  summary: "What to expect at your first AA meeting",
  body: `# What is an AA Meeting?

## What to Expect at Your First AA Meeting

Walking into your first Alcoholics Anonymous meeting can feel overwhelming. You might be nervous, uncertain, or even skeptical. That's completely normal. This guide will help you understand what AA meetings are, address common misconceptions, and prepare you for what to expect.

## Understanding AA Meetings

An AA meeting is a gathering of people who share a common problem with alcohol and a common solution. These meetings provide a safe, supportive environment where members share their experience, strength, and hope with each other. The primary purpose is to help alcoholics achieve and maintain sobriety.

### The Foundation: The 12 Steps and 12 Traditions

AA meetings are built on the foundation of the 12 Steps—a program of recovery—and the 12 Traditions—principles that guide how groups function. Meetings provide a place to learn about these principles and see them in action through the stories and experiences of others.

## Common Misconceptions About AA Meetings

### Misconception 1: "I'll be forced to speak or share"
**Reality:** You are never required to speak at an AA meeting. You can simply listen. If called upon, you can politely say, "I'm just here to listen today" or "I pass." Many people attend meetings for weeks or months before sharing.

### Misconception 2: "It's a religious organization"
**Reality:** AA is spiritual, not religious. The program speaks of a "Higher Power" that you can define however works for you—whether that's God, the universe, the group itself, or something else entirely. AA welcomes people of all faiths and those with no faith at all.

### Misconception 3: "Everyone will judge me"
**Reality:** AA meetings are judgment-free zones. Everyone there has struggled with alcohol. They understand what you're going through because they've been there. You'll find acceptance, not judgment.

### Misconception 4: "I have to be religious or believe in God"
**Reality:** Many atheists and agnostics have found recovery in AA. The program encourages you to find your own concept of a Higher Power, which can be anything greater than yourself—even the collective wisdom of the group.

### Misconception 5: "It's only for people who hit rock bottom"
**Reality:** AA welcomes anyone who has a desire to stop drinking, regardless of how "bad" their drinking was. You don't need to have lost everything to belong.

### Misconception 6: "I'll be pressured to join or commit"
**Reality:** There are no dues or fees. Membership is open to anyone with a desire to stop drinking. You can attend meetings without any commitment. The only requirement for membership is a desire to stop drinking.

## Types of AA Meetings

### In-Person Meetings

In-person meetings are held at various locations including:
- Community centers
- Churches (though AA is not affiliated with any religion)
- Hospitals
- Treatment centers
- Dedicated AA clubhouses
- Public buildings

**Open Meetings:** Open to anyone interested in AA, including family members, friends, and those curious about the program. These are great for your first meeting.

**Closed Meetings:** Limited to people who have a desire to stop drinking. These provide a more intimate setting for sharing.

### Online Meetings

Online meetings have become increasingly popular, especially since the COVID-19 pandemic. They offer:
- **Accessibility:** Attend from anywhere with internet access
- **Anonymity:** Participate from the comfort of your home
- **Variety:** Access meetings from around the world, 24/7
- **Convenience:** No travel required

Online meetings are conducted via:
- Video conferencing platforms (Zoom, Google Meet, etc.)
- Phone conference calls
- Text-based chat rooms
- Hybrid meetings (both in-person and online)

### Meeting Formats

#### Speaker Meetings
A member shares their story of recovery, typically covering:
- What it was like (their drinking history)
- What happened (how they found AA)
- What it's like now (life in recovery)

These meetings are great for newcomers as they provide insight into the recovery journey.

#### Discussion Meetings
Members discuss a topic related to recovery, such as:
- A step from the 12 Steps
- A reading from AA literature
- A topic chosen by the meeting chair
- A topic suggested by a member

Everyone who wants to can share their thoughts and experiences.

#### Literature Meetings
The group reads and discusses AA literature, such as:
- The Big Book (Alcoholics Anonymous)
- The 12 Steps and 12 Traditions
- Daily Reflections
- Living Sober
- Other AA-approved literature

These meetings help deepen understanding of the program.

#### Step Meetings
Focus on working through the 12 Steps. Members discuss:
- How to work a particular step
- Their experience with that step
- Questions and insights about the step

#### Beginner/Newcomer Meetings
Specifically designed for people new to AA:
- Explain how meetings work
- Introduce basic AA concepts
- Provide a welcoming environment
- Answer questions about the program

#### Big Book Study Meetings
In-depth study of the Big Book of Alcoholics Anonymous:
- Read passages together
- Discuss meanings and applications
- Share how the literature applies to recovery

#### Women's/Men's Meetings
Gender-specific meetings that provide:
- A comfortable space for gender-specific issues
- Focused discussion on recovery challenges
- Stronger sense of community

#### LGBTQ+ Meetings
Meetings specifically for LGBTQ+ members:
- Safe space for LGBTQ+ individuals
- Address unique challenges in recovery
- Build community within the community

## What Happens at a Typical Meeting?

### 1. Opening
- A reading of the AA Preamble
- Introduction of the meeting format
- Announcements (upcoming events, service opportunities)

### 2. Readings
- The Serenity Prayer
- How It Works (from the Big Book)
- The 12 Steps (often read)
- The 12 Traditions (sometimes read)

### 3. Sharing
- Members share their experience, strength, and hope
- Focus is on recovery, not war stories
- Cross-talk (directly responding to someone) is usually discouraged
- Sharing is voluntary

### 4. Closing
- The meeting chair may ask if anyone needs help
- Collection of voluntary contributions (not required)
- Closing prayer (often the Serenity Prayer or Lord's Prayer)
- Fellowship time (informal socializing)

## Meeting Etiquette

### Do's:
- **Arrive on time** (or a few minutes early)
- **Listen respectfully** when others are sharing
- **Keep sharing focused** on recovery and your experience
- **Respect anonymity**—what you hear stays in the meeting
- **Be open-minded**—you might hear something that helps
- **Get a phone list** if available (numbers of members willing to help)

### Don'ts:
- **Don't interrupt** when others are sharing
- **Don't give advice** directly to others (share your experience instead)
- **Don't use profanity** excessively (some meetings are more formal)
- **Don't come intoxicated** (though you're welcome if you're trying)
- **Don't break anonymity** of others outside the meeting

## The 7th Tradition: Self-Supporting

AA meetings are self-supporting through voluntary contributions. There are no dues or fees. A basket is usually passed, and you can contribute if you wish, but it's completely optional. The money goes to:
- Rent for meeting space
- Literature
- Coffee and refreshments
- General service office

## Finding a Meeting

### Online Resources:
- **AA.org** - Official AA website with meeting finder
- **Meeting Guide app** - Mobile app for finding meetings
- **Local AA intergroup websites** - Regional meeting directories

### Other Ways:
- Call your local AA intergroup (check phone book or online)
- Ask someone you know in recovery
- Visit an AA clubhouse
- Check community bulletin boards

## Your First Meeting: What to Bring

- **An open mind** - That's really all you need
- **A desire to stop drinking** - The only requirement
- **Optional:** A notebook if you want to take notes
- **Optional:** Cash for literature if you want to buy books

## After the Meeting

Many meetings have fellowship time afterward where people:
- Socialize informally
- Exchange phone numbers
- Get coffee or food together
- Answer questions for newcomers

This is a great time to:
- Ask questions
- Get phone numbers
- Find a temporary sponsor
- Learn about other meetings

## The Importance of Anonymity

Anonymity is a cornerstone of AA. It means:
- **What you hear stays in the meeting** - Don't discuss others' shares outside
- **Respect others' privacy** - Don't approach people you know from outside AA unless they approach you first
- **Your own anonymity is protected** - You can share as much or as little as you want

## Common Questions

### "Do I have to introduce myself?"
You can say your first name, or just "I'm here to listen." You're never required to say you're an alcoholic.

### "What if I see someone I know?"
This is common. Remember that they're there for the same reason you are. Respect their anonymity, and they'll respect yours.

### "What if I'm still drinking?"
You're welcome at meetings even if you're still drinking. Many people attend meetings while still struggling with alcohol.

### "How many meetings should I attend?"
There's no set number. Many people find it helpful to attend 90 meetings in 90 days when starting out, but any amount of meeting attendance can be helpful.

### "Do I need to believe in God?"
No. AA is spiritual, not religious. You can define your Higher Power however works for you.

## The Power of Connection

One of the most powerful aspects of AA meetings is the connection you'll find:
- **You're not alone** - Others understand what you're going through
- **Hope** - You'll see people who have recovered
- **Support** - People who genuinely want to help
- **Community** - A sense of belonging

## Conclusion

An AA meeting is simply a gathering of people helping each other stay sober, one day at a time. There's no pressure, no judgment, and no requirements beyond a desire to stop drinking. Whether you attend in-person or online, speaker meetings or discussion groups, the goal is the same: to find and maintain sobriety through mutual support and the 12 Steps.

Remember: everyone in that room was once a newcomer too. They remember what it felt like to walk through that door for the first time. You'll find understanding, acceptance, and hope. Take it one meeting at a time, and know that you're taking a courageous step toward recovery.`,
  resourceType: 'article',
  topics: [
    'AA meetings',
    'first meeting',
    'recovery',
    '12 steps',
    'support groups',
    'sobriety',
    'alcoholism',
    'meeting types',
    'online meetings',
    'in-person meetings'
  ],
  aaType: 'Getting Started',
  link: '',
  isFeatured: true,
  status: 'published',
  publishedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  metadata: {
    section: 'blog',
    category: 'Getting Started',
    coverImage: 'https://aacompanion.com/images/steps.png',
    imageUrl: 'https://aacompanion.com/images/steps.png',
    authorId: '69076ac87b1fc698109f7c64',
    authorName: 'Michael Lynn',
    authorBio: 'A dedicated recovery advocate with over 10 years of experience in the field. Passionate about helping others find their path to recovery through education and support.',
    authorAvatar: '/mike-avatar-circle.png',
    readingTimeMinutes: 12,
    contentType: 'blog',
    isBlog: true,
    previewToken: crypto.randomBytes(16).toString('hex'),
  },
};

async function createArticle() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('🔌 Connected to MongoDB');
    
    const db = client.db(databaseName);
    const collection = db.collection('resources');

    // Generate unique slug
    const baseSlug = slugify(article.title);
    article.slug = await ensureUniqueSlug(collection, baseSlug);

    // Check if article already exists
    const existing = await collection.findOne({
      slug: article.slug,
      resourceType: 'article',
      'metadata.isBlog': true,
    });

    if (existing) {
      console.log('⚠️  Article with this slug already exists:', article.slug);
      console.log('   To create a new version, delete the existing article first or modify the title.');
      process.exit(1);
    }

    // Insert the article
    const result = await collection.insertOne(article);
    console.log('✅ Successfully created blog article!');
    console.log(`   Title: ${article.title}`);
    console.log(`   Slug: ${article.slug}`);
    console.log(`   ID: ${result.insertedId}`);
    console.log(`   Status: ${article.status}`);
    console.log(`   URL: /blog/${article.slug}`);
    
  } catch (error) {
    console.error('❌ Error creating article:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

createArticle();

