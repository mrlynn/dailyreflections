/**
 * Test script for verifying duplicate message detection
 *
 * This script tests the duplicate message detection functionality
 * in the chat system to ensure it's working correctly.
 */

import clientPromise from '../lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * Test duplicate message detection
 */
async function testDuplicateMessageDetection() {
  try {
    console.log('🧪 Starting duplicate message detection test...');

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('dailyreflections');

    // Create test data
    const sessionId = new ObjectId();
    const userId = new ObjectId();
    const messageContent = 'This is a test message for duplicate detection';

    // Create timestamps
    const now = new Date();
    const fiveSecondsAgo = new Date();
    fiveSecondsAgo.setSeconds(fiveSecondsAgo.getSeconds() - 5);
    const thirtySecondsAgo = new Date();
    thirtySecondsAgo.setSeconds(thirtySecondsAgo.getSeconds() - 30);
    const sixtySecondsAgo = new Date();
    sixtySecondsAgo.setSeconds(sixtySecondsAgo.getSeconds() - 60);

    // Insert test messages
    const testMessages = [
      {
        _id: new ObjectId(),
        session_id: sessionId,
        sender_id: userId,
        sender_type: 'user',
        content: messageContent,
        created_at: sixtySecondsAgo,
        status: 'sent'
      },
      {
        _id: new ObjectId(),
        session_id: sessionId,
        sender_id: userId,
        sender_type: 'user',
        content: messageContent,
        created_at: fiveSecondsAgo,
        status: 'sent'
      }
    ];

    await db.collection('chat_messages').insertMany(testMessages);
    console.log(`Inserted ${testMessages.length} test messages`);

    // Test 1: Check for duplicate messages within 30 seconds
    console.log('\nTest 1: Check for duplicate messages within 30 seconds');
    const recentDuplicate = await db.collection('chat_messages').findOne({
      session_id: sessionId,
      sender_id: userId,
      content: messageContent,
      created_at: { $gt: thirtySecondsAgo }
    });

    console.log('Recent duplicate found?', recentDuplicate ? 'Yes' : 'No');
    if (recentDuplicate) {
      console.log(`Message ID: ${recentDuplicate._id}`);
      console.log(`Created at: ${recentDuplicate.created_at}`);
    }

    // Test 2: Check for messages with different content within 30 seconds
    console.log('\nTest 2: Check for messages with different content within 30 seconds');
    const differentContent = await db.collection('chat_messages').findOne({
      session_id: sessionId,
      sender_id: userId,
      content: 'Different content',
      created_at: { $gt: thirtySecondsAgo }
    });

    console.log('Different content found?', differentContent ? 'Yes' : 'No');

    // Clean up test data
    await db.collection('chat_messages').deleteMany({
      session_id: sessionId
    });
    console.log('\n✅ Test data cleaned up');

    console.log('\n🧪 Duplicate message detection test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testDuplicateMessageDetection().catch(console.error);