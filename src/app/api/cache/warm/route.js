import { NextResponse } from 'next/server';
import { warmCache } from '@/lib/responseCache';
import { auth } from '@/lib/auth';

// Common questions that users frequently ask
const COMMON_QUESTIONS = [
  {
    query: "What are the 12 steps of AA?",
    context: {},
    response: `The 12 Steps of Alcoholics Anonymous are:

1. We admitted we were powerless over alcohol—that our lives had become unmanageable.
2. Came to believe that a Power greater than ourselves could restore us to sanity.
3. Made a decision to turn our will and our lives over to the care of God as we understood Him.
4. Made a searching and fearless moral inventory of ourselves.
5. Admitted to God, to ourselves, and to another human being the exact nature of our wrongs.
6. Were entirely ready to have God remove all these defects of character.
7. Humbly asked Him to remove our shortcomings.
8. Made a list of all persons we had harmed, and became willing to make amends to them all.
9. Made direct amends to such people wherever possible, except when to do so would injure them or others.
10. Continued to take personal inventory and when we were wrong promptly admitted it.
11. Sought through prayer and meditation to improve our conscious contact with God as we understood Him, praying only for knowledge of His will for us and the power to carry that out.
12. Having had a spiritual awakening as the result of these Steps, we tried to carry this message to alcoholics, and to practice these principles in all our affairs.`,
    citations: [
      {
        source: "Alcoholics Anonymous Big Book",
        reference: "Chapter 5 - How It Works",
        text: "The 12 Steps are the foundation of the AA program...",
        score: 1.0,
        scorePercentage: "100%",
        url: "/big-book"
      }
    ],
    metadata: {
      preWarmed: true,
      category: "fundamentals"
    },
    ttlDays: 90
  },
  {
    query: "What is a higher power in AA?",
    context: {},
    response: `In Alcoholics Anonymous, a Higher Power is a power greater than yourself that you choose to believe in. The beauty of AA is that it doesn't dictate what your Higher Power must be—it can be God as you understand Him, the universe, nature, the AA group itself, or any concept of a power greater than yourself.

The key principle is that this Higher Power can help restore you to sanity and guide you through recovery. Many people find that their understanding of their Higher Power evolves and deepens as they work the Steps.

What matters is not what you call your Higher Power, but that you recognize you cannot recover through willpower alone—you need help from something beyond yourself.`,
    citations: [
      {
        source: "Alcoholics Anonymous Big Book",
        reference: "Chapter 4 - We Agnostics",
        text: "...God as we understood Him...",
        score: 1.0,
        scorePercentage: "100%"
      }
    ],
    metadata: {
      preWarmed: true,
      category: "fundamentals"
    },
    ttlDays: 90
  },
  {
    query: "How do I find an AA meeting near me?",
    context: {},
    response: `You can find AA meetings near you in several ways:

1. **Use our Meeting Finder**: Navigate to the Meetings section in the app menu to search for meetings by location, day, and type.

2. **Visit AA.org**: Go to https://aa.org/find-aa and use their meeting locator.

3. **Call the AA Hotline**: In the United States, call (212) 870-3400 for help finding meetings.

4. **Online Meetings**: If you prefer virtual meetings, there are many online AA meetings available 24/7. You can find them at aa-intergroup.org.

Remember, meetings are free and open to anyone who has a desire to stop drinking. You don't need to commit to anything—just show up and listen.`,
    citations: [],
    metadata: {
      preWarmed: true,
      category: "practical"
    },
    ttlDays: 30
  },
  {
    query: "What is the difference between a sponsor and a friend in AA?",
    context: {},
    response: `A sponsor in AA serves a unique role that goes beyond friendship:

**A Sponsor:**
- Guides you through working the 12 Steps
- Shares their experience of recovery
- Provides accountability and support
- Is available when you're struggling
- Helps you understand AA literature and principles
- Has worked the Steps themselves

**A Friend:**
- Provides general support and companionship
- May not have experience with the Steps
- Relationship is more mutual and equal

Your sponsor should be someone who has what you want in recovery, has worked the Steps, and is the same gender as you (to avoid complications). You can have many friends in AA, but your sponsor has a specific role in your recovery journey.

It's recommended to choose a sponsor early in recovery, ideally someone with at least a year of continuous sobriety.`,
    citations: [
      {
        source: "AA Guidelines",
        reference: "Questions & Answers on Sponsorship",
        score: 1.0
      }
    ],
    metadata: {
      preWarmed: true,
      category: "sponsorship"
    },
    ttlDays: 60
  },
  {
    query: "What should I do if I relapsed?",
    context: {},
    response: `If you've relapsed, please know that you're not alone and recovery is still possible. Here are some important steps:

1. **Be honest**: Tell your sponsor, AA friends, or someone you trust. Secrets keep us sick.

2. **Don't give up**: A relapse doesn't erase the progress you've made. Many people relapse before finding lasting sobriety.

3. **Get to a meeting**: Attend a meeting as soon as possible. Share if you feel comfortable—people will understand and support you.

4. **Identify what happened**: Work with your sponsor to understand what led to the relapse. What warning signs did you miss?

5. **Recommit to the program**: Are you working all 12 Steps? Are you going to enough meetings? Do you need more support?

6. **Be compassionate with yourself**: Beating yourself up won't help. Focus on moving forward.

7. **Stay safe**: If you need medical help (detox, etc.), get it. Don't try to handle withdrawal alone if it's severe.

Remember: The only requirement for AA membership is a desire to stop drinking. That desire can return after a relapse. Keep coming back.`,
    citations: [],
    metadata: {
      preWarmed: true,
      category: "crisis_support"
    },
    ttlDays: 30
  }
];

/**
 * POST /api/cache/warm
 * Warm the cache with common questions (admin only)
 */
export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    console.log('🔥 Starting cache warming process...');
    console.log(`📝 Preparing to warm ${COMMON_QUESTIONS.length} common questions`);

    const warmed = await warmCache(COMMON_QUESTIONS);

    console.log(`✅ Successfully warmed ${warmed} cache entries`);

    return NextResponse.json({
      success: true,
      message: `Successfully warmed ${warmed} cache entries`,
      totalQuestions: COMMON_QUESTIONS.length,
      warmedCount: warmed,
    });
  } catch (error) {
    console.error('❌ Cache warming failed:', error);
    return NextResponse.json(
      { error: 'Failed to warm cache', details: error.message },
      { status: 500 }
    );
  }
}
