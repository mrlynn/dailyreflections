/**
 * Socket.IO client for chat communication
 */
import { io } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback, useMemo } from 'react';

// Define socket events
export const SOCKET_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',

  // Volunteer status events
  VOLUNTEER_STATUS: 'volunteer:status',
  VOLUNTEER_AVAILABLE: 'volunteer:available',

  // Chat events
  CHAT_REQUEST: 'chat:request',
  CHAT_NEW_REQUEST: 'chat:new_request',
  CHAT_ACCEPT: 'chat:accept',
  CHAT_STARTED: 'chat:started',
  CHAT_MESSAGE: 'chat:message',
  CHAT_END: 'chat:end',
  CHAT_ENDED: 'chat:ended',
  CHAT_DISCONNECTED: 'chat:disconnected',
  CHAT_ERROR: 'chat:error',
};

/**
 * Create a singleton socket instance
 */
let socket;

const getSocketInstance = (options = {}) => {
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || '';
    const namespace = options.namespace || '/chat';
    socket = io(`${socketUrl}${namespace}`, {
      autoConnect: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      transports: ['websocket'],
      withCredentials: true,
    });
  }
  return socket;
};

/**
 * React hook for using socket in components
 */
export function useSocket() {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  const socket = useMemo(() => getSocketInstance(), []);

  useEffect(() => {
    if (session?.user) {
      // Add auth token to socket handshake
      socket.auth = { token: `Bearer ${session.accessToken || ''}` };

      // Connect socket
      if (!socket.connected) {
        socket.connect();
      }

      // Connection event handlers
      const onConnect = () => {
        console.log('Socket connected');
        setIsConnected(true);
        setError(null);
      };

      const onDisconnect = (reason) => {
        console.log(`Socket disconnected: ${reason}`);
        setIsConnected(false);
      };

      const onConnectError = (err) => {
        console.error('Socket connection error:', err.message);
        setError(err.message);
        setIsConnected(false);
      };

      socket.on(SOCKET_EVENTS.CONNECT, onConnect);
      socket.on(SOCKET_EVENTS.DISCONNECT, onDisconnect);
      socket.on(SOCKET_EVENTS.CONNECT_ERROR, onConnectError);

      // Cleanup function
      return () => {
        socket.off(SOCKET_EVENTS.CONNECT, onConnect);
        socket.off(SOCKET_EVENTS.DISCONNECT, onDisconnect);
        socket.off(SOCKET_EVENTS.CONNECT_ERROR, onConnectError);
      };
    } else {
      // Disconnect socket if session is not available
      if (socket.connected) {
        socket.disconnect();
      }
      setIsConnected(false);
    }
  }, [session]);

  // Function to register event listeners
  const on = useCallback((event, callback) => {
    socket.on(event, callback);
    return () => socket.off(event, callback);
  }, []);

  // Function to emit events
  const emit = useCallback((event, data) => {
    if (socket.connected) {
      socket.emit(event, data);
    } else {
      console.warn('Socket is not connected, cannot emit event', event);
    }
  }, []);

  // Function to disconnect socket
  const disconnect = useCallback(() => {
    if (socket.connected) {
      socket.disconnect();
    }
  }, []);

  return {
    socket,
    isConnected,
    error,
    on,
    emit,
    disconnect,
  };
}

/**
 * React hook for volunteers to manage their online status
 */
export function useVolunteerStatus() {
  const { isConnected, emit, on } = useSocket();
  const { data: session } = useSession();
  const [isOnline, setIsOnline] = useState(false);

  // Check if user is a volunteer
  const isVolunteer = useMemo(() => {
    return session?.user?.roles?.includes('volunteer_listener') || session?.user?.isAdmin;
  }, [session]);

  // Function to go online/offline
  const setStatus = useCallback((status) => {
    if (!isConnected || !isVolunteer) return;

    const newStatus = status === true ? 'online' : 'offline';
    emit(SOCKET_EVENTS.VOLUNTEER_STATUS, newStatus);
    setIsOnline(status);
  }, [isConnected, isVolunteer, emit]);

  return {
    isVolunteer,
    isOnline,
    setOnline: () => setStatus(true),
    setOffline: () => setStatus(false),
    toggleStatus: () => setStatus(!isOnline),
  };
}

/**
 * React hook for users to request chats
 */
export function useChatRequest() {
  const { isConnected, emit, on } = useSocket();
  const [isWaiting, setIsWaiting] = useState(false);

  // Function to request a chat
  const requestChat = useCallback((requestData = {}) => {
    if (!isConnected) return;

    const requestId = `req_${Date.now()}`;
    emit(SOCKET_EVENTS.CHAT_REQUEST, {
      request_id: requestId,
      ...requestData
    });
    setIsWaiting(true);

    return requestId;
  }, [isConnected, emit]);

  // Function to cancel a chat request
  const cancelRequest = useCallback(() => {
    setIsWaiting(false);
    // No need to emit event as leaving the waiting page will disconnect the socket
  }, []);

  // Listen for chat start
  useEffect(() => {
    if (!isConnected) return;

    const onChatStarted = () => {
      setIsWaiting(false);
    };

    return on(SOCKET_EVENTS.CHAT_STARTED, onChatStarted);
  }, [isConnected, on]);

  return {
    requestChat,
    cancelRequest,
    isWaiting,
  };
}

/**
 * React hook for volunteers to accept chat requests
 */
export function useChatAccept() {
  const { isConnected, emit, on } = useSocket();
  const [pendingRequests, setPendingRequests] = useState([]);

  // Listen for new chat requests
  useEffect(() => {
    if (!isConnected) return;

    const onNewRequest = (requestData) => {
      setPendingRequests((prev) => [...prev, requestData]);
    };

    return on(SOCKET_EVENTS.CHAT_NEW_REQUEST, onNewRequest);
  }, [isConnected, on]);

  // Function to accept a chat request
  const acceptChat = useCallback((userId) => {
    if (!isConnected) return;

    emit(SOCKET_EVENTS.CHAT_ACCEPT, { user_id: userId });

    // Remove from pending requests
    setPendingRequests((prev) => prev.filter((req) => req.user_id !== userId));
  }, [isConnected, emit]);

  return {
    pendingRequests,
    acceptChat,
  };
}

/**
 * React hook for chat messaging
 */
export function useChatMessages() {
  const { isConnected, emit, on } = useSocket();
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [participant, setParticipant] = useState(null);

  // Clear messages when disconnected
  useEffect(() => {
    if (!isConnected) {
      setMessages([]);
    }
  }, [isConnected]);

  // Listen for chat started
  useEffect(() => {
    if (!isConnected) return;

    const onChatStarted = (data) => {
      setActiveRoom(data.room);
      const chatPartner = data.volunteer || data.user;
      setParticipant(chatPartner);
    };

    return on(SOCKET_EVENTS.CHAT_STARTED, onChatStarted);
  }, [isConnected, on]);

  // Listen for chat messages
  useEffect(() => {
    if (!isConnected || !activeRoom) return;

    const onMessage = (message) => {
      setMessages((prev) => [...prev, message]);
    };

    const onChatEnded = () => {
      setActiveRoom(null);
    };

    const onChatDisconnected = (data) => {
      setMessages((prev) => [
        ...prev,
        {
          system: true,
          message: data.message,
          timestamp: data.timestamp,
        }
      ]);
    };

    const cleanup1 = on(SOCKET_EVENTS.CHAT_MESSAGE, onMessage);
    const cleanup2 = on(SOCKET_EVENTS.CHAT_ENDED, onChatEnded);
    const cleanup3 = on(SOCKET_EVENTS.CHAT_DISCONNECTED, onChatDisconnected);

    return () => {
      cleanup1();
      cleanup2();
      cleanup3();
    };
  }, [isConnected, activeRoom, on]);

  // Function to send a message
  const sendMessage = useCallback((message) => {
    if (!isConnected || !activeRoom) return;

    emit(SOCKET_EVENTS.CHAT_MESSAGE, {
      room: activeRoom,
      message,
    });
  }, [isConnected, activeRoom, emit]);

  // Function to end the chat
  const endChat = useCallback(() => {
    if (!isConnected || !activeRoom) return;

    emit(SOCKET_EVENTS.CHAT_END, {
      room: activeRoom,
    });

    setActiveRoom(null);
  }, [isConnected, activeRoom, emit]);

  return {
    activeRoom,
    messages,
    participant,
    sendMessage,
    endChat,
  };
}

export default {
  useSocket,
  useVolunteerStatus,
  useChatRequest,
  useChatAccept,
  useChatMessages,
  SOCKET_EVENTS,
};