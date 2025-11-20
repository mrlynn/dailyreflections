'use server';

import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb';
import { createHash } from 'crypto';

const MAX_COMMENT_LENGTH = 1200;
const MAX_PROMPT_LENGTH = 8000;
const MAX_RESPONSE_LENGTH = 4000;

const FEEDBACK_TYPES = new Set(['thumbs_up', 'thumbs_down']);

function sanitizeString(value, maxLength) {
  if (!value || typeof value !== 'string') return null;
  return value.trim().slice(0, maxLength);
}

function redactSensitivePhrases(value) {
  if (!value || typeof value !== 'string') return value;
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[redacted-phone]');
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      messageId,
      feedbackType,
      tags = [],
      comment,
      sessionId,
      timestamp,
      response: responsePayload = {},
      userMessage = null,
      chatWindow = 'unknown',
    } = body || {};

    if (!messageId || typeof messageId !== 'string') {
      return NextResponse.json({ error: 'messageId is required' }, { status: 400 });
    }

    if (!FEEDBACK_TYPES.has(feedbackType)) {
      return NextResponse.json({ error: 'feedbackType must be thumbs_up or thumbs_down' }, { status: 400 });
    }

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const normalizedTags = Array.isArray(tags)
      ? tags
          .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
          .map(tag => tag.trim().toLowerCase())
          .slice(0, 6)
      : [];

    const sanitizedComment = sanitizeString(redactSensitivePhrases(comment), MAX_COMMENT_LENGTH);

    const sessionHash = createHash('sha256').update(sessionId).digest('hex');
    const sessionFingerprint = sessionId.slice(0, 16);

    const submittedAt = timestamp && !Number.isNaN(Date.parse(timestamp))
      ? new Date(timestamp)
      : new Date();

    const session = await auth().catch(() => null);

    const responseContent = sanitizeString(responsePayload.content, MAX_RESPONSE_LENGTH);
    const responseCitations = Array.isArray(responsePayload.citations) ? responsePayload.citations : [];
    const retrievalContext = Array.isArray(responsePayload.retrievalContext)
      ? responsePayload.retrievalContext.map(contextItem => ({
          source: contextItem?.source ?? null,
          reference: contextItem?.reference ?? null,
          score: typeof contextItem?.score === 'number' ? contextItem.score : null,
          chunkId: contextItem?.chunkId ?? null,
          dateKey: contextItem?.dateKey ?? null,
          pageNumber: contextItem?.pageNumber ?? null,
          url: contextItem?.url ?? null,
          textSnippet: sanitizeString(contextItem?.textSnippet, 600),
        }))
      : [];

    const metadata = responsePayload?.metadata ?? {};
    const sanitizedMetadata = {
      query: sanitizeString(redactSensitivePhrases(metadata?.query), 1000),
      todaysReflection: metadata?.todaysReflection ?? null,
      llmPrompt: sanitizeString(metadata?.llmPrompt, MAX_PROMPT_LENGTH),
    };

    const sanitizedUserMessage = userMessage?.content
      ? {
          messageId: userMessage?.messageId ?? null,
          content: sanitizeString(redactSensitivePhrases(userMessage.content), 1200),
          createdAt: userMessage?.createdAt ?? null,
        }
      : null;

    const feedbackDocument = {
      messageId,
      feedbackType,
      tags: normalizedTags,
      comment: sanitizedComment,
      session: {
        hash: sessionHash,
        fingerprint: sessionFingerprint,
        chatWindow,
      },
      submittedAt,
      createdAt: new Date(),
      response: {
        messageId: responsePayload?.messageId ?? messageId,
        content: responseContent,
        citations: responseCitations,
        retrievalContext,
        metadata: sanitizedMetadata,
        createdAt: responsePayload?.createdAt ?? null,
      },
      userMessage: sanitizedUserMessage,
      responseMetrics: {
        contentLength: responseContent?.length ?? 0,
        citationsCount: responseCitations.length,
        retrievalCount: retrievalContext.length,
      },
      user: session?.user
        ? {
            id: session.user.id ?? null,
            email: session.user.email ?? null,
            displayName: session.user.displayName ?? null,
            isAdmin: session.user.isAdmin ?? false,
          }
        : null,
    };

    const client = await clientPromise;
    const db = client.db('dailyreflections');
    await db.collection('feedback').insertOne(feedbackDocument);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error recording chatbot feedback:', error);
    return NextResponse.json(
      { error: 'Failed to record feedback' },
      { status: 500 }
    );
  }
}

