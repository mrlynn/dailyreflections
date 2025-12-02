'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAbly } from '@/lib/ablyContext';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

/**
 * Hook for managing presence state in chat
 * @param {string} channelName - The channel name to monitor presence on
 * @returns {Object} Presence data and utility functions
 */
export default function useChatPresence(channelName) {
  const { client, isConnected } = useAbly();
  const isRealtimeChatEnabled = useFeatureFlag('REALTIME_CHAT');
  const [members, setMembers] = useState([]);
  const [presenceData, setPresenceData] = useState({});
  const [error, setError] = useState(null);

  // Throttle presence updates to avoid rate limiting
  const lastUpdateTime = useRef(0);
  const pendingUpdate = useRef(null);
  const updateTimeout = useRef(null);
  const THROTTLE_MS = 1000; // Minimum 1 second between presence updates

  useEffect(() => {
    // Don't initialize if feature flag is disabled
    if (!isRealtimeChatEnabled) {
      setError('Realtime chat feature is not enabled');
      return;
    }

    if (!client || !isConnected || !channelName) return;

    let channel;
    try {
      // Get the channel
      channel = client.channels.get(channelName);

      // Enter presence on the channel with initial data
      channel.presence.enter({ status: 'online', lastActive: new Date().toISOString() })
        .then(() => {
          console.log('Entered presence on channel:', channelName);
        })
        .catch(err => {
          console.error('Error entering presence:', err);
          setError('Failed to enter channel presence');
        });

      // Subscribe to presence events
      const enterHandler = member => {
        console.log('Member entered:', member);
        setMembers(prev => {
          if (prev.some(m => m.clientId === member.clientId)) return prev;
          return [...prev, member];
        });

        setPresenceData(prev => ({
          ...prev,
          [member.clientId]: member.data
        }));
      };

      const leaveHandler = member => {
        console.log('Member left:', member);
        setMembers(prev => prev.filter(m => m.clientId !== member.clientId));

        setPresenceData(prev => {
          const updated = { ...prev };
          delete updated[member.clientId];
          return updated;
        });
      };

      const updateHandler = member => {
        console.log('Member updated:', member);
        setMembers(prev =>
          prev.map(m => m.clientId === member.clientId ? member : m)
        );

        setPresenceData(prev => ({
          ...prev,
          [member.clientId]: member.data
        }));
      };

      channel.presence.subscribe('enter', enterHandler);
      channel.presence.subscribe('leave', leaveHandler);
      channel.presence.subscribe('update', updateHandler);

      // Get current presence members
      channel.presence.get((err, members) => {
        if (err) {
          console.error('Error getting presence members:', err);
          setError('Failed to get presence members');
          return;
        }
        console.log('Current members:', members);
        setMembers(members);

        // Update presence data for all members
        const data = {};
        members.forEach(member => {
          data[member.clientId] = member.data;
        });
        setPresenceData(data);
      });

      // Cleanup function
      return () => {
        // Clear pending updates
        if (updateTimeout.current) {
          clearTimeout(updateTimeout.current);
        }

        channel.presence.unsubscribe('enter', enterHandler);
        channel.presence.unsubscribe('leave', leaveHandler);
        channel.presence.unsubscribe('update', updateHandler);
        channel.presence.leave()
          .then(() => console.log('Left presence on channel:', channelName))
          .catch(err => console.error('Error leaving presence:', err));
      };
    } catch (err) {
      console.error('Error in useChatPresence:', err);
      setError(err.message || 'Error setting up presence');
    }
  }, [client, isConnected, channelName, isRealtimeChatEnabled]);

  /**
   * Update the user's presence data with throttling
   * @param {Object} data - Data to update in presence
   */
  const updatePresence = useCallback(async (data) => {
    if (!isRealtimeChatEnabled) {
      throw new Error('Realtime chat feature is not enabled');
    }

    if (!client || !isConnected || !channelName) {
      throw new Error('Cannot update presence: not connected');
    }

    // Store the pending update
    pendingUpdate.current = {
      ...pendingUpdate.current,
      ...data
    };

    // Clear any existing timeout
    if (updateTimeout.current) {
      clearTimeout(updateTimeout.current);
    }

    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTime.current;

    // If enough time has passed, update immediately
    if (timeSinceLastUpdate >= THROTTLE_MS) {
      try {
        const channel = client.channels.get(channelName);
        await channel.presence.update({
          ...presenceData[client.auth.clientId],
          ...pendingUpdate.current,
          lastActive: new Date().toISOString()
        });
        lastUpdateTime.current = now;
        pendingUpdate.current = null;
      } catch (err) {
        console.error('Error updating presence:', err);
        // Don't throw on rate limit errors, just log them
        if (!err.message?.includes('rate limit')) {
          throw err;
        }
      }
    } else {
      // Schedule update for later
      const delay = THROTTLE_MS - timeSinceLastUpdate;
      updateTimeout.current = setTimeout(async () => {
        if (pendingUpdate.current && client && isConnected) {
          try {
            const channel = client.channels.get(channelName);
            await channel.presence.update({
              ...presenceData[client.auth.clientId],
              ...pendingUpdate.current,
              lastActive: new Date().toISOString()
            });
            lastUpdateTime.current = Date.now();
            pendingUpdate.current = null;
          } catch (err) {
            console.error('Error updating presence (throttled):', err);
          }
        }
      }, delay);
    }
  }, [client, isConnected, channelName, isRealtimeChatEnabled, presenceData]);

  /**
   * Check if a user is online in the channel
   * @param {string} userId - The user ID to check
   * @returns {boolean} Whether the user is online
   */
  const isUserOnline = (userId) => {
    return members.some(member => member.clientId === userId);
  };

  /**
   * Get a user's presence data
   * @param {string} userId - The user ID to check
   * @returns {Object|null} The user's presence data or null if not found
   */
  const getUserPresence = (userId) => {
    return presenceData[userId] || null;
  };

  /**
   * Update typing status for current user
   * @param {boolean} isTyping - Whether the user is typing
   */
  const updateTypingStatus = async (isTyping) => {
    await updatePresence({ isTyping });
  };

  return {
    members,
    presenceData,
    error,
    isUserOnline,
    getUserPresence,
    updatePresence,
    updateTypingStatus
  };
}