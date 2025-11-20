import { NextResponse } from 'next/server';

/**
 * GET /api/test-insights
 * Test endpoint that simulates a successful journal insights response
 */
export async function GET(request) {
  const mockInsights = {
    insights: {
      moodStats: {
        entries: 25,
        avgMood: 3.7,
        moodDistribution: {
          1: 2,
          2: 4,
          3: 6,
          4: 9,
          5: 4
        },
        moodTrend: Array.from({ length: 15 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
          mood: Math.floor(Math.random() * 5) + 1
        }))
      },
      tagStats: [
        { tag: "gratitude", count: 10, avgMood: 4.2 },
        { tag: "progress", count: 8, avgMood: 3.9 },
        { tag: "challenge", count: 5, avgMood: 2.8 }
      ],
      dayOfWeekStats: {
        Sunday: { count: 4, avgMood: 4.1 },
        Monday: { count: 3, avgMood: 3.2 },
        Tuesday: { count: 4, avgMood: 3.5 },
        Wednesday: { count: 3, avgMood: 3.7 },
        Thursday: { count: 4, avgMood: 3.8 },
        Friday: { count: 5, avgMood: 4.0 },
        Saturday: { count: 2, avgMood: 4.2 }
      },
      streakInfo: {
        currentStreak: 7,
        longestStreak: 14,
        lastEntryDate: new Date().toISOString(),
        streakHealth: 'strong',
        totalEntries: 25,
        streakFreezes: 1,
        visualProgress: {
          stage: 2,
          pathPosition: 50,
          unlockedElements: ['path_start', 'tree_sapling']
        },
        milestones: [
          {
            type: 'streak',
            threshold: 3,
            achievedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            title: 'First Steps',
            description: 'You\'ve reflected for 3 days in a row. The journey of recovery begins with consistent self-examination.',
            viewed: true
          },
          {
            type: 'streak',
            threshold: 7,
            achievedAt: new Date().toISOString(),
            title: 'One Week Strong',
            description: 'A full week of daily inventory! Your commitment to honest self-reflection is growing.',
            viewed: false
          }
        ],
        recoveryGrace: {
          availableRecoveries: 1,
          lastRecoveryUsed: null,
          nextRecoveryAt: null
        },
        isEnhanced: true
      },
      dateRange: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      }
    }
  };

  return NextResponse.json(mockInsights);
}