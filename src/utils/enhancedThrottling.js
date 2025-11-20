'use client';

/**
 * Enhanced message rate limiting utility for Ably
 * Uses more sophisticated rate limiting with per-channel tracking
 * and adaptive backoff to prevent rate limit errors
 */

// Store rate limit counters per channel
const channelCounters = new Map();

// Global counter for overall API usage
let globalMessagesSent = 0;
let globalLastResetTime = Date.now();

// Minimum delay between messages for burst protection (even if under rate limit)
const MIN_MESSAGE_SPACING_MS = 20; // Add small spacing between messages
let lastMessageTime = Date.now();

// Rate limit constants
const CHANNEL_RATE_LIMIT = 30; // Keep well below the 50 limit to provide a larger buffer
const GLOBAL_RATE_LIMIT = 90; // Overall messages across all channels, reduced
const RATE_WINDOW_MS = 1000; // 1 second window
const MAX_RETRY_COUNT = 5; // Increased maximum number of retries for rate-limited requests

// Backoff constants
const BASE_BACKOFF_MS = 150; // Increased small delay
const MAX_BACKOFF_MS = 7000; // Longer maximum wait time

/**
 * Get or create counter for a channel
 * @param {string} channelId - Identifier for the channel
 * @returns {Object} Counter object for the channel
 */
function getChannelCounter(channelId) {
  // Use a default key for undefined channels
  const key = channelId || 'default';

  if (!channelCounters.has(key)) {
    channelCounters.set(key, {
      messagesSent: 0,
      lastResetTime: Date.now(),
      consecutiveErrors: 0, // Track consecutive rate limit errors
    });
  }

  return channelCounters.get(key);
}

/**
 * Reset counters that have passed their time window
 */
function checkAndResetCounters() {
  const now = Date.now();

  // Reset global counter if needed
  if (now - globalLastResetTime > RATE_WINDOW_MS) {
    globalMessagesSent = 0;
    globalLastResetTime = now;
  }

  // Reset channel counters if needed
  channelCounters.forEach((counter, channelId) => {
    if (now - counter.lastResetTime > RATE_WINDOW_MS) {
      counter.messagesSent = 0;
      counter.lastResetTime = now;
      // Don't reset consecutive errors - only reset when a message succeeds
    }
  });
}

/**
 * Calculate exponential backoff time with jitter
 * @param {number} retryCount - Number of retry attempts so far
 * @returns {number} Time in ms to wait before next attempt
 */
function calculateBackoff(retryCount) {
  // Calculate exponential backoff
  const expBackoff = Math.min(
    MAX_BACKOFF_MS,
    BASE_BACKOFF_MS * Math.pow(2, retryCount)
  );

  // Add jitter to prevent thundering herd
  const jitter = Math.random() * expBackoff * 0.2; // 20% jitter

  return expBackoff + jitter;
}

/**
 * Check if sending a message would exceed the rate limit
 * @param {string} channelId - Identifier for the channel
 * @returns {boolean} True if safe to send, false if would exceed limit
 */
export function canSendMessage(channelId) {
  checkAndResetCounters();

  // Check global limit
  if (globalMessagesSent >= GLOBAL_RATE_LIMIT) {
    return false;
  }

  // Check channel-specific limit
  const counter = getChannelCounter(channelId);
  return counter.messagesSent < CHANNEL_RATE_LIMIT;
}

/**
 * Record that a message was sent successfully
 * @param {string} channelId - Identifier for the channel
 */
function recordMessageSent(channelId) {
  checkAndResetCounters();

  // Update global counter
  globalMessagesSent++;

  // Update last message timestamp
  lastMessageTime = Date.now();

  // Update channel counter
  const counter = getChannelCounter(channelId);
  counter.messagesSent++;
  counter.consecutiveErrors = 0; // Reset error count on success
}

/**
 * Record a rate limit error for a channel
 * @param {string} channelId - Identifier for the channel
 */
function recordRateLimitError(channelId) {
  const counter = getChannelCounter(channelId);
  counter.consecutiveErrors++;
}

/**
 * Get time to wait before next message can be sent
 * @param {string} channelId - Identifier for the channel
 * @returns {number} Time in milliseconds to wait
 */
function getTimeToWait(channelId) {
  const now = Date.now();

  // Always enforce minimum spacing between messages regardless of rate limit
  const timeSinceLastMessage = now - lastMessageTime;
  const minSpacingDelay = Math.max(0, MIN_MESSAGE_SPACING_MS - timeSinceLastMessage);

  if (canSendMessage(channelId)) {
    return minSpacingDelay; // Return just the spacing delay if we're under rate limit
  }

  // Calculate time remaining in current window
  const counter = getChannelCounter(channelId);
  const channelTimeElapsed = now - counter.lastResetTime;
  const globalTimeElapsed = now - globalLastResetTime;

  // Use the longer time remaining
  const channelTimeRemaining = Math.max(0, RATE_WINDOW_MS - channelTimeElapsed);
  const globalTimeRemaining = Math.max(0, RATE_WINDOW_MS - globalTimeElapsed);
  const timeRemaining = Math.max(channelTimeRemaining, globalTimeRemaining);

  // Add additional backoff based on consecutive errors
  const additionalBackoff = counter.consecutiveErrors > 0
    ? calculateBackoff(counter.consecutiveErrors - 1)
    : 0;

  // Add all delays together - rate limit delay + error backoff + minimum message spacing + buffer
  return Math.max(timeRemaining + additionalBackoff + 50, minSpacingDelay);
}

/**
 * Enhanced throttled message sender that respects rate limits
 * @param {Function} sendFn - The original message sending function
 * @param {Object} messageData - The message data to send
 * @param {string} channelId - Identifier for the channel (e.g. chat:123)
 * @returns {Promise<Object>} The result from the original send function
 */
export async function enhancedThrottledSend(sendFn, messageData, channelId) {
  let retryCount = 0;

  while (retryCount <= MAX_RETRY_COUNT) {
    // Check if we can send immediately
    if (!canSendMessage(channelId)) {
      // Wait until we can send again
      const waitTime = getTimeToWait(channelId);

      if (retryCount > 0) {
        console.warn(`Rate limit retry #${retryCount} for channel ${channelId}, waiting ${waitTime}ms`);
      } else {
        console.log(`Rate limit reached for channel ${channelId}, delaying message for ${waitTime}ms`);
      }

      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    try {
      // Try to send the message
      const result = await sendFn(messageData);
      // Record success
      recordMessageSent(channelId);
      return result;

    } catch (error) {
      // Check if it's a rate limit error
      if (error.message && error.message.includes('Rate limit exceeded')) {
        recordRateLimitError(channelId);
        retryCount++;

        if (retryCount > MAX_RETRY_COUNT) {
          console.error(`Failed to send message after ${MAX_RETRY_COUNT} retries due to rate limiting`);
          throw error;
        }

        // Continue the loop to retry
      } else {
        // For non-rate-limit errors, throw immediately
        throw error;
      }
    }
  }

  // This should not be reached due to the throw in the loop
  throw new Error('Maximum retries exceeded');
}