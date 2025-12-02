import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';

/**
 * POST /api/admin/setup-agent-database
 *
 * Sets up the database collections and indexes for the Volunteer Support Agent system
 * This is a one-time setup endpoint that creates:
 * - peer_support_conversations collection with indexes
 * - agent_analyses collection with indexes
 * - crisis_alerts collection with indexes
 * - agent_performance_metrics collection with indexes
 */
export async function POST(request) {
  console.log('🚀 Setting up Agent Database Collections...\n');

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

    const client = await clientPromise;
    const db = client.db('dailyreflections');

    const setupLog = [];

    // ========================================
    // 1. Peer Support Conversations Collection
    // ========================================
    setupLog.push('Setting up peer_support_conversations collection...');

    const conversationsExists = await db.listCollections({ name: 'peer_support_conversations' }).hasNext();

    if (!conversationsExists) {
      await db.createCollection('peer_support_conversations');
      setupLog.push('✅ Created peer_support_conversations collection');
    } else {
      setupLog.push('ℹ️  peer_support_conversations collection already exists');
    }

    // Create indexes for conversations
    await db.collection('peer_support_conversations').createIndexes([
      { key: { userId: 1 }, name: 'userId_idx' },
      { key: { volunteerId: 1 }, name: 'volunteerId_idx' },
      { key: { status: 1 }, name: 'status_idx' },
      { key: { createdAt: -1 }, name: 'createdAt_desc_idx' },
      { key: { userId: 1, status: 1 }, name: 'userId_status_idx' },
      { key: { volunteerId: 1, status: 1 }, name: 'volunteerId_status_idx' },
    ]);
    setupLog.push('✅ Created 6 indexes for peer_support_conversations');

    // ========================================
    // 2. Agent Analyses Collection
    // ========================================
    setupLog.push('Setting up agent_analyses collection...');

    const analysesExists = await db.listCollections({ name: 'agent_analyses' }).hasNext();

    if (!analysesExists) {
      await db.createCollection('agent_analyses');
      setupLog.push('✅ Created agent_analyses collection');
    } else {
      setupLog.push('ℹ️  agent_analyses collection already exists');
    }

    // Create indexes for agent analyses
    await db.collection('agent_analyses').createIndexes([
      { key: { conversationId: 1 }, name: 'conversationId_idx' },
      { key: { volunteerId: 1 }, name: 'volunteerId_idx' },
      { key: { userId: 1 }, name: 'userId_idx' },
      { key: { timestamp: -1 }, name: 'timestamp_desc_idx' },
      { key: { conversationId: 1, timestamp: -1 }, name: 'conversation_timestamp_idx' },
      { key: { 'analysis.crisisDetection.isCrisis': 1 }, name: 'crisis_flag_idx' },
    ]);
    setupLog.push('✅ Created 6 indexes for agent_analyses');

    // ========================================
    // 3. Crisis Alerts Collection
    // ========================================
    setupLog.push('Setting up crisis_alerts collection...');

    const alertsExists = await db.listCollections({ name: 'crisis_alerts' }).hasNext();

    if (!alertsExists) {
      await db.createCollection('crisis_alerts');
      setupLog.push('✅ Created crisis_alerts collection');
    } else {
      setupLog.push('ℹ️  crisis_alerts collection already exists');
    }

    // Create indexes for crisis alerts
    await db.collection('crisis_alerts').createIndexes([
      { key: { conversationId: 1 }, name: 'conversationId_idx' },
      { key: { userId: 1 }, name: 'userId_idx' },
      { key: { volunteerId: 1 }, name: 'volunteerId_idx' },
      { key: { resolved: 1 }, name: 'resolved_idx' },
      { key: { riskLevel: 1 }, name: 'riskLevel_idx' },
      { key: { detectedAt: -1 }, name: 'detectedAt_desc_idx' },
      { key: { resolved: 1, detectedAt: -1 }, name: 'unresolved_recent_idx' },
      { key: { riskLevel: 1, resolved: 1 }, name: 'risk_resolution_idx' },
    ]);
    setupLog.push('✅ Created 8 indexes for crisis_alerts');

    // ========================================
    // 4. Agent Performance Metrics Collection
    // ========================================
    setupLog.push('Setting up agent_performance_metrics collection...');

    const metricsExists = await db.listCollections({ name: 'agent_performance_metrics' }).hasNext();

    if (!metricsExists) {
      await db.createCollection('agent_performance_metrics');
      setupLog.push('✅ Created agent_performance_metrics collection');
    } else {
      setupLog.push('ℹ️  agent_performance_metrics collection already exists');
    }

    // Create indexes for performance metrics
    await db.collection('agent_performance_metrics').createIndexes([
      { key: { date: -1 }, name: 'date_desc_idx' },
      { key: { agentName: 1 }, name: 'agentName_idx' },
      { key: { agentName: 1, date: -1 }, name: 'agent_date_idx', unique: true },
    ]);
    setupLog.push('✅ Created 3 indexes for agent_performance_metrics');

    // ========================================
    // Get Collection Stats
    // ========================================
    const collections = ['peer_support_conversations', 'agent_analyses', 'crisis_alerts', 'agent_performance_metrics'];
    const stats = {};

    for (const collectionName of collections) {
      const count = await db.collection(collectionName).countDocuments();
      stats[collectionName] = count;
    }

    setupLog.push('✅ Database setup complete!');

    console.log(setupLog.join('\n'));

    return NextResponse.json({
      success: true,
      message: 'Agent database setup completed successfully',
      log: setupLog,
      collections: {
        peer_support_conversations: {
          exists: true,
          indexes: 6,
          documents: stats.peer_support_conversations
        },
        agent_analyses: {
          exists: true,
          indexes: 6,
          documents: stats.agent_analyses
        },
        crisis_alerts: {
          exists: true,
          indexes: 8,
          documents: stats.crisis_alerts
        },
        agent_performance_metrics: {
          exists: true,
          indexes: 3,
          documents: stats.agent_performance_metrics
        }
      }
    });

  } catch (error) {
    console.error('❌ Error setting up database:', error);

    return NextResponse.json(
      {
        error: 'Database setup failed',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/setup-agent-database
 *
 * Check the status of agent database collections
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

    if (!session.user.roles?.includes('admin') && !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin role required' },
        { status: 403 }
      );
    }

    const client = await clientPromise;
    const db = client.db('dailyreflections');

    const collections = ['peer_support_conversations', 'agent_analyses', 'crisis_alerts', 'agent_performance_metrics'];
    const status = {};

    for (const collectionName of collections) {
      const exists = await db.listCollections({ name: collectionName }).hasNext();
      const count = exists ? await db.collection(collectionName).countDocuments() : 0;
      const indexes = exists ? await db.collection(collectionName).indexes() : [];

      status[collectionName] = {
        exists,
        documents: count,
        indexCount: indexes.length
      };
    }

    return NextResponse.json({
      status: 'ready',
      collections: status
    });

  } catch (error) {
    console.error('❌ Error checking database status:', error);

    return NextResponse.json(
      {
        error: 'Failed to check database status',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
