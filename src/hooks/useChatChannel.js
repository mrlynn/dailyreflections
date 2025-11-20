'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAbly } from '@/lib/ablyContext';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { throttledSendMessage } from '@/utils/messageThrottling';
import { enhancedThrottledSend } from '@/utils/enhancedThrottling';
import { retryEnterPresence, ensureAblyConnection, getChatConnectionErrorMessage } from '@/utils/chatConnectionRetry';

/**
 * Custom hook for managing chat channels with Ably
 * @param {string} sessionId - The chat session ID
 * @param {Object} options - Additional options
 * @param {Function} options.onMessage - Callback when a new message is received
 * @param {Function} options.onPresenceUpdate - Callback when presence state changes
 * @returns {Object} Chat channel utilities and state
 */
export function useChatChannel(sessionId, { onMessage, onPresenceUpdate } = {}) {
  const { client: ablyClient, isConnected: isAblyConnected } = useAbly();
  const isRealtimeChatEnabled = useFeatureFlag('REALTIME_CHAT');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [members, setMembers] = useState([]);
  const channelRef = useRef(null);
  const channelName = `chat:${sessionId}`;

  // Initialize the channel and set up listeners
  useEffect(() => {
    // Don't initialize if feature flag is disabled
    if (!isRealtimeChatEnabled) {
      setIsLoading(false);
      setIsConnected(false);
      setError('Realtime chat feature is not enabled');
      return;
    }

    if (!ablyClient || !sessionId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create/get the channel
      const channel = ablyClient.channels.get(channelName);
      channelRef.current = channel;

      // Subscribe to messages
      const messageListener = (message) => {
        console.log('Received message:', message);
        if (onMessage) onMessage(message);
      };

      channel.subscribe(messageListener);

      // Set up presence monitoring
      const enterHandler = (member) => {
        console.log('Member entered:', member);
        setMembers((prev) => {
          if (prev.some((m) => m.clientId === member.clientId)) return prev;
          return [...prev, member];
        });
        if (onPresenceUpdate) onPresenceUpdate('enter', member);
      };

      const leaveHandler = (member) => {
        console.log('Member left:', member);
        setMembers((prev) => prev.filter((m) => m.clientId !== member.clientId));
        if (onPresenceUpdate) onPresenceUpdate('leave', member);
      };

      const updateHandler = (member) => {
        console.log('Member updated:', member);
        setMembers((prev) =>
          prev.map((m) => m.clientId === member.clientId ? member : m)
        );
        if (onPresenceUpdate) onPresenceUpdate('update', member);
      };

      channel.presence.subscribe('enter', enterHandler);
      channel.presence.subscribe('leave', leaveHandler);
      channel.presence.subscribe('update', updateHandler);

      // Enter presence on the channel with retry mechanism
      const enterPresence = async () => {
        try {
          // First ensure connection is healthy
          const connected = await ensureAblyConnection(ablyClient);
          if (!connected) {
            setError('Unable to establish Ably connection. Please check your internet connection.');
            return;
          }

          // Attempt to enter presence with retries
          const success = await retryEnterPresence(channel, { status: 'active' });

          if (success) {
            console.log('Successfully entered presence on channel', channelName);
            setIsConnected(true);
          } else {
            console.error('Failed to enter presence after multiple attempts');
            setError('Unable to join the chat. Please try refreshing the page.');
          }
        } catch (err) {
          console.error('Error establishing presence:', err);
          setError(getChatConnectionErrorMessage(err));
        }
      };

      // Execute the presence enter function
      enterPresence();

      // Get current presence members
      channel.presence.get((err, members) => {
        if (err) {
          console.error('Error getting presence members:', err);
          return;
        }
        console.log('Current members:', members);
        setMembers(members);
      });

      // Set connection status based on Ably connection state
      const handleConnectionStateChange = (stateChange) => {
        console.log('Ably connection state changed:', stateChange);
        setIsConnected(stateChange.current === 'connected');
      };

      ablyClient.connection.on(handleConnectionStateChange);

      setIsLoading(false);

      // Cleanup function
      return () => {
        console.log('Cleaning up Ably channel:', channelName);

        // Leave presence
        if (channel.presence) {
          channel.presence.leave()
            .catch(err => console.error('Error leaving presence:', err));
        }

        // Unsubscribe from presence events
        channel.presence.unsubscribe('enter', enterHandler);
        channel.presence.unsubscribe('leave', leaveHandler);
        channel.presence.unsubscribe('update', updateHandler);

        // Unsubscribe from messages
        channel.unsubscribe(messageListener);

        // Remove connection state listener
        ablyClient.connection.off(handleConnectionStateChange);
      };
    } catch (err) {
      console.error('Error setting up chat channel:', err);
      setError(err.message || 'Failed to set up chat channel');
      setIsLoading(false);
    }
  }, [ablyClient, sessionId, channelName, onMessage, onPresenceUpdate, isRealtimeChatEnabled]);

  /**
   * Send a message to the chat channel
   * @param {Object} messageData - Message data
   * @returns {Promise<Object>} The published message
   */
  const sendMessage = useCallback(
    async (messageData) => {
      if (!isRealtimeChatEnabled) {
        throw new Error('Realtime chat feature is not enabled');
      }

      if (!channelRef.current) {
        throw new Error('Channel not initialized');
      }

      // Use the enhanced throttled send function with channel-specific rate limiting
      return await enhancedThrottledSend(
        async (data) => {
          try {
            return await channelRef.current.publish('chat-message', data);
          } catch (err) {
            console.error('Error sending message:', err);
            throw err;
          }
        },
        messageData,
        channelName // Pass the channel name for per-channel rate limiting
      );
    },
    [channelName, isRealtimeChatEnabled]
  );

  /**
   * Update user presence state
   * @param {Object} presenceData - New presence data
   */
  const updatePresence = useCallback(
    async (presenceData) => {
      if (!isRealtimeChatEnabled) {
        throw new Error('Realtime chat feature is not enabled');
      }

      if (!channelRef.current) {
        throw new Error('Channel not initialized');
      }

      // Use the enhanced throttled send function for presence updates too
      // with per-channel rate limiting for better control
      return await enhancedThrottledSend(
        async (data) => {
          try {
            await channelRef.current.presence.update(data);
            return true;
          } catch (err) {
            console.error('Error updating presence:', err);
            throw err;
          }
        },
        presenceData,
        channelName + ':presence' // Use a different "channel" for presence to separate rate limits
      );
    },
    [channelName, isRealtimeChatEnabled]
  );

  /**
   * Signal that the user is typing
   * @param {boolean} isTyping - Whether the user is typing
   */
  const sendTypingIndicator = useCallback(
    (isTyping) => {
      updatePresence({ status: isTyping ? 'typing' : 'active' });
    },
    [updatePresence]
  );

  // Return channel utilities and state
  return {
    isConnected: isConnected && isAblyConnected,
    isLoading,
    error,
    members,
    sendMessage,
    updatePresence,
    sendTypingIndicator,
    channel: channelRef.current,
  };
}