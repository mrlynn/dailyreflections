import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB || 'dailyreflections';

if (!uri) {
  console.error('❌ MONGODB_URI is not defined. Please set it in .env.local');
  process.exit(1);
}

const sampleArticles = [
  {
    title: "Understanding the 12 Steps: A Beginner's Guide",
    slug: "understanding-the-12-steps",
    excerpt: "An introduction to the 12 Steps of Alcoholics Anonymous and how they form the foundation of recovery.",
    content: `
# Understanding the 12 Steps: A Beginner's Guide

The 12 Steps of Alcoholics Anonymous provide a structured path to recovery that has helped millions find sobriety. This article offers an overview of each step and their collective significance.

## What Are the 12 Steps?

The 12 Steps were first published in 1939 in the book "Alcoholics Anonymous" (commonly known as the Big Book). They outline a process of:
- Admitting powerlessness over alcohol
- Believing in a power greater than ourselves
- Making a decision to turn our will over to that power
- Taking a moral inventory
- Admitting the exact nature of our wrongs
- Becoming ready to have these defects removed
- Asking for removal of shortcomings
- Making a list of those we have harmed
- Making direct amends where possible
- Continuing to take personal inventory
- Seeking through prayer and meditation
- Carrying this message to others

## The Steps in Detail

### Step 1: Powerlessness and Unmanageability
"We admitted we were powerless over alcohol—that our lives had become unmanageable."

This foundational step requires recognizing that willpower alone is insufficient to overcome addiction. By acknowledging our powerlessness, we open the door to accepting help.

### Step 2: Hope and Open-mindedness
"Came to believe that a Power greater than ourselves could restore us to sanity."

This step asks us to be open to spiritual help, however we understand it.

[Content continues with all 12 steps...]

## Working the Steps

The 12 Steps are not meant to be worked once and forgotten. They represent an ongoing process and a new way of living. Many people find that working with a sponsor—someone who has already worked the steps—provides guidance, accountability, and support.

Remember that progress, not perfection, is the goal. Each person's journey through the steps is unique, and there is no timeline for completion.

## Conclusion

The 12 Steps provide a practical program for changing one's life and finding lasting recovery. While originally designed for alcoholism, they have been adapted for many other addictions and conditions because their principles are universally applicable to human growth and healing.
    `,
    coverImage: '/images/blog/12-steps.jpg',
    author: {
      id: 'admin',
      name: 'Recovery Guide',
      bio: 'A dedicated recovery advocate with over 10 years of experience in the field. Passionate about helping others find their path to recovery through education and support.',
    },
    category: '12 Steps',
    tags: ['beginners', '12 steps', 'recovery basics'],
    publishedAt: new Date(2023, 0, 15),
    isFeatured: true,
  },
  {
    title: 'The Importance of Daily Reflection in Recovery',
    slug: 'importance-of-daily-reflection',
    excerpt:
      'How taking time each day for spiritual reflection strengthens sobriety and enhances personal growth.',
    content: `
# The Importance of Daily Reflection in Recovery

Daily reflection is a cornerstone practice in recovery, providing an opportunity to check in with ourselves, reinforce our commitment to sobriety, and evaluate our spiritual progress. This article explores the benefits and practices of incorporating daily reflection into your recovery journey.

## Why Daily Reflection Matters

Recovery isn't just about not drinking or using—it's about developing a new way of living. Daily reflection helps us:

1. **Maintain awareness** of our thoughts, feelings, and behaviors
2. **Identify patterns** that might lead to relapse
3. **Practice gratitude**, which research shows improves mental health
4. **Connect with our higher power** or spiritual values
5. **Track our progress** over time
6. **Apply program principles** to daily situations

## Methods of Daily Reflection

### Morning Meditation
Starting the day with quiet reflection sets a positive tone. Consider:
- Reading from recovery literature
- Setting intentions for the day
- Asking your higher power for guidance
- Writing down what you're grateful for

### Evening Review
At day's end, take time to:
- Acknowledge what went well
- Identify areas for growth
- Note any amends that need to be made
- Express gratitude for another day of sobriety

### Structured Journaling
Writing helps process thoughts and feelings. Try these prompts:
- How am I feeling physically, emotionally, and spiritually today?
- Did I have any resentments, fears, or self-centered thoughts?
- How did I serve others today?
- What am I grateful for?
- What would I do differently?

## The Tenth Step as Daily Practice

"Continued to take personal inventory and when we were wrong promptly admitted it."

The Tenth Step provides a framework for daily reflection. It encourages us to:
- Monitor our behavior throughout the day
- Quickly recognize when we're off track
- Make immediate corrections
- Clear away new resentments before they fester

## Benefits of Consistent Practice

Research and experience show that those who maintain a daily reflection practice:
- Have lower relapse rates
- Report greater serenity and emotional stability
- Develop stronger relationships
- Experience more gratitude and joy
- Navigate challenges more effectively

## Getting Started

Begin simply:
1. Set aside 5-10 minutes morning and evening
2. Choose a quiet space free from distractions
3. Use a journal or dedicated app to track reflections
4. Be honest but not judgmental with yourself
5. Look for patterns over time

## Conclusion

Daily reflection might seem like a small practice, but its effects compound over time. Like many aspects of recovery, the real benefit comes not from doing it perfectly but from doing it consistently. Whether you're new to recovery or have years of sobriety, a regular practice of reflection can deepen your program and enrich your life.
    `,
    coverImage: '/images/blog/daily-reflection.jpg',
    author: {
      id: 'admin',
      name: 'Recovery Guide',
      bio: 'A dedicated recovery advocate with over 10 years of experience in the field. Passionate about helping others find their path to recovery through education and support.',
    },
    category: 'Daily Practice',
    tags: ['reflection', 'daily inventory', '10th step', 'spiritual practice'],
    publishedAt: new Date(2023, 1, 8),
    isFeatured: false,
  },
  {
    title: 'Navigating Difficult Emotions in Sobriety',
    slug: 'navigating-difficult-emotions',
    excerpt: 'Strategies for handling challenging emotions without turning to substances.',
    content: `
# Navigating Difficult Emotions in Sobriety

One of the most challenging aspects of recovery is learning to face difficult emotions without the buffer of substances. Many of us drank or used to avoid feeling anger, sadness, fear, or shame. In sobriety, these emotions can feel overwhelming at first, but with practice, we can develop healthy ways to experience and express them.

## Common Emotional Challenges in Recovery

### Raw Feelings
Early recovery often brings intense emotions as the numbing effect of substances wears off. This is normal and temporary, though it rarely feels that way at the time.

### Emotional Backlog
Years of suppressed emotions may surface all at once. This "emotional debt" must be processed as part of healing.

### Limited Coping Skills
Many of us never developed healthy emotional regulation skills because we turned to substances instead.

### Guilt and Shame
Processing the harm caused during active addiction can trigger powerful feelings of guilt and shame.

## Tools for Emotional Regulation

### 1. Name It to Tame It
Simply identifying what you're feeling can reduce its intensity. "I am experiencing anger" creates space between you and the emotion.

### 2. The HALT Check
When emotions feel overwhelming, check if you're:
- Hungry
- Angry
- Lonely
- Tired
Addressing these basic needs can sometimes resolve emotional distress.

### 3. Mindfulness Practices
Mindfulness helps us observe emotions without judgment. Try:
- Focused breathing
- Body scans
- Meditation
- Grounding exercises

### 4. Physical Movement
Exercise releases endorphins and provides healthy emotional outlets:
- Walking
- Swimming
- Yoga
- Dance
- Team sports

### 5. Creative Expression
Art bypasses intellectual defenses and accesses emotions directly:
- Journaling
- Drawing or painting
- Music
- Poetry
- Clay work

### 6. Connection
Sharing difficult emotions with others reduces their power:
- Meetings
- Sponsorship
- Therapy
- Trusted friends

## The Role of Step Work

The 12 Steps provide a systematic way to address emotions:
- Steps 4 and 5 help process resentment, fear, and shame
- Steps 6 and 7 address character defects that generate painful emotions
- Steps 8 and 9 relieve guilt through making amends
- Steps 10-12 provide ongoing emotional maintenance

## When to Seek Additional Help

It's important to recognize when you need professional support:
- Persistent depression or anxiety
- Thoughts of self-harm
- Inability to function in daily life
- Extreme mood swings
- Unresolved trauma responses

## Conclusion

Learning to navigate difficult emotions is not just about staying sober—it's about developing emotional maturity and resilience. With practice, what once seemed unbearable becomes manageable, and we gain the freedom to experience the full range of human emotions without being controlled by them.

Remember that emotional growth takes time. Be patient with yourself, celebrate small victories, and keep reaching out for support when needed.
    `,
    coverImage: '/images/blog/emotions.jpg',
    author: {
      id: 'admin',
      name: 'Recovery Guide',
      bio: 'A dedicated recovery advocate with over 10 years of experience in the field. Passionate about helping others find their path to recovery through education and support.',
    },
    category: 'Emotional Sobriety',
    tags: ['emotions', 'coping skills', 'mental health', 'emotional sobriety'],
    publishedAt: new Date(2023, 2, 22),
    isFeatured: false,
  },
  {
    title: 'The Fourth Step Inventory: A Comprehensive Guide',
    slug: 'fourth-step-inventory-guide',
    excerpt: 'A detailed walkthrough of how to complete a thorough and honest Fourth Step inventory.',
    content: `
# The Fourth Step Inventory: A Comprehensive Guide

"Made a searching and fearless moral inventory of ourselves."

The Fourth Step marks a turning point in recovery—the place where we begin to translate awareness into action. This guide offers practical advice for completing this crucial step effectively.

## Purpose of the Fourth Step

The inventory serves several purposes:
- Identifies patterns of behavior that fuel addiction
- Reveals character defects that cause suffering
- Brings hidden resentments to light
- Prepares us for the Fifth Step
- Provides relief from the burden of secrets

## Preparing for the Inventory

### Spiritual Readiness
The first three steps create the foundation:
- Acknowledging powerlessness
- Coming to believe in a Higher Power
- Making a decision to turn our will over

### Practical Preparation
- Set aside dedicated time
- Find a private space
- Gather writing materials or use digital tools
- Discuss the process with your sponsor

### Emotional Preparation
- Commit to honesty
- Release perfectionism
- Remember this is for your healing
- Expect some discomfort

## Components of a Fourth Step Inventory

### 1. Resentment Inventory
The Big Book suggests a three-column approach:
- **Column 1**: Who am I resentful at?
- **Column 2**: What did they do?
- **Column 3**: How did it affect me?

A fourth column examines your part:
- Where was I selfish?
- Where was I dishonest?
- Where was I self-seeking?
- Where was I afraid?

### 2. Fear Inventory
- List your fears (specific and general)
- Examine why you have each fear
- Consider what truths counteract these fears
- Identify how fear has controlled your behavior

### 3. Sex/Relationship Inventory
Review past and current relationships:
- Where have you caused harm?
- What patterns emerge?
- Were you selfish, dishonest, or inconsiderate?
- Did you arouse jealousy or suspicion?
- Were you faithful?
- What should your ideal relationship look like?

## Common Challenges and Solutions

### "I can't remember everything"
- Start with what you do remember
- Begin with recent events and work backward
- Use triggers like photos, social media, or conversations with family to jog memory

### "I'm afraid of what I'll discover"
- Remember that awareness is the first step to change
- You're not alone in having regrets
- The Fifth Step provides relief through sharing

### "I don't want to blame others"
- The inventory isn't about blame but about understanding
- Focus on your reactions and behaviors
- The purpose is healing, not assigning fault

### "I'm overwhelmed by the task"
- Break it into smaller sessions
- Start with one category at a time
- Remember progress over perfection

## After Completing the Inventory

- Review what you've written
- Look for patterns and themes
- Note insights about yourself
- Prepare to share with another person (Fifth Step)
- Keep your inventory secure and private

## Conclusion

The Fourth Step may be challenging, but it's also liberating. By honestly facing our past, we free ourselves from its control over our present. This inventory isn't about shame or guilt—it's about taking responsibility for our recovery and creating the foundation for a new way of living.

Remember that thousands have completed this step before you and found it to be a turning point in their recovery. With courage, honesty, and the support of your program, you can too.
    `,
    coverImage: '/images/blog/fourth-step.jpg',
    author: {
      id: 'admin',
      name: 'Recovery Guide',
      bio: 'A dedicated recovery advocate with over 10 years of experience in the field. Passionate about helping others find their path to recovery through education and support.',
    },
    category: '12 Steps',
    tags: ['4th step', 'inventory', 'step work', 'resentments', 'fear'],
    publishedAt: new Date(2023, 3, 4),
    isFeatured: false,
  },
  {
    title: 'Finding the Right Sponsor in Recovery',
    slug: 'finding-the-right-sponsor',
    excerpt:
      'How to select a sponsor who can effectively guide you through the 12 Steps and support your recovery journey.',
    content: `
# Finding the Right Sponsor in Recovery

A sponsor is a guide who has worked the Steps and can help you navigate your own recovery journey. Finding the right sponsor is an important decision that can significantly impact your sobriety. This article offers guidance on selecting someone who can effectively support your recovery.

## What Is a Sponsor?

A sponsor is:
- Someone with solid sobriety who has worked the 12 Steps
- A guide through the recovery program
- A mentor who shares experience, strength, and hope
- A trusted confidant for Fifth Step work
- A source of accountability and perspective

A sponsor is not:
- A therapist or counselor
- A financial advisor
- A romantic partner
- A perfect human being
- Responsible for your recovery

## When to Get a Sponsor

The Big Book suggests getting a sponsor right away. Early sponsorship provides:
- Immediate guidance when vulnerability is high
- Help understanding meeting dynamics
- Assistance starting the Steps promptly
- Support during early challenges

## Qualities to Look for in a Sponsor

### Essential Qualities
- **Solid Sobriety**: Look for someone with at least a year of continuous sobriety
- **Step Experience**: Has worked all 12 Steps and continues to practice them
- **Program Knowledge**: Understands the principles and traditions
- **Availability**: Has time to meet regularly
- **Listening Skills**: Gives full attention during conversations

### Personal Compatibility
- **Communication Style**: Direct or gentle, detailed or big-picture
- **Approach to Recovery**: Traditional or progressive
- **Spiritual Outlook**: Compatible with your beliefs or openness
- **Personality**: Someone you respect and can work with comfortably

## Red Flags to Watch For

Be cautious of potential sponsors who:
- Talk more about their drinking/using days than their recovery
- Seem to enjoy power or control over others
- Have unstable relationships or employment
- Gossip about other program members
- Push romantic or financial involvement
- Are unwilling to refer you to professional help when needed

## How to Ask Someone to Be Your Sponsor

1. **Attend multiple meetings** to observe potential sponsors
2. **Listen for someone whose shares resonate** with you
3. **Approach them after a meeting** or during fellowship time
4. **Be direct**: "Would you be willing to be my sponsor?"
5. **Ask about their approach**: "How do you typically work with sponsees?"
6. **Clarify expectations**: "What would you expect from me as a sponsee?"

## Working with Your Sponsor

Effective sponsorship requires:
- **Regular contact**: Schedule consistent check-ins
- **Honesty**: Be truthful about struggles and slips
- **Willingness**: Follow suggestions even when uncomfortable
- **Action**: Do the work between meetings
- **Respect**: Honor boundaries and time constraints

## When to Consider Changing Sponsors

It may be time for a change if:
- Your sponsor relapses
- They become consistently unavailable
- The relationship becomes unhealthy
- Your recovery needs evolve
- You've completed the Steps and need different guidance

## Conclusion

Finding the right sponsor is not about finding a perfect person, but about finding someone who can effectively guide you through the program of recovery. Take time to observe, listen, and reflect on what you need in a sponsor. Remember that sponsorship is a two-way street that requires commitment from both parties.

Many people have multiple sponsors throughout their recovery journey as their needs change. The goal is always the same: to work the Steps, grow in recovery, and eventually become able to sponsor others.
    `,
    coverImage: '/images/blog/sponsorship.jpg',
    author: {
      id: 'admin',
      name: 'Recovery Guide',
      bio: 'A dedicated recovery advocate with over 10 years of experience in the field. Passionate about helping others find their path to recovery through education and support.',
    },
    category: 'Recovery Relationships',
    tags: ['sponsorship', 'mentorship', 'recovery support', '12 step work'],
    publishedAt: new Date(2023, 4, 19),
    isFeatured: false,
  },
];

function createResourceDocument(article, index) {
  const timestamp = article.publishedAt || new Date(Date.now() - index * 600000);

  return {
    slug: article.slug,
    title: article.title,
    summary: article.excerpt,
    body: article.content.trim(),
    resourceType: 'article',
    topics: article.tags,
    aaType: article.category,
    link: '',
    isFeatured: Boolean(article.isFeatured),
    status: 'published',
    publishedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    metadata: {
      section: 'blog',
      category: article.category,
      coverImage: article.coverImage,
      imageUrl: article.coverImage,
      authorId: article.author?.id || null,
      authorName: article.author?.name || 'Daily Reflections',
      authorBio: article.author?.bio || '',
      authorAvatar: article.author?.avatar || null,
      readingTimeMinutes: article.readingTimeMinutes || null,
      contentType: 'blog',
      isBlog: true,
    },
  };
}

async function seedBlogArticles() {
  console.log('🌱 Starting blog article seeding...');
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('🔌 Connected to MongoDB');

    const db = client.db(databaseName);
    const collection = db.collection('resources');

    const existing = await collection.countDocuments({
      resourceType: 'article',
      'metadata.section': 'blog',
    });

    const overwrite = process.argv.includes('--overwrite');

    if (existing > 0 && !overwrite) {
      console.log(`⚠️  Found ${existing} existing blog resources. Skipping seed.`);
      console.log('   Re-run with "--overwrite" to replace existing blog content.');
      return;
    }

    if (existing > 0 && overwrite) {
      console.log('🧹 Clearing existing blog resources (overwrite enabled)…');
      await collection.deleteMany({
        resourceType: 'article',
        'metadata.section': 'blog',
      });
    }

    const documents = sampleArticles.map((article, index) =>
      createResourceDocument(article, index)
    );

    if (documents.length === 0) {
      console.log('No sample articles to insert.');
      return;
    }

    await collection.insertMany(documents);

    console.log(`✅ Seeded ${documents.length} blog articles into the resources collection.`);

    const indexSpecs = [
      {
        keys: { slug: 1 },
        options: {
          name: 'blog_slug_unique',
          unique: true,
          partialFilterExpression: { 'metadata.isBlog': true },
        },
      },
      {
        keys: { resourceType: 1, status: 1, publishedAt: -1 },
        options: { name: 'resources_type_status_publishedAt_idx' },
      },
      {
        keys: { 'metadata.section': 1, publishedAt: -1 },
        options: { name: 'resources_section_publishedAt_idx' },
      },
      {
        keys: { topics: 1 },
        options: { name: 'resources_topics_idx' },
      },
      {
        keys: { status: 1, 'metadata.category': 1 },
        options: { name: 'resources_status_category_idx' },
      },
      {
        keys: { title: 'text', summary: 'text', body: 'text', topics: 'text' },
        options: { name: 'resources_blog_text_index' },
      },
    ];

    for (const spec of indexSpecs) {
      try {
        await collection.createIndex(spec.keys, spec.options);
      } catch (error) {
        const indexName = spec.options?.name ?? JSON.stringify(spec.keys);
        if (error?.code === 86) {
          // Index already exists with different options
          console.warn(`⚠️  Skipped index ${indexName} (already exists with different options).`);
        } else if (error?.code === 85) {
          console.warn(`⚠️  Skipped index ${indexName} (conflicts with existing index).`);
        } else if (error?.code === 11000) {
          console.warn(`⚠️  Skipped index ${indexName} due to duplicate values.`);
        } else {
          console.warn(`⚠️  Failed to create index ${indexName}: ${error?.message ?? error}`);
        }
      }
    }

    console.log('📚 Ensured indexes for blog articles (where possible).');
  } catch (error) {
    console.error('❌ Error seeding blog articles:', error);
    process.exitCode = 1;
  } finally {
    await client.close();
    console.log('👋 MongoDB connection closed.');
  }
}

seedBlogArticles();