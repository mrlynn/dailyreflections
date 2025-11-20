# Real-time Chat Implementation with Ably

This document provides an overview of the real-time chat implementation using Ably in the Daily Reflections application.

## Overview

The existing chat system has been enhanced to use Ably for real-time messaging instead of polling-based updates. This implementation provides:

1. Instant message delivery between users and volunteers
2. Presence awareness (typing indicators, online status)
3. More reliable message delivery
4. Reduced server load (no continuous polling)

## Dependencies

The implementation requires the following dependencies:

```bash
# Main Ably SDK
npm install ably
```

### Import Changes

Note that in recent versions of the Ably SDK, the import structure has changed:

```javascript
// Old import (deprecated)
import Ably from "ably/promises";

// New import (current)
import * as Ably from "ably";
```

When initializing the client, the syntax has also changed:

```javascript
// Old initialization (deprecated)
const client = new Ably.Rest(process.env.ABLY_API_KEY);

// New initialization (current)
const client = new Ably.Rest({ key: process.env.ABLY_API_KEY });
```

## Architecture

The real-time chat system is built with the following components:

### Core Components

1. **Ably Authentication API** (`/src/app/api/ably/token/route.js`)
   - Securely provides tokens for client authentication
   - Configures channel permissions based on user roles
   - Uses the Ably SDK to create token requests for client-side authentication

2. **Ably Context Provider** (`/src/lib/ablyContext.js`)
   - Manages Ably client instance throughout the application
   - Handles connection state and reconnection
   - Provides hooks for accessing the Ably client

3. **Chat Hooks**
   - `useChatChannel.js` - Hook for managing chat channel subscriptions
   - `useChatPresence.js` - Hook for managing presence state (online/typing)

4. **Chat UI Components**
   - `ChatContainer.js` - Main container for chat functionality
   - `ChatMessagesPanel.js` - Displays messages and handles scrolling
   - `ChatMessageItem.js` - Renders individual messages
   - `ChatInput.js` - Input field for sending messages

### Integration Points

1. **User Interface**
   - `RealtimeUserChatInterface.js` - For user chat
   - `RealtimeVolunteerChat.js` - For volunteer chat

2. **Pages**
   - `/chat/[id]/page.js` - User chat page
   - `/volunteer/chat/[id]/page.js` - Volunteer chat page
   - `/chat-test/page.js` - Test page for real-time functionality

## Usage

### Feature Flag

The implementation includes a feature flag to easily switch between the old polling-based system and the new real-time system:

```javascript
// In src/app/chat/[id]/page.js and src/app/volunteer/chat/[id]/page.js
const USE_ABLY_REALTIME = true; // Set to false to use the old system
```

### Testing

A test page is available at `/chat-test` to verify real-time functionality:

1. Open the page in multiple browser tabs
2. Join presence in each tab
3. Send messages and observe real-time updates
4. Try different channels to test isolation
5. Close tabs to see presence updates

## Channel Structure

Ably channels are organized as follows:

- **`chat:{sessionId}`** - Main channel for each chat session
- **`user:{userId}`** - Personal channel for user-specific notifications

## Security

- Users can only access channels they have permission for
- Tokens are generated with specific capabilities based on user role
- Authentication is handled through the Next.js session system

## Implementation Details

### 1. Connection Reliability

The application includes robust error handling and reconnection mechanisms to ensure reliable real-time communication:

```javascript
// Example of the connection retry utility
import { retryEnterPresence, ensureAblyConnection } from '@/utils/chatConnectionRetry';

// Ensure Ably connection is established before proceeding
const connected = await ensureAblyConnection(ablyClient);

// Attempt to enter presence with automatic retries
const success = await retryEnterPresence(channel, { status: 'active' });
```

These utilities provide:
- Automatic reconnection attempts with exponential backoff
- Presence recovery for unstable connections
- User-friendly error messages
- Manual reconnection options in the UI

### 2. Message Throttling

The application includes rate limiting for Ably messages to prevent hitting the Ably service limits:

```javascript
// Example usage of message throttling
import { throttledSendMessage } from '@/utils/messageThrottling';

// Send a message with throttling
await throttledSendMessage(
  async (data) => {
    return await channel.publish('chat-message', data);
  },
  messageData
);
```

This utility:
- Tracks the number of messages sent in a 1-second window
- Ensures we stay under the 50 messages per second Ably limit
- Automatically delays messages when necessary
- Handles retries for rate limit errors

### 2. Client Initialization

The Ably client is initialized in the `AblyProvider` component when a user is authenticated:

```javascript
// Create auth callback function for token authentication
const authCallback = async (tokenParams, callback) => {
  try {
    const response = await fetch('/api/ably/token', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const error = await response.text();
      callback(new Error(`Authentication error: ${error}`), null);
      return;
    }

    const tokenDetails = await response.json();
    callback(null, tokenDetails);
  } catch (error) {
    callback(error, null);
  }
};

// Initialize Ably client with token authentication
const ablyClient = new Ably.Realtime({
  authCallback,
  clientId: session.user.id,
});
```

### 2. Channel Subscription

```javascript
// Using the useChatChannel hook
const { isConnected, sendMessage } = useChatChannel(sessionId, {
  onMessage: (message) => {
    // Handle new message
  },
  onPresenceUpdate: (action, member) => {
    // Handle presence updates
  }
});

// Setting up message subscription in the hook
const messageListener = (message) => {
  console.log('Received message:', message);
  if (onMessage) onMessage(message);
};

channel.subscribe(messageListener);

// Setting up presence events
const enterHandler = (member) => {
  console.log('Member entered:', member);
  // Handle member entering
};

channel.presence.subscribe('enter', enterHandler);
```

### 3. Sending Messages

Messages are sent through the Ably channel and saved to the database:

```javascript
// Function to send messages using the Ably channel
const sendMessage = useCallback(
  async (messageData) => {
    if (!channelRef.current) {
      throw new Error('Channel not initialized');
    }

    try {
      // With the direct Ably SDK, we use publish with name and data
      return await channelRef.current.publish('chat-message', messageData);
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  },
  []
);

// Using the function to send a message and save it to the database
try {
  // Send via Ably for real-time delivery
  await sendMessage(messageData);

  // Save to database for persistence
  await fetch('/api/volunteers/chat/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      content: messageContent
    })
  });
} catch (error) {
  console.error('Error sending message:', error);
}
```

## Performance Considerations

- Messages are delivered instantly via WebSockets
- Database writes still occur for message persistence
- Optimistic UI updates are used to improve perceived performance
- Message throttling ensures Ably rate limits are respected (50 messages per second per connection)
- Connection retry mechanisms improve reliability in unstable networks

## Future Improvements

1. Add offline support with message queuing
2. Implement read receipts
3. Add support for media attachments
4. Enhance typing indicators with "user is typing" messages

## Troubleshooting

Common issues:

1. **Connection Failures**
   - Check Ably API key in environment variables
   - Verify token endpoint is returning valid tokens

2. **Message Delivery Issues**
   - Check channel names and permissions
   - Verify client has the correct capabilities

3. **UI Not Updating**
   - Check that components are properly subscribing to channels
   - Verify React state is being updated correctly

4. **Rate Limiting Errors**
   - Use the throttling utility in `messageThrottling.js` for all Ably operations
   - Avoid rapid message sending that could exceed the 50 messages per second limit
   - If you see "Rate limit exceeded" errors, the throttling mechanism will automatically handle retries

5. **Connection and Presence Issues**
   - Use the retry mechanisms in `chatConnectionRetry.js` to improve reliability
   - Connection issues often resolve with an automatic retry or manual reconnect
   - Presence failures often occur due to network instability and can be resolved with retries
   - The UI provides a "Retry" button for users to manually reconnect when needed