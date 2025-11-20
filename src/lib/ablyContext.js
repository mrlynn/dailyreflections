'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as Ably from 'ably';
import { useSession } from 'next-auth/react';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

// Create context with more complete type structure to hold connection info
const AblyContext = createContext({
  client: null,
  isConnected: false,
  connectionError: null,
  connectionState: null
});

/**
 * Provider component for Ably client
 * This wraps your application and provides the Ably client to all components
 */
export function AblyProvider({ children }) {
  const { data: session, status } = useSession();
  const isRealtimeChatEnabled = useFeatureFlag('REALTIME_CHAT');
  const [client, setClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [connectionState, setConnectionState] = useState('initialized');

  // Initialize the Ably client
  useEffect(() => {
    // Only initialize if feature flag is enabled
    if (!isRealtimeChatEnabled) {
      setConnectionState('disabled');
      setClient(null);
      setIsConnected(false);
      return;
    }

    // Only initialize when the user is authenticated
    if (status !== 'authenticated' || !session?.user?.id) {
      setConnectionState('waiting-auth');
      return;
    }

    setConnectionState('connecting');
    setConnectionError(null);

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
    try {
      const ablyClient = new Ably.Realtime({
        authCallback,
        clientId: session.user.id,
      });

      // Handle connection state changes
      const handleConnectionStateChange = (stateChange) => {
        console.log('Ably connection state changed:', stateChange);
        setConnectionState(stateChange.current);
        setIsConnected(stateChange.current === 'connected');

        if (stateChange.reason) {
          console.warn('Connection state change reason:', stateChange.reason);
          if (stateChange.current === 'failed' || stateChange.current === 'suspended') {
            setConnectionError(stateChange.reason.message || 'Connection failed');
          }
        }
      };

      // Listen for connection state changes
      ablyClient.connection.on(handleConnectionStateChange);

      // Store the client in state to provide it to children
      setClient(ablyClient);

      // Log successful initialization
      console.log('Ably client initialized successfully');

      // Clean up function to close the connection when unmounting
      return () => {
        console.log('Cleaning up Ably connection');
        ablyClient.connection.off(handleConnectionStateChange);
        ablyClient.close();
        setClient(null);
        setIsConnected(false);
        setConnectionState('closed');
      };
    } catch (error) {
      console.error('Error initializing Ably client:', error);
      setConnectionError(error.message || 'Failed to initialize Ably client');
      setConnectionState('failed');
    }
  }, [session, status, isRealtimeChatEnabled]);

  // Create a wrapper function to get or create a channel
  const getOrCreateChannel = useCallback((channelName, options = {}) => {
    if (!client) {
      throw new Error('Ably client not initialized');
    }
    return client.channels.get(channelName, options);
  }, [client]);

  // Create context value with client and connection state
  const contextValue = {
    client,
    isConnected,
    connectionError,
    connectionState,
    getOrCreateChannel
  };

  return (
    <AblyContext.Provider value={contextValue}>
      {children}
    </AblyContext.Provider>
  );
}

/**
 * Custom hook to use the Ably client and connection info
 * Components can call this to get access to the Ably client and status
 */
export function useAbly() {
  const context = useContext(AblyContext);

  if (!context) {
    console.warn('useAbly must be used within an AblyProvider');
    return {
      client: null,
      isConnected: false,
      connectionError: new Error('AblyContext not found'),
      connectionState: 'unavailable',
      getOrCreateChannel: () => {
        throw new Error('AblyContext not found');
      }
    };
  }

  return context;
}