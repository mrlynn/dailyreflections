/**
 * Test script for verifying chat message deduplication
 *
 * This script simulates the behavior of the UserChatInterface component
 * to ensure that duplicate messages are correctly filtered out.
 */

// Mock messages data
const mockMessages = [
  {
    _id: '69150cc45283f206bbe5d60e',
    content: 'Hello there!',
    sender_id: '12345',
    sender_type: 'user',
    created_at: new Date().toISOString()
  },
  {
    _id: '69150cc45283f206bbe5d60f',
    content: 'How are you doing today?',
    sender_id: '67890',
    sender_type: 'volunteer',
    created_at: new Date().toISOString()
  },
  {
    _id: '69150cc45283f206bbe5d610',
    content: 'I am doing well, thanks for asking.',
    sender_id: '12345',
    sender_type: 'user',
    created_at: new Date().toISOString()
  },
];

// Simulate duplicate messages that might come from polling
const mockPollingResponse = [
  {
    _id: '69150cc45283f206bbe5d60e', // Duplicate ID
    content: 'Hello there!',
    sender_id: '12345',
    sender_type: 'user',
    created_at: new Date().toISOString()
  },
  {
    _id: '69150cc45283f206bbe5d611',
    content: 'That\'s great to hear!',
    sender_id: '67890',
    sender_type: 'volunteer',
    created_at: new Date().toISOString()
  }
];

/**
 * Test the original implementation (with the bug)
 */
function testOriginalImplementation() {
  console.log('Testing original implementation (with bug):');

  // Initial state
  let messages = [...mockMessages];
  console.log(`Initial message count: ${messages.length}`);

  // Simulate polling (adds all messages including duplicates)
  const updatedMessages = [...messages, ...mockPollingResponse];
  console.log(`After polling (with duplicates): ${updatedMessages.length}`);

  // Check for duplicate IDs
  const messageIds = updatedMessages.map(msg => msg._id);
  const uniqueIds = new Set(messageIds);
  console.log(`Unique message IDs: ${uniqueIds.size}`);

  // Find duplicate IDs
  const duplicateIds = messageIds.filter((id, index) => messageIds.indexOf(id) !== index);
  console.log('Duplicate IDs:', duplicateIds);
}

/**
 * Test the fixed implementation
 */
function testFixedImplementation() {
  console.log('\nTesting fixed implementation:');

  // Initial state
  let messages = [...mockMessages];
  console.log(`Initial message count: ${messages.length}`);

  // Create a Map of existing messages by ID
  const existingMessagesMap = new Map(messages.map(msg => [msg._id, msg]));

  // Add only unique messages not already in the state
  const uniqueNewMessages = mockPollingResponse.filter(newMsg => !existingMessagesMap.has(newMsg._id));

  // Simulate polling (only adds unique messages)
  const updatedMessages = [...messages, ...uniqueNewMessages];
  console.log(`After polling (deduplicated): ${updatedMessages.length}`);

  // Check for duplicate IDs
  const messageIds = updatedMessages.map(msg => msg._id);
  const uniqueIds = new Set(messageIds);
  console.log(`Unique message IDs: ${uniqueIds.size}`);

  // Verify no duplicates
  const duplicateIds = messageIds.filter((id, index) => messageIds.indexOf(id) !== index);
  console.log('Duplicate IDs:', duplicateIds);
}

// Run the tests
console.log('=== Chat Message Deduplication Test ===\n');
testOriginalImplementation();
testFixedImplementation();