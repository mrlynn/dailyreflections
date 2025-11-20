'use client';

import { useState, useEffect } from 'react';
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
   * Update the user's presence data
   * @param {Object} data - Data to update in presence
   */
  const updatePresence = async (data) => {
    if (!isRealtimeChatEnabled) {
      throw new Error('Realtime chat feature is not enabled');
    }

    if (!client || !isConnected || !channelName) {
      throw new Error('Cannot update presence: not connected');
    }

    try {
      const channel = client.channels.get(channelName);
      await channel.presence.update({
        ...presenceData[client.auth.clientId],
        ...data,
        lastActive: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error updating presence:', err);
      throw err;
    }
  };

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