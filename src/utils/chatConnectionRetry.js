'use client';

/**
 * Utility for handling Ably chat connection retries and recovery
 * Helps manage connection failures and presence issues
 */

// Maximum number of retries before giving up
const MAX_RETRIES = 5;

// Base delay between retries in milliseconds (will be multiplied by retry attempt)
const BASE_RETRY_DELAY = 1000;

/**
 * Attempt to enter presence on a channel with exponential backoff retries
 * @param {Object} channel - Ably channel object
 * @param {Object} presenceData - Data to send with presence
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<boolean>} - True if successful, false if failed after retries
 */
export async function retryEnterPresence(channel, presenceData = { status: 'active' }, maxRetries = MAX_RETRIES) {
  let retryCount = 0;
  let success = false;

  while (retryCount < maxRetries && !success) {
    try {
      // If this isn't the first attempt, wait with exponential backoff
      if (retryCount > 0) {
        const delay = BASE_RETRY_DELAY * Math.pow(2, retryCount - 1);
        console.log(`Retrying presence enter (attempt ${retryCount + 1}/${maxRetries}) after ${delay}ms delay`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Attempt to enter presence
      await channel.presence.enter(presenceData);
      console.log('Successfully entered presence after', retryCount > 0 ? `${retryCount} retries` : 'first attempt');
      success = true;

    } catch (error) {
      retryCount++;
      console.error(`Presence enter failed (attempt ${retryCount}/${maxRetries}):`, error);

      // If this was our last attempt, propagate the error
      if (retryCount >= maxRetries) {
        console.error('Maximum retries reached for presence enter');
      }
    }
  }

  return success;
}

/**
 * Verify the Ably connection is healthy and attempt reconnection if needed
 * @param {Object} ablyClient - Ably client object
 * @returns {Promise<boolean>} - True if connected or reconnection successful
 */
export async function ensureAblyConnection(ablyClient) {
  if (!ablyClient) return false;

  // Check if already connected
  if (ablyClient.connection.state === 'connected') {
    return true;
  }

  // If connecting, wait for connection
  if (ablyClient.connection.state === 'connecting') {
    try {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          ablyClient.connection.off('connected');
          reject(new Error('Connection timeout'));
        }, 5000);

        ablyClient.connection.once('connected', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
      return true;
    } catch (error) {
      console.error('Connection timeout waiting for Ably:', error);
    }
  }

  // If disconnected, failed, suspended, or closed - try to reconnect
  if (['disconnected', 'suspended', 'failed', 'closed'].includes(ablyClient.connection.state)) {
    try {
      console.log('Attempting to reconnect Ably client');
      await ablyClient.connection.connect();

      // Wait for connection to establish
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          ablyClient.connection.off('connected');
          reject(new Error('Reconnection timeout'));
        }, 5000);

        ablyClient.connection.once('connected', () => {
          clearTimeout(timeout);
          resolve();
        });
      });

      console.log('Successfully reconnected Ably client');
      return true;
    } catch (error) {
      console.error('Failed to reconnect Ably client:', error);
      return false;
    }
  }

  return false;
}

/**
 * Get a helpful error message for chat connection issues
 * @param {Error} error - The original error
 * @returns {string} User-friendly error message
 */
export function getChatConnectionErrorMessage(error) {
  if (!error) return 'Unknown connection error';

  const errorString = error.toString().toLowerCase();

  if (errorString.includes('token')) {
    return 'Authentication error - please try refreshing the page';
  } else if (errorString.includes('presence') || errorString.includes('permission')) {
    return 'Permission error - you may not have access to this chat';
  } else if (errorString.includes('timeout') || errorString.includes('network')) {
    return 'Network connection error - please check your internet connection';
  } else if (errorString.includes('rate limit')) {
    return 'Rate limit exceeded - please wait a moment before trying again';
  }

  return 'Connection error - please try refreshing the page';
}