import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getSessionMessages } from '@/lib/models/ChatMessage';
import { getChatSessionById, getTypingStatus } from '@/lib/models/ChatSession';
import { ObjectId } from 'mongodb';

const POLL_INTERVAL_MS = 2500;
const INITIAL_MESSAGE_LIMIT = 50;

function serializeObjectId(value) {
  if (!value) return value;
  if (typeof value === 'string') return value;
  if (value instanceof ObjectId) return value.toString();
  return value;
}

function serializeDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function serializeMessage(message) {
  if (!message) return message;

  return {
    ...message,
    _id: serializeObjectId(message._id),
    session_id: serializeObjectId(message.session_id),
    sender_id: serializeObjectId(message.sender_id),
    created_at: serializeDate(message.created_at),
    timestamp: serializeDate(message.timestamp),
    updated_at: serializeDate(message.updated_at),
    delivered_at: serializeDate(message.delivered_at),
    read_at: serializeDate(message.read_at),
    read_by: Array.isArray(message.read_by)
      ? message.read_by.map((entry) => ({
          user_id: serializeObjectId(entry?.user_id ?? entry?.userId ?? entry),
          timestamp: serializeDate(entry?.timestamp)
        }))
      : []
  };
}

function serializeTypingStatus(status) {
  return {
    user: Boolean(status?.user),
    volunteer: Boolean(status?.volunteer)
  };
}

function sendSSE(controller, encoder, event, data) {
  controller.enqueue(encoder.encode(`event: ${event}\n`));
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
}

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  const sessionObjectId = (() => {
    try {
      return new ObjectId(id);
    } catch {
      return null;
    }
  })();

  if (!sessionObjectId) {
    return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let closed = false;
      let pollTimer = null;
      let lastMessageUpdatedAt = null;
      let lastTypingSnapshot = { user: false, volunteer: false };
      let lastSessionStatus = null;

      const closeStream = (error) => {
        if (closed) return;
        closed = true;
        if (pollTimer) {
          clearInterval(pollTimer);
        }
        if (error) {
          controller.error(error);
        } else {
          controller.close();
        }
      };

      request.signal.addEventListener('abort', () => {
        closeStream();
      });

      (async () => {
        try {
          const session = await getChatSessionById(sessionObjectId);
          if (!session) {
            sendSSE(controller, encoder, 'error', { message: 'Session not found' });
            closeStream();
            return;
          }

          const [initialMessages, initialTyping] = await Promise.all([
            getSessionMessages(sessionObjectId, { limit: INITIAL_MESSAGE_LIMIT }),
            getTypingStatus(sessionObjectId)
          ]);

          if (initialMessages.length > 0) {
            lastMessageUpdatedAt = new Date(
              initialMessages[initialMessages.length - 1].updated_at ||
                initialMessages[initialMessages.length - 1].created_at
            );
          }
          lastTypingSnapshot = serializeTypingStatus(initialTyping);
          lastSessionStatus = {
            status: session.status,
            last_activity: serializeDate(session.last_activity)
          };

          sendSSE(controller, encoder, 'init', {
            messages: initialMessages.map(serializeMessage),
            typing: lastTypingSnapshot,
            status: lastSessionStatus
          });
        } catch (error) {
          console.error('Error initializing chat events stream:', error);
          sendSSE(controller, encoder, 'error', { message: 'Failed to initialize stream' });
          closeStream(error);
          return;
        }

        const poll = async () => {
          try {
            const messageFilter = {
              session_id: sessionObjectId
            };

            if (lastMessageUpdatedAt) {
              messageFilter.updated_at = { $gt: new Date(lastMessageUpdatedAt) };
            }

            const updatedMessages = await db
              .collection('chat_messages')
              .find(messageFilter)
              .sort({ updated_at: 1 })
              .toArray();

            if (updatedMessages.length > 0) {
              const lastUpdated =
                updatedMessages[updatedMessages.length - 1].updated_at ||
                updatedMessages[updatedMessages.length - 1].created_at;
              if (lastUpdated) {
                lastMessageUpdatedAt = new Date(lastUpdated);
              }

              updatedMessages.forEach((message) => {
                const serialized = serializeMessage(message);
                const eventType =
                  serialized.updated_at && serialized.created_at === serialized.updated_at
                    ? 'message'
                    : 'message:update';
                sendSSE(controller, encoder, eventType, serialized);
              });
            }

            const typingStatus = serializeTypingStatus(await getTypingStatus(sessionObjectId));
            if (
              typingStatus.user !== lastTypingSnapshot.user ||
              typingStatus.volunteer !== lastTypingSnapshot.volunteer
            ) {
              lastTypingSnapshot = typingStatus;
              sendSSE(controller, encoder, 'typing', typingStatus);
            }

            const session = await db.collection('chat_sessions').findOne(
              { _id: sessionObjectId },
              { projection: { status: 1, last_activity: 1 } }
            );

            if (session) {
              const statusPayload = {
                status: session.status,
                last_activity: serializeDate(session.last_activity)
              };
              if (
                !lastSessionStatus ||
                statusPayload.status !== lastSessionStatus.status ||
                statusPayload.last_activity !== lastSessionStatus.last_activity
              ) {
                lastSessionStatus = statusPayload;
                sendSSE(controller, encoder, 'status', statusPayload);
              }
            }
          } catch (error) {
            console.error('Error polling chat events:', error);
            sendSSE(controller, encoder, 'error', { message: 'Failed to poll events' });
          }
        };

        await poll();
        pollTimer = setInterval(poll, POLL_INTERVAL_MS);
      })();
    },
    cancel() {
      // noop, handled in start cleanup
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  });
}

