# Ably Rate Limit Handling

This document explains how rate limiting is implemented for Ably real-time messaging in the Daily Reflections application.

## Rate Limit Problem

Ably enforces rate limits on message publishing:
- 50 messages per second per channel
- Overall account-wide limits

When these limits are exceeded, Ably returns errors like:
```
Rate limit exceeded; request rejected (nonfatal); metric = channel.maxRate; permitted rate = 50; current rate = 53
```

These errors can disrupt the chat experience and prevent messages from being delivered.

## Solution: Enhanced Throttling

The application implements a sophisticated rate limiting solution in `src/utils/enhancedThrottling.js` that:

1. Tracks message rates per channel and globally
2. Enforces rate limits below Ably's thresholds
3. Delays messages when necessary
4. Implements retry logic with exponential backoff
5. Prevents message bursts with minimum spacing

### Key Components

#### Rate Limiting Parameters

```javascript
// Rate limit constants
const CHANNEL_RATE_LIMIT = 30;     // Messages per second per channel (Ably limit: 50)
const GLOBAL_RATE_LIMIT = 90;      // Total messages per second across all channels
const RATE_WINDOW_MS = 1000;       // 1 second window for counting messages
const MAX_RETRY_COUNT = 5;         // Maximum number of retries for rate-limited requests
const MIN_MESSAGE_SPACING_MS = 20; // Minimum time between messages to prevent bursts
```

#### Per-Channel Tracking

Messages are tracked per channel and globally to ensure neither limit is exceeded:

```javascript
// Check if sending would exceed limits
function canSendMessage(channelId) {
  // Check global limit
  if (globalMessagesSent >= GLOBAL_RATE_LIMIT) {
    return false;
  }

  // Check channel-specific limit
  const counter = getChannelCounter(channelId);
  return counter.messagesSent < CHANNEL_RATE_LIMIT;
}
```

#### Adaptive Delay Calculation

When limits are approached, the system calculates appropriate delays:

```javascript
function getTimeToWait(channelId) {
  // Always enforce minimum spacing between messages
  const timeSinceLastMessage = now - lastMessageTime;
  const minSpacingDelay = Math.max(0, MIN_MESSAGE_SPACING_MS - timeSinceLastMessage);

  // If within rate limits, just enforce minimum spacing
  if (canSendMessage(channelId)) {
    return minSpacingDelay;
  }

  // Calculate additional delays based on rate limits and error history
  // ...
}
```

#### Exponential Backoff

For consecutive errors, the system implements exponential backoff:

```javascript
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
```

### Usage in Components

Components use the enhanced throttling via the `enhancedThrottledSend` function:

```javascript
import { enhancedThrottledSend } from '@/utils/enhancedThrottling';

// In a React component or hook:
const sendMessage = async (messageData) => {
  return await enhancedThrottledSend(
    async (data) => {
      return await channel.publish('chat-message', data);
    },
    messageData,
    channelName // Pass the channel name for per-channel rate limiting
  );
};
```

## Recent Improvements

Based on observed rate limit errors, we've made several improvements:

1. **More Conservative Rate Limits**:
   - Reduced per-channel limit from 40 to 30 messages/sec
   - Reduced global limit from 100 to 90 messages/sec

2. **Minimum Message Spacing**:
   - Added enforced 20ms minimum delay between messages
   - Prevents message bursts that can trigger rate limits

3. **Enhanced Retry Handling**:
   - Increased max retries from 3 to 5
   - Longer initial backoff (150ms instead of 100ms)
   - Longer maximum backoff (7000ms instead of 5000ms)

## Monitoring and Troubleshooting

When debugging rate limit issues:

1. Check browser console for log messages like:
   ```
   Rate limit reached for channel chat:123, delaying message for 250ms
   ```

2. Look for Ably error messages in the console:
   ```
   Rate limit exceeded; request rejected (nonfatal); metric = channel.maxRate
   ```

3. If rate limits are still being hit, consider:
   - Further reducing `CHANNEL_RATE_LIMIT` value
   - Increasing `MIN_MESSAGE_SPACING_MS` value
   - Adding additional rate controls at the UI level to prevent rapid message sending

## Future Improvements

Potential future enhancements:

1. Client-side message batching for high-frequency events
2. Server-side rate limit monitoring and alerts
3. Adaptive rate limiting that adjusts based on observed error rates
4. UI indicators when messages are being delayed due to rate limiting