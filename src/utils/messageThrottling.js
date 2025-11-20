'use client';

/**
 * Message rate limiting utility for Ably
 * Helps prevent hitting Ably's rate limits for publishing messages
 */

// Track the number of messages sent in the current time window
let messagesSent = 0;

// Track the last reset time
let lastResetTime = Date.now();

// Rate limit constants
const RATE_LIMIT = 45; // Keep below the 50 limit to provide buffer
const RATE_WINDOW_MS = 1000; // 1 second window

/**
 * Reset the message counter if the rate window has passed
 */
function checkAndResetCounter() {
  const now = Date.now();
  if (now - lastResetTime > RATE_WINDOW_MS) {
    messagesSent = 0;
    lastResetTime = now;
  }
}

/**
 * Check if sending a message would exceed the rate limit
 * @returns {boolean} True if safe to send, false if would exceed limit
 */
export function canSendMessage() {
  checkAndResetCounter();
  return messagesSent < RATE_LIMIT;
}

/**
 * Record that a message was sent
 */
export function recordMessageSent() {
  checkAndResetCounter();
  messagesSent++;
}

/**
 * Get time to wait before next message can be sent
 * @returns {number} Time in milliseconds to wait, or 0 if can send now
 */
export function getTimeToWait() {
  if (canSendMessage()) return 0;

  // Calculate time remaining in current window
  const now = Date.now();
  const timeElapsed = now - lastResetTime;
  const timeRemaining = Math.max(0, RATE_WINDOW_MS - timeElapsed);

  return timeRemaining + 50; // Add small buffer
}

/**
 * Throttled message sender that respects rate limits
 * @param {Function} sendFn - The original message sending function
 * @param {Object} messageData - The message data to send
 * @returns {Promise<Object>} The result from the original send function
 */
export async function throttledSendMessage(sendFn, messageData) {
  // Check if we can send immediately
  if (!canSendMessage()) {
    // Wait until next rate window before sending
    const waitTime = getTimeToWait();
    console.log(`Rate limit reached, delaying message for ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  try {
    // Record that we're sending a message
    recordMessageSent();
    // Send the message using the provided function
    return await sendFn(messageData);
  } catch (error) {
    // If the error is a rate limit error, wait and retry once
    if (error.message && error.message.includes('Rate limit exceeded')) {
      console.warn('Rate limit error occurred, retrying after delay');
      await new Promise(resolve => setTimeout(resolve, getTimeToWait()));
      recordMessageSent(); // Record the retry
      return await sendFn(messageData);
    }
    throw error;
  }
}