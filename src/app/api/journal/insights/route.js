import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import {
  getUserMoodStats,
  getUserTagStats,
  getEntriesByDayOfWeek,
  getUserStreakInfo as getBasicStreakInfo
} from '@/lib/models/journalEntry';
import { getUserStreak } from '@/lib/models/userStreak';
import { ObjectId } from 'mongodb';

/**
 * GET /api/journal/insights
 * Retrieves insights and statistics for the user's journal entries
 * Requires authentication
 */
export async function GET(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Ensure we have a valid user ID
    const userId = session.user.id;
    if (!userId) {
      console.error('Missing user ID in session');
      return NextResponse.json(
        { error: 'Invalid user session' },
        { status: 400 }
      );
    }

    // Extract query parameters for date range
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const useEnhancedStreak = searchParams.get('enhancedStreak') !== 'false'; // Default to true

    // Get various statistics
    let moodStats, tagStats, dayOfWeekStats;
    try {
      [moodStats, tagStats, dayOfWeekStats] = await Promise.all([
        getUserMoodStats(userId, { startDate, endDate }),
        getUserTagStats(userId),
        getEntriesByDayOfWeek(userId)
      ]);
    } catch (statsError) {
      console.error('Error fetching journal statistics:', statsError);
      return NextResponse.json(
        { error: 'Failed to retrieve journal statistics' },
        { status: 500 }
      );
    }

    // Get streak information based on preference
    let streakInfo;

    if (useEnhancedStreak) {
      try {
        // Try to get enhanced streak information first
        const journalType = searchParams.get('journalType') || 'step10';
        const enhancedStreak = await getUserStreak(userId, journalType);

        // Format streak info to include both basic and enhanced data
        streakInfo = {
          // Basic streak info for backward compatibility
          currentStreak: enhancedStreak.currentStreak || 0,
          longestStreak: enhancedStreak.longestStreak || 0,
          lastEntryDate: enhancedStreak.lastEntryDate,

          // Enhanced streak data
          streakHealth: enhancedStreak.streakHealth || 'strong',
          totalEntries: enhancedStreak.totalEntries || 0,
          streakFreezes: enhancedStreak.streakFreezes || 0,
          visualProgress: enhancedStreak.visualProgress || { stage: 1, pathPosition: 0, unlockedElements: [] },
          milestones: enhancedStreak.milestones || [],
          recoveryGrace: enhancedStreak.recoveryGrace || { availableRecoveries: 0 },

          // Add flag to indicate this is enhanced data
          isEnhanced: true
        };
      } catch (error) {
        console.error('Error getting enhanced streak info, falling back to basic:', error);
        // Fall back to basic streak info if enhanced fails
        try {
          streakInfo = await getBasicStreakInfo(userId);
          streakInfo.isEnhanced = false;
        } catch (basicStreakError) {
          console.error('Error getting basic streak info:', basicStreakError);
          // Provide default streak info as fallback
          streakInfo = {
            currentStreak: 0,
            longestStreak: 0,
            lastEntryDate: null,
            isEnhanced: false
          };
        }
      }
    } else {
      try {
        // Use basic streak info if requested
        streakInfo = await getBasicStreakInfo(userId);
        streakInfo.isEnhanced = false;
      } catch (basicStreakError) {
        console.error('Error getting basic streak info:', basicStreakError);
        // Provide default streak info as fallback
        streakInfo = {
          currentStreak: 0,
          longestStreak: 0,
          lastEntryDate: null,
          isEnhanced: false
        };
      }
    }

    // Combine all insights
    const insights = {
      moodStats,
      tagStats,
      dayOfWeekStats,
      streakInfo,
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null
      }
    };

    return NextResponse.json({ insights });
  } catch (error) {
    // Provide more detailed error logging
    console.error('Error fetching journal insights:', error);

    // Create appropriate error message based on the type of error
    let errorMessage = 'Failed to retrieve journal insights';
    let statusCode = 500;

    if (error.name === 'MongoServerError' || error.name === 'MongooseError') {
      errorMessage = 'Database connection error';
    } else if (error.message && error.message.includes('Invalid ObjectId')) {
      errorMessage = 'Invalid user ID format';
      statusCode = 400;
    }

    return NextResponse.json(
      { error: errorMessage, details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: statusCode }
    );
  }
}