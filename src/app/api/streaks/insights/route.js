import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { initMongoose } from '@/lib/mongoose';
import { getUserStreak } from '@/lib/models/userStreak';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

/**
 * GET /api/streaks/insights
 * Get detailed insights about a user's streaks across different journal types
 */
export async function GET(request) {
  try {
    // Initialize Mongoose
    await initMongoose();

    // Get authenticated user
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const url = new URL(request.url);

    // Optional journal type filter
    const journalType = url.searchParams.get('journalType');

    // Get MongoDB client
    const client = await clientPromise;
    const db = client.db();

    // Base insights data
    const insights = {
      currentStreak: 0,
      longestStreak: 0,
      totalEntries: 0,
      streakHealth: 'strong',
      lastEntryDate: null,
      milestones: [],
      recentActivity: [],
      journalTypes: {}
    };

    // If journal type is specified, get insights for that specific type
    if (journalType) {
      const streak = await getUserStreak(userId, journalType);

      insights.currentStreak = streak.currentStreak;
      insights.longestStreak = streak.longestStreak;
      insights.totalEntries = streak.totalEntries;
      insights.streakHealth = streak.streakHealth;
      insights.lastEntryDate = streak.lastEntryDate;
      insights.milestones = streak.milestones;
      insights.visualProgress = streak.visualProgress;
      insights.streakFreezes = streak.streakFreezes;
      insights.recoveryGrace = streak.recoveryGrace;

      // Get recent streak history (last 30 days)
      if (streak.streakHistory && streak.streakHistory.length > 0) {
        insights.recentActivity = streak.streakHistory
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 30);
      }
    } else {
      // Get all streak types for the user
      const streaksCollection = db.collection('user_streaks');
      const userStreaks = await streaksCollection.find({
        userId: new ObjectId(userId)
      }).toArray();

      // Process each streak type
      for (const streak of userStreaks) {
        insights.journalTypes[streak.journalType] = {
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          totalEntries: streak.totalEntries,
          streakHealth: streak.streakHealth,
          lastEntryDate: streak.lastEntryDate,
          visualProgress: streak.visualProgress
        };

        // Update overall stats
        if (streak.currentStreak > insights.currentStreak) {
          insights.currentStreak = streak.currentStreak;
        }
        if (streak.longestStreak > insights.longestStreak) {
          insights.longestStreak = streak.longestStreak;
        }
        insights.totalEntries += streak.totalEntries;

        // Add unique milestones to the overall list
        if (streak.milestones && streak.milestones.length > 0) {
          for (const milestone of streak.milestones) {
            if (!insights.milestones.some(m =>
              m.type === milestone.type &&
              m.threshold === milestone.threshold
            )) {
              insights.milestones.push(milestone);
            }
          }
        }
      }

      // Sort milestones by achieved date
      insights.milestones.sort((a, b) =>
        new Date(b.achievedAt) - new Date(a.achievedAt)
      );
    }

    // Add overall engagement score (1-100)
    insights.engagementScore = calculateEngagementScore(insights);

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Error in streaks insights GET route:', error);
    return NextResponse.json({ error: 'Failed to retrieve streak insights' }, { status: 500 });
  }
}

/**
 * Calculate an engagement score based on streak metrics
 *
 * @param {Object} insights - User streak insights
 * @returns {Number} - Engagement score from 1-100
 */
function calculateEngagementScore(insights) {
  // Base factors for engagement score
  const factors = {
    currentStreak: 0.4,  // 40% of score
    consistency: 0.3,    // 30% of score
    milestones: 0.3      // 30% of score
  };

  // Calculate streak score (max 40 points)
  let streakScore = Math.min(40, insights.currentStreak * 2);

  // Calculate consistency score based on total entries (max 30 points)
  let consistencyScore = Math.min(30, insights.totalEntries / 3);

  // Calculate milestone score (max 30 points)
  let milestoneScore = Math.min(30, ((insights.milestones && insights.milestones.length) || 0) * 5);

  // Calculate total score
  const totalScore = Math.round(
    (streakScore * factors.currentStreak) +
    (consistencyScore * factors.consistency) +
    (milestoneScore * factors.milestones)
  );

  return Math.min(100, Math.max(1, totalScore));
}