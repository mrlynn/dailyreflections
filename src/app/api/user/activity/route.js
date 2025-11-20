import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getUserStreak } from '@/lib/models/userStreak';
import { getTodayKey } from '@/utils/dateUtils';

/**
 * GET /api/user/activity
 * Get user's recent activity and stats for home page personalization
 */
export async function GET(request) {
  try {
    const session = await getSession(request);
    
    if (!session || !session.user) {
      return NextResponse.json({
        isAuthenticated: false,
        activity: null
      });
    }

    const userId = session.user.id;
    const client = await clientPromise;
    const db = client.db('dailyreflections');
    const todayKey = getTodayKey();

    // Get user's last journal entry
    const lastJournalEntry = await db.collection('journal_entries')
      .findOne(
        { userId: new ObjectId(userId) },
        { sort: { date: -1 }, projection: { date: 1, entryType: 1 } }
      );

    // Count journal entries this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const journalEntriesThisWeek = await db.collection('journal_entries')
      .countDocuments({
        userId: new ObjectId(userId),
        date: { $gte: oneWeekAgo }
      });

    // Count journal entries this month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const journalEntriesThisMonth = await db.collection('journal_entries')
      .countDocuments({
        userId: new ObjectId(userId),
        date: { $gte: oneMonthAgo }
      });

    // Get user's streak data
    const streakData = await getUserStreak(userId, 'step10');

    // Get last reflection viewed (if we track this in user activity)
    // For now, we'll check if user has viewed today's reflection by checking comments
    const lastReflectionComment = await db.collection('comments')
      .findOne(
        { userId: new ObjectId(userId) },
        { sort: { createdAt: -1 }, projection: { dateKey: 1, createdAt: 1 } }
      );

    // Count reflections with comments this week (as proxy for reflections viewed/completed)
    const reflectionsThisWeek = await db.collection('comments')
      .distinct('dateKey', {
        userId: new ObjectId(userId),
        createdAt: { $gte: oneWeekAgo }
      });

    // Get today's focus suggestion based on last journal entry sentiment or tags
    let todayFocus = null;
    if (lastJournalEntry) {
      // Simple logic: if last entry has tags, suggest focus on those themes
      // Or suggest based on mood patterns
      const recentEntries = await db.collection('journal_entries')
        .find(
          { userId: new ObjectId(userId) },
          { sort: { date: -1 }, limit: 5, projection: { tags: 1, mood: 1 } }
        )
        .toArray();

      if (recentEntries.length > 0) {
        // Find most common tags
        const tagCounts = {};
        recentEntries.forEach(entry => {
          if (entry.tags && Array.isArray(entry.tags)) {
            entry.tags.forEach(tag => {
              tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
          }
        });

        const mostCommonTag = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a])[0];
        if (mostCommonTag) {
          todayFocus = {
            type: 'tag',
            value: mostCommonTag,
            message: `Continue exploring ${mostCommonTag} in your recovery journey`
          };
        }
      }
    }

    // Determine "continue where you left off" - last reflection or last journal entry
    let continueItem = null;
    if (lastReflectionComment) {
      continueItem = {
        type: 'reflection',
        dateKey: lastReflectionComment.dateKey,
        label: 'Continue reading reflections',
        date: lastReflectionComment.createdAt
      };
    } else if (lastJournalEntry) {
      continueItem = {
        type: 'journal',
        label: 'Continue your journal',
        date: lastJournalEntry.date
      };
    }

    return NextResponse.json({
      isAuthenticated: true,
      activity: {
        streak: {
          current: streakData.currentStreak || 0,
          longest: streakData.longestStreak || 0,
          health: streakData.streakHealth || 'strong'
        },
        journal: {
          entriesThisWeek: journalEntriesThisWeek,
          entriesThisMonth: journalEntriesThisMonth,
          lastEntryDate: lastJournalEntry?.date || null
        },
        reflections: {
          viewedThisWeek: reflectionsThisWeek.length,
          lastViewedDateKey: lastReflectionComment?.dateKey || null
        },
        todayFocus,
        continueItem
      }
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user activity' },
      { status: 500 }
    );
  }
}

