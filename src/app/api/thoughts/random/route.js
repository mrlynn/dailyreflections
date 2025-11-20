import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getTodayKey } from '@/utils/dateUtils';

/**
 * API handler to fetch a random thought of the day
 *
 * @returns {Object} A random thought or a fallback if none found
 */
export async function GET() {
  try {
    const { db } = await connectToDatabase();

    // Try to get a random thought
    const dailyThoughts = await db.collection('dailyThoughts')
      .find({ active: true })
      .toArray();

    let dailyThought;

    if (dailyThoughts && dailyThoughts.length > 0) {
      // Select a random thought from the collection
      const randomIndex = Math.floor(Math.random() * dailyThoughts.length);
      dailyThought = dailyThoughts[randomIndex];
    } else {
      // If no thoughts exist, create a fallback array of generic recovery thoughts
      const fallbackThoughts = [
        {
          title: "One Day at a Time",
          thought: "Focus on today's challenges and blessings without being overwhelmed by tomorrow's uncertainties.",
          challenge: "Each time you feel anxious about the future today, take a deep breath and bring your focus back to the present moment.",
          dateKey: getTodayKey()
        },
        {
          title: "Progress Not Perfection",
          thought: "Recovery isn't about achieving perfection, but about making consistent progress on your journey.",
          challenge: "Acknowledge one area where you've made progress, no matter how small it might seem.",
          dateKey: getTodayKey()
        },
        {
          title: "The Power of Connection",
          thought: "Isolation feeds addiction, while connection nurtures recovery. We heal through our relationships with others.",
          challenge: "Reach out to someone in your recovery network today, even if it's just a brief message or call.",
          dateKey: getTodayKey()
        },
        {
          title: "Accepting What We Cannot Change",
          thought: "Peace comes from accepting what we cannot control and focusing our energy on what we can.",
          challenge: "Identify one situation you're trying to control that may be better served by acceptance.",
          dateKey: getTodayKey()
        },
        {
          title: "Gratitude in Recovery",
          thought: "Cultivating gratitude shifts our perspective from what's missing to the abundance already present in our lives.",
          challenge: "Write down three things you're grateful for in your recovery journey.",
          dateKey: getTodayKey()
        }
      ];

      // Select a random fallback thought
      const randomIndex = Math.floor(Math.random() * fallbackThoughts.length);
      dailyThought = fallbackThoughts[randomIndex];
    }

    // Return the thought with successful status
    return NextResponse.json({
      success: true,
      data: dailyThought
    });

  } catch (error) {
    console.error('Error fetching random thought:', error);

    // Return error with appropriate status
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch random thought'
      },
      { status: 500 }
    );
  }
}