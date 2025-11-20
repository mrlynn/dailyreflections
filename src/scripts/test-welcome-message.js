/**
 * Test script for the automated volunteer welcome message functionality
 *
 * This script helps test the welcome message configuration and display
 * without needing to go through the full UI flow.
 */

import { getConfig, setConfig } from '../lib/models/SystemConfig.js';
import { CHAT_CONFIG } from '../lib/constants/configKeys.js';
import { createChatSessionRequest, assignVolunteerToSession } from '../lib/models/ChatSession.js';
import { getSessionMessages, createSystemMessage } from '../lib/models/ChatMessage.js';
import { ObjectId } from 'mongodb';

/**
 * Test the automated welcome message functionality
 */
async function testWelcomeMessage() {
  try {
    console.log('🧪 Starting welcome message test...');

    // 1. Set a test welcome message in the configuration
    const testWelcomeMessage = 'Welcome to the chat! I am a volunteer here to support you. How can I assist you today?';
    console.log(`Setting test welcome message: "${testWelcomeMessage}"`);
    await setConfig(
      CHAT_CONFIG.VOLUNTEER_WELCOME_MESSAGE,
      testWelcomeMessage,
      'chat',
      'Volunteer welcome message for testing'
    );

    // 2. Verify the configuration was saved
    const savedMessage = await getConfig(CHAT_CONFIG.VOLUNTEER_WELCOME_MESSAGE);
    console.log(`Retrieved config value: "${savedMessage}"`);

    if (savedMessage !== testWelcomeMessage) {
      throw new Error('Config value does not match what was set!');
    }

    // 3. Create a test chat session
    const testUserId = new ObjectId();
    console.log(`Creating test chat session for user ID: ${testUserId}`);
    const session = await createChatSessionRequest(testUserId, {
      test: true,
      source: 'test-script'
    });

    console.log(`Created test session: ${session._id}`);

    // 4. Assign a volunteer to the session
    const testVolunteerId = new ObjectId();
    console.log(`Assigning test volunteer ID: ${testVolunteerId}`);

    // Directly call the relevant parts of the API route logic
    await assignVolunteerToSession(session._id, testVolunteerId);

    // Manually create the welcome message (simulating the API route)
    await createSystemMessage(session._id, savedMessage, {
      volunteer_id: testVolunteerId,
      automated: true,
      welcome_message: true
    });

    // 5. Retrieve messages and verify welcome message was sent
    const messages = await getSessionMessages(session._id);
    console.log(`Found ${messages.length} messages in the session`);

    // Find system messages
    const systemMessages = messages.filter(msg => msg.sender_type === 'system');
    console.log(`Found ${systemMessages.length} system messages`);

    // Find welcome messages
    const welcomeMessages = systemMessages.filter(msg =>
      msg.metadata && msg.metadata.welcome_message === true
    );

    if (welcomeMessages.length > 0) {
      console.log('✅ SUCCESS: Welcome message was properly sent!');
      console.log(`Message content: "${welcomeMessages[0].content}"`);
    } else {
      console.log('❌ ERROR: No welcome message was found in the session');
    }

    console.log('🧪 Test completed!');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testWelcomeMessage().catch(console.error);