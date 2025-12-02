/**
 * Database Setup Script for Volunteer Support Agent System
 *
 * Creates required MongoDB collections and indexes for:
 * - Peer support conversations
 * - Agent analyses
 * - Crisis alerts
 * - Agent performance metrics
 */

import clientPromise from '../src/lib/mongodb.js';

async function setupAgentDatabase() {
  console.log('🚀 Setting up Agent Database Collections...\n');

  try {
    const client = await clientPromise;
    const db = client.db('dailyreflections');

    // ========================================
    // 1. Peer Support Conversations Collection
    // ========================================
    console.log('📋 Setting up peer_support_conversations collection...');

    const conversationsExists = await db.listCollections({ name: 'peer_support_conversations' }).hasNext();

    if (!conversationsExists) {
      await db.createCollection('peer_support_conversations');
      console.log('✅ Created peer_support_conversations collection');
    } else {
      console.log('ℹ️  peer_support_conversations collection already exists');
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
    console.log('✅ Created indexes for peer_support_conversations\n');

    // ========================================
    // 2. Agent Analyses Collection
    // ========================================
    console.log('📊 Setting up agent_analyses collection...');

    const analysesExists = await db.listCollections({ name: 'agent_analyses' }).hasNext();

    if (!analysesExists) {
      await db.createCollection('agent_analyses');
      console.log('✅ Created agent_analyses collection');
    } else {
      console.log('ℹ️  agent_analyses collection already exists');
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
    console.log('✅ Created indexes for agent_analyses\n');

    // ========================================
    // 3. Crisis Alerts Collection
    // ========================================
    console.log('🚨 Setting up crisis_alerts collection...');

    const alertsExists = await db.listCollections({ name: 'crisis_alerts' }).hasNext();

    if (!alertsExists) {
      await db.createCollection('crisis_alerts');
      console.log('✅ Created crisis_alerts collection');
    } else {
      console.log('ℹ️  crisis_alerts collection already exists');
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
    console.log('✅ Created indexes for crisis_alerts\n');

    // ========================================
    // 4. Agent Performance Metrics Collection
    // ========================================
    console.log('📈 Setting up agent_performance_metrics collection...');

    const metricsExists = await db.listCollections({ name: 'agent_performance_metrics' }).hasNext();

    if (!metricsExists) {
      await db.createCollection('agent_performance_metrics');
      console.log('✅ Created agent_performance_metrics collection');
    } else {
      console.log('ℹ️  agent_performance_metrics collection already exists');
    }

    // Create indexes for performance metrics
    await db.collection('agent_performance_metrics').createIndexes([
      { key: { date: -1 }, name: 'date_desc_idx' },
      { key: { agentName: 1 }, name: 'agentName_idx' },
      { key: { agentName: 1, date: -1 }, name: 'agent_date_idx', unique: true },
    ]);
    console.log('✅ Created indexes for agent_performance_metrics\n');

    // ========================================
    // Insert Sample Data (for testing)
    // ========================================
    console.log('📝 Checking for sample data...');

    const sampleConversationCount = await db.collection('peer_support_conversations').countDocuments();

    if (sampleConversationCount === 0) {
      console.log('Creating sample conversation for testing...');

      await db.collection('peer_support_conversations').insertOne({
        _id: 'test-conversation-001',
        userId: 'test-user-001',
        volunteerId: null,
        status: 'waiting',
        messages: [
          {
            from: 'test-user-001',
            content: "I'm struggling with cravings today. It's been really hard.",
            timestamp: new Date(),
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log('✅ Created sample conversation\n');
    } else {
      console.log('ℹ️  Sample data already exists\n');
    }

    // ========================================
    // Summary
    // ========================================
    console.log('✨ Database Setup Complete!\n');
    console.log('📊 Collections Created:');
    console.log('  ✓ peer_support_conversations (6 indexes)');
    console.log('  ✓ agent_analyses (6 indexes)');
    console.log('  ✓ crisis_alerts (8 indexes)');
    console.log('  ✓ agent_performance_metrics (3 indexes)\n');

    // Show collection stats
    console.log('📈 Collection Stats:');
    const collections = ['peer_support_conversations', 'agent_analyses', 'crisis_alerts', 'agent_performance_metrics'];

    for (const collectionName of collections) {
      const count = await db.collection(collectionName).countDocuments();
      console.log(`  ${collectionName}: ${count} documents`);
    }

    console.log('\n✅ All done! Agent database is ready.');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the setup
setupAgentDatabase();
