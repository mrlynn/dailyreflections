import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  getBigBookCollections,
  BIG_BOOK_EDITION_ID,
  normalizeCommentDocument,
} from '@/lib/bigbook/service';
import { stripHtmlToText } from '@/lib/sanitize';
import { ObjectId } from 'mongodb';
import { checkRateLimit, checkRateLimitByUser, getClientIP } from '@/lib/rateLimiter';
import { moderateContent, quickProfanityCheck } from '@/lib/contentModeration';
import { getFeatureFlag } from '@/lib/featureFlags';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_COMMENT_LENGTH = 2000;
const MAX_QUOTE_LENGTH = 600;

function parsePageNumber(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function sanitizeCommentContent(comment) {
  if (!comment) return '';
  const text = stripHtmlToText(comment.toString());
  return text.slice(0, MAX_COMMENT_LENGTH).trim();
}

function sanitizeQuoteContent(quote) {
  if (!quote) return null;
  const text = stripHtmlToText(quote.toString());
  const trimmed = text.slice(0, MAX_QUOTE_LENGTH).trim();
  return trimmed || null;
}

function resolveSessionUserId(session) {
  return (
    session?.user?.id ||
    session?.user?.sub ||
    session?.user?.email ||
    null
  );
}


export async function GET(request) {
  try {
    // Check feature flag
    if (!getFeatureFlag('BIGBOOK', 'COMMENTS')) {
      return NextResponse.json(
        { error: 'Big Book comments feature is not enabled.' },
        { status: 404 },
      );
    }

    const { searchParams } = new URL(request.url);
    const pageNumber = parsePageNumber(searchParams.get('pageNumber'));

    if (!pageNumber) {
      return NextResponse.json(
        { error: 'A valid pageNumber is required.' },
        { status: 400 },
      );
    }

    const { comments } = await getBigBookCollections();

    // Fetch all comments for this page, sorted by creation time
    const docs = await comments
      .find({ pageNumber })
      .sort({ createdAt: 1 })
      .toArray();

    return NextResponse.json({
      comments: docs.map(normalizeCommentDocument),
    });
  } catch (error) {
    console.error('Error fetching Big Book comments:', error);
    return NextResponse.json(
      { error: 'Failed to load comments.' },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    // Check feature flag
    if (!getFeatureFlag('BIGBOOK', 'COMMENTS')) {
      return NextResponse.json(
        { error: 'Big Book comments feature is not enabled.' },
        { status: 404 },
      );
    }

    const session = await getSession(request);

    // Require authentication to post comments
    if (!session?.user) {
      return NextResponse.json(
        {
          error: 'You must be signed in to post comments. Please sign in and try again.',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const pageNumber = parsePageNumber(body?.pageNumber);
    const parentId = body?.parentId || null;
    const commentBody = sanitizeCommentContent(body?.body);
    const quote = sanitizeQuoteContent(body?.quote);

    // Use authenticated user info (required)
    // Use displayName for comments, falling back to name or email
    const author = session.user.displayName || session.user.name || session.user.email;
    const userId = resolveSessionUserId(session);

    // Validation
    if (!pageNumber || !commentBody) {
      return NextResponse.json(
        { error: 'Page number and comment body are required.' },
        { status: 400 }
      );
    }

    // Quick client-side profanity/spam check
    const quickCheck = quickProfanityCheck(commentBody) || quickProfanityCheck(author);
    if (quickCheck) {
      return NextResponse.json(
        {
          error: 'Your comment contains inappropriate content or spam patterns. Please review and try again.',
          code: 'CONTENT_FLAGGED',
        },
        { status: 400 }
      );
    }

    // Rate limiting check - use userId if authenticated, otherwise IP
    let rateLimit;
    if (userId) {
      rateLimit = await checkRateLimitByUser(userId);
    } else {
      const clientIP = getClientIP(request);
      rateLimit = await checkRateLimit(clientIP);
    }

    if (!rateLimit.allowed) {
      const resetTime = new Date(rateLimit.resetAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
      return NextResponse.json(
        {
          error: `Rate limit exceeded. Please wait until ${resetTime} to post again.`,
          code: 'RATE_LIMIT_EXCEEDED',
          remaining: rateLimit.remaining,
          resetAt: rateLimit.resetAt,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetAt.toISOString(),
          },
        }
      );
    }

    // Content moderation using AI
    const moderation = await moderateContent(commentBody, author);

    if (!moderation.approved) {
      // Log flagged content for review (but don't block - fail open for now)
      // In production, you might want to block or send to moderation queue
      console.warn('Content flagged:', {
        author,
        userId,
        flags: moderation.flags,
        reason: moderation.reason,
        confidence: moderation.confidence,
      });

      // Return error with specific reason
      return NextResponse.json(
        {
          error: moderation.reason || 'Your comment does not meet our community guidelines. Please ensure your comment is supportive and appropriate for a recovery community.',
          code: 'CONTENT_NOT_APPROVED',
          flags: moderation.flags,
        },
        { status: 400 }
      );
    }

    const { comments } = await getBigBookCollections();

    // Build path array for threading
    let path = [];
    if (parentId) {
      // Verify parent exists
      const parent = await comments
        .findOne({ _id: new ObjectId(parentId), pageNumber });

      if (!parent) {
        return NextResponse.json(
          { error: 'Parent comment not found.' },
          { status: 404 }
        );
      }

      // Build path from parent's path
      path = [...(parent.path || []), parentId];
    }

    const commentDoc = {
      editionId: BIG_BOOK_EDITION_ID,
      pageNumber,
      parentId: parentId ? new ObjectId(parentId) : null,
      path: path.map(id => new ObjectId(id)),
      author,
      quote,
      body: commentBody,
      userId,
      createdAt: new Date(),
      // Store moderation info for audit trail
      moderationPassed: true,
      moderationTimestamp: new Date(),
    };

    const result = await comments.insertOne(commentDoc);

    // Return the created comment (without moderation metadata)
    const createdComment = {
      id: result.insertedId.toString(),
      pageNumber: commentDoc.pageNumber,
      parentId: commentDoc.parentId ? commentDoc.parentId.toString() : null,
      path: commentDoc.path.map(id => id.toString()),
      author: commentDoc.author,
      quote: commentDoc.quote,
      body: commentDoc.body,
      createdAt: commentDoc.createdAt,
    };

    return NextResponse.json(createdComment, {
      status: 201,
      headers: {
        'X-RateLimit-Remaining': (rateLimit.remaining - 1).toString(),
        'X-RateLimit-Reset': rateLimit.resetAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error creating Big Book comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment.' },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    // Check feature flag
    if (!getFeatureFlag('BIGBOOK', 'COMMENTS')) {
      return NextResponse.json(
        { error: 'Big Book comments feature is not enabled.' },
        { status: 404 },
      );
    }

    const session = await getSession(request);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be signed in to delete comments.' },
        { status: 401 }
      );
    }

    const userId = resolveSessionUserId(session);
    const body = await request.json();
    const commentId = body?.commentId;

    if (!commentId) {
      return NextResponse.json(
        { error: 'commentId is required.' },
        { status: 400 }
      );
    }

    const { comments } = await getBigBookCollections();

    // Fetch comment to check ownership
    const comment = await comments.findOne({
      _id: new ObjectId(commentId)
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found.' },
        { status: 404 }
      );
    }

    // Check if user owns the comment or has admin rights
    const isAdmin = session?.user?.role === 'admin';
    const isOwner = comment.userId && comment.userId === userId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this comment.' },
        { status: 403 }
      );
    }

    // Delete the comment
    const result = await comments.deleteOne({
      _id: new ObjectId(commentId),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Comment not found or already deleted.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting Big Book comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment.' },
      { status: 500 },
    );
  }
}