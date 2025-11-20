/**
 * Test script to verify that chat session isolation works correctly
 *
 * This script tests:
 * 1. Creating a new chat session
 * 2. Retrieving messages from both endpoints (user and volunteer)
 * 3. Verifying that both endpoints return the same messages
 */

import { ObjectId } from 'mongodb';
import clientPromise from './src/lib/mongodb.js';
import { createChatSessionRequest } from './src/lib/models/ChatSession.js';
import { createChatMessage, getSessionMessages } from './src/lib/models/ChatMessage.js';

// Test configuration
const userId = new ObjectId(); // Mock user ID
const volunteerId = new ObjectId(); // Mock volunteer ID
const testMessage = "This is a test message";

// Test function
async function testChatIsolation() {
  console.log("Starting chat isolation test...");
  console.log("-------------------------------");

  try {
    // 1. Create a new chat session
    console.log("Creating new chat session...");
    const session = await createChatSessionRequest(userId);
    console.log(`New session created with ID: ${session._id}`);
    console.log(`Session key: ${session.session_key}`);

    // 2. Assign the volunteer to the session
    console.log("\nAssigning volunteer to session...");
    const client = await clientPromise;
    const db = client.db('dailyreflections');

    await db.collection('chat_sessions').updateOne(
      { _id: session._id },
      {
        $set: {
          volunteer_id: volunteerId,
          status: 'active'
        }
      }
    );
    console.log("Volunteer assigned successfully");

    // 3. Add a test message
    console.log("\nAdding test message...");
    const message = await createChatMessage({
      session_id: session._id,
      sender_id: userId,
      sender_type: 'user',
      content: testMessage
    });
    console.log(`Message added with ID: ${message._id}`);

    // 4. Test user endpoint (simulated) - using getSessionMessages directly
    console.log("\nTesting user endpoint (getSessionMessages)...");
    const userMessages = await getSessionMessages(session._id);
    console.log(`User messages count: ${userMessages.length}`);
    if (userMessages.length > 0) {
      console.log(`First message content: ${userMessages[0].content}`);
      console.log(`Message has session_key: ${userMessages[0].session_key === session.session_key}`);
    }

    // 5. Test volunteer endpoint (simulated) - directly querying without session_key
    console.log("\nTesting volunteer endpoint (direct DB query)...");
    const volunteerMessages = await db.collection('chat_messages')
      .find({ session_id: session._id })
      .sort({ created_at: 1 })
      .toArray();

    console.log(`Volunteer messages count: ${volunteerMessages.length}`);
    if (volunteerMessages.length > 0) {
      console.log(`First message content: ${volunteerMessages[0].content}`);
      console.log(`Message has session_key: ${volunteerMessages[0].session_key === session.session_key}`);
    }

    // 6. Verify results
    console.log("\nVerification results:");
    const userMsgCount = userMessages.length;
    const volMsgCount = volunteerMessages.length;

    console.log(`User messages count: ${userMsgCount}`);
    console.log(`Volunteer messages count: ${volMsgCount}`);

    // Check if message counts match
    if (userMsgCount !== volMsgCount) {
      console.log("\n⚠️ ISSUE DETECTED: Message counts do not match!");
      console.log(`User sees ${userMsgCount} messages, volunteer would see ${volMsgCount} messages`);

      // Print additional messages that volunteer would see but user wouldn't
      if (volMsgCount > userMsgCount) {
        console.log("\nMessages volunteer would see that user wouldn't:");
        const extraMessages = volunteerMessages.filter(volMsg =>
          !userMessages.some(userMsg => userMsg._id.toString() === volMsg._id.toString())
        );

        extraMessages.forEach(msg => {
          console.log(`- Message from ${msg.sender_type}: "${msg.content}"`);
          console.log(`  Created at: ${msg.created_at}`);
          console.log(`  Has session_key: ${msg.session_key ? 'Yes' : 'No'}`);
          if (msg.session_key) {
            console.log(`  Session key matches: ${msg.session_key === session.session_key ? 'Yes' : 'No'}`);
          }
          console.log('');
        });
      }
    } else {
      console.log("✅ SUCCESS: Message counts match!");
    }

    console.log("\nTest completed successfully.");
  } catch (error) {
    console.error("Error during test:", error);
  }
}

// Run the test
testChatIsolation().then(() => {
  console.log("Exiting test script...");
  process.exit(0);
}).catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});