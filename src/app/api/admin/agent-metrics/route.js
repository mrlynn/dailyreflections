import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';

/**
 * GET /api/admin/agent-metrics
 *
 * Returns comprehensive metrics for the Volunteer Support Agent system
 *
 * Query Parameters:
 * - range: Time range for metrics (24h, 7d, 30d, 90d)
 *
 * Response:
 * {
 *   totalExecutions: number,
 *   crisisAlertsCount: number,
 *   avgProcessingTime: number,
 *   successRate: number,
 *   executionTimeline: [...],
 *   agentDistribution: [...],
 *   processingTimesByAgent: [...],
 *   recentAnalyses: [...],
 *   unresolvedCrises: [...]
 * }
 */
export async function GET(request) {
  try {
    // Authenticate admin
    const session = await getSession(request);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Check for admin role or isAdmin flag
    if (!session.user.roles?.includes('admin') && !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin role required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';

    // Calculate date range
    const now = new Date();
    const startDate = new Date();

    switch (range) {
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    console.log(`📊 Loading agent metrics for range: ${range} (${startDate.toISOString()} to ${now.toISOString()})`);

    // Connect to database
    const client = await clientPromise;
    const db = client.db('dailyreflections');

    // ========================================
    // 1. Total Executions
    // ========================================
    const totalExecutions = await db.collection('agent_analyses').countDocuments({
      timestamp: { $gte: startDate, $lte: now }
    });

    // ========================================
    // 2. Crisis Alerts Count
    // ========================================
    const crisisAlertsCount = await db.collection('crisis_alerts').countDocuments({
      detectedAt: { $gte: startDate, $lte: now }
    });

    // ========================================
    // 3. Average Processing Time
    // ========================================
    const avgProcessingTimeResult = await db.collection('agent_analyses').aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$processingTimeMs' }
        }
      }
    ]).toArray();

    const avgProcessingTime = avgProcessingTimeResult.length > 0
      ? Math.round(avgProcessingTimeResult[0].avgTime)
      : 0;

    // ========================================
    // 4. Success Rate (analyses without errors)
    // ========================================
    const totalAnalyses = await db.collection('agent_analyses').countDocuments({
      timestamp: { $gte: startDate, $lte: now }
    });

    const failedAnalyses = await db.collection('agent_analyses').countDocuments({
      timestamp: { $gte: startDate, $lte: now },
      error: { $exists: true }
    });

    const successRate = totalAnalyses > 0
      ? (totalAnalyses - failedAnalyses) / totalAnalyses
      : 1;

    // ========================================
    // 5. Execution Timeline
    // ========================================
    const executionTimelineResult = await db.collection('agent_analyses').aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: now }
        }
      },
      {
        $project: {
          date: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          isCrisis: '$analysis.crisisDetection.isCrisis'
        }
      },
      {
        $group: {
          _id: '$date',
          executions: { $sum: 1 },
          crises: {
            $sum: { $cond: ['$isCrisis', 1, 0] }
          }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          executions: 1,
          crises: 1
        }
      }
    ]).toArray();

    const executionTimeline = executionTimelineResult;

    // ========================================
    // 6. Agent Distribution
    // ========================================
    const agentDistributionResult = await db.collection('agent_analyses').aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: now }
        }
      },
      {
        $unwind: '$agentExecutionPath'
      },
      {
        $group: {
          _id: '$agentExecutionPath',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          value: '$count'
        }
      }
    ]).toArray();

    const agentDistribution = agentDistributionResult;

    // ========================================
    // 7. Processing Times by Agent
    // ========================================
    const processingTimesByAgentResult = await db.collection('agent_performance_metrics').aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: '$agentName',
          totalTime: { $sum: '$totalProcessingTime' },
          totalExecutions: { $sum: '$executions' }
        }
      },
      {
        $project: {
          _id: 0,
          agentName: '$_id',
          avgTime: {
            $round: [{ $divide: ['$totalTime', '$totalExecutions'] }, 0]
          }
        }
      },
      {
        $sort: { avgTime: -1 }
      }
    ]).toArray();

    const processingTimesByAgent = processingTimesByAgentResult;

    // ========================================
    // 8. Recent Analyses
    // ========================================
    const recentAnalyses = await db.collection('agent_analyses')
      .find({
        timestamp: { $gte: startDate, $lte: now }
      })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    // ========================================
    // 9. Unresolved Crisis Alerts
    // ========================================
    const unresolvedCrises = await db.collection('crisis_alerts')
      .find({
        resolved: false,
        detectedAt: { $gte: startDate, $lte: now }
      })
      .sort({ detectedAt: -1 })
      .limit(20)
      .toArray();

    // ========================================
    // Return Metrics
    // ========================================
    const metrics = {
      totalExecutions,
      crisisAlertsCount,
      avgProcessingTime,
      successRate,
      executionTimeline,
      agentDistribution,
      processingTimesByAgent,
      recentAnalyses: recentAnalyses.map(analysis => ({
        timestamp: analysis.timestamp,
        conversationId: analysis.conversationId,
        agentExecutionPath: analysis.agentExecutionPath,
        processingTimeMs: analysis.processingTimeMs,
        analysis: {
          crisisDetection: analysis.analysis?.crisisDetection
        }
      })),
      unresolvedCrises: unresolvedCrises.map(crisis => ({
        detectedAt: crisis.detectedAt,
        conversationId: crisis.conversationId,
        riskLevel: crisis.riskLevel,
        indicators: crisis.indicators,
        recommendedAction: crisis.recommendedAction
      })),
    };

    console.log(`✅ Metrics loaded successfully`);
    console.log(`📊 Total executions: ${totalExecutions}`);
    console.log(`🚨 Crisis alerts: ${crisisAlertsCount}`);
    console.log(`⏱️  Avg processing time: ${avgProcessingTime}ms`);

    return NextResponse.json(metrics);

  } catch (error) {
    console.error('❌ Error loading agent metrics:', error);

    return NextResponse.json(
      {
        error: 'Failed to load metrics',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
