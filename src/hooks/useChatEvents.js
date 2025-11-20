'use client';

import { useEffect, useRef, useState } from 'react';

const noop = () => {};

/**
 * Subscribe to server-sent chat events for a given session.
 *
 * @param {string} sessionId
 * @param {Object} [options]
 * @param {Function} [options.onInit]
 * @param {Function} [options.onMessage]
 * @param {Function} [options.onTyping]
 * @param {Function} [options.onStatus]
 * @param {Function} [options.onError]
 * @param {boolean} [options.enabled=true]
 * @returns {{ connected: boolean, disconnect: () => void }}
 */
export default function useChatEvents(
  sessionId,
  {
    onInit = noop,
    onMessage = noop,
    onTyping = noop,
    onStatus = noop,
    onError = noop,
    enabled = true
  } = {}
) {
  const handlersRef = useRef({ onInit, onMessage, onTyping, onStatus, onError });
  const eventSourceRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    handlersRef.current = { onInit, onMessage, onTyping, onStatus, onError };
  }, [onInit, onMessage, onTyping, onStatus, onError]);

  useEffect(() => {
    if (!sessionId || !enabled) {
      setConnected(false);
      return () => {};
    }

    const eventSource = new EventSource(`/api/volunteers/chat/sessions/${sessionId}/events`);
    eventSourceRef.current = eventSource;

    const handleInit = (event) => {
      try {
        const payload = JSON.parse(event.data);
        handlersRef.current.onInit(payload);
        setConnected(true);
      } catch (error) {
        console.error('Failed to parse chat init payload', error);
        handlersRef.current.onError(error);
      }
    };

    const handleMessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        handlersRef.current.onMessage(payload);
      } catch (error) {
        console.error('Failed to parse chat message payload', error);
        handlersRef.current.onError(error);
      }
    };

    const handleTyping = (event) => {
      try {
        const payload = JSON.parse(event.data);
        handlersRef.current.onTyping(payload);
      } catch (error) {
        console.error('Failed to parse typing payload', error);
        handlersRef.current.onError(error);
      }
    };

    const handleStatus = (event) => {
      try {
        const payload = JSON.parse(event.data);
        handlersRef.current.onStatus(payload);
      } catch (error) {
        console.error('Failed to parse status payload', error);
        handlersRef.current.onError(error);
      }
    };

    const handleError = (event) => {
      console.error('Chat events SSE error', event);
      handlersRef.current.onError(event);
      setConnected(false);
    };

    eventSource.addEventListener('init', handleInit);
    eventSource.addEventListener('message', handleMessage);
    eventSource.addEventListener('typing', handleTyping);
    eventSource.addEventListener('status', handleStatus);
    eventSource.addEventListener('error', handleError);

    return () => {
      eventSource.removeEventListener('init', handleInit);
      eventSource.removeEventListener('message', handleMessage);
      eventSource.removeEventListener('typing', handleTyping);
      eventSource.removeEventListener('status', handleStatus);
      eventSource.removeEventListener('error', handleError);
      eventSource.close();
      eventSourceRef.current = null;
      setConnected(false);
    };
  }, [sessionId, enabled]);

  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setConnected(false);
    }
  };

  return { connected, disconnect };
}

