import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { checkRateLimit, checkRateLimitByUser, getClientIP } from '@/lib/rateLimiter';
import { moderateContent, quickProfanityCheck } from '@/lib/contentModeration';

/**
 * GET /api/comments?dateKey=MM-DD
 * Fetch all comments for a specific date
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateKey = searchParams.get('dateKey');

    if (!dateKey) {
      return NextResponse.json(
        { error: 'dateKey parameter is required.' },
        { status: 400 }
      );
    }

    // Validate dateKey format
    if (!/^\d{2}-\d{2}$/.test(dateKey)) {
      return NextResponse.json(
        { error: 'Invalid dateKey format. Expected MM-DD.' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('dailyreflections');

    // Fetch all comments for this date, sorted by creation time
    const comments = await db
      .collection('comments')
      .find({ dateKey })
      .sort({ createdAt: 1 })
      .toArray();

    // Convert ObjectIds to strings
    const results = comments.map(comment => ({
      ...comment,
      _id: comment._id.toString(),
      parentId: comment.parentId ? comment.parentId.toString() : null,
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/comments
 * Create a new comment
 * Body: { dateKey, parentId (optional), author, body }
 */
export async function POST(request) {
  try {
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
    const { dateKey, parentId, body: commentBody } = body;

    // Use authenticated user info (required)
    // Use displayName for comments, falling back to name or email
    const finalAuthor = session.user.displayName || session.user.name || session.user.email;
    const userId = session.user.id;

    // Validation
    if (!dateKey || !commentBody) {
      return NextResponse.json(
        { error: 'dateKey and body are required.' },
        { status: 400 }
      );
    }

    // Validate dateKey format
    if (!/^\d{2}-\d{2}$/.test(dateKey)) {
      return NextResponse.json(
        { error: 'Invalid dateKey format. Expected MM-DD.' },
        { status: 400 }
      );
    }

    // Quick client-side profanity/spam check
    const quickCheck = quickProfanityCheck(commentBody) || quickProfanityCheck(finalAuthor);
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
    const moderation = await moderateContent(commentBody, finalAuthor);
    
    if (!moderation.approved) {
      // Log flagged content for review (but don't block - fail open for now)
      // In production, you might want to block or send to moderation queue
      console.warn('Content flagged:', {
        author: finalAuthor,
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

    // Truncate excessive content
    const truncatedAuthor = finalAuthor.substring(0, 50);
    const truncatedBody = commentBody.substring(0, 2000);

    const client = await clientPromise;
    const db = client.db('dailyreflections');

    // Build path array for threading
    let path = [];
    if (parentId) {
      // Verify parent exists
      const parent = await db
        .collection('comments')
        .findOne({ _id: new ObjectId(parentId), dateKey });
      
      if (!parent) {
        return NextResponse.json(
          { error: 'Parent comment not found.' },
          { status: 404 }
        );
      }

      // Build path from parent's path
      path = [...(parent.path || []), parentId];
    }

    const comment = {
      dateKey,
      parentId: parentId || null,
      path,
      author: truncatedAuthor,
      body: truncatedBody,
      userId: userId || null, // Store userId if authenticated
      createdAt: new Date(),
      // Store moderation info for audit trail
      moderationPassed: true,
      moderationTimestamp: new Date(),
    };

    const result = await db.collection('comments').insertOne(comment);

    // Return the created comment (without moderation metadata)
    const createdComment = {
      dateKey: comment.dateKey,
      parentId: comment.parentId ? comment.parentId.toString() : null,
      path: comment.path,
      author: comment.author,
      body: comment.body,
      createdAt: comment.createdAt,
      _id: result.insertedId.toString(),
    };

    return NextResponse.json(createdComment, { 
      status: 201,
      headers: {
        'X-RateLimit-Remaining': (rateLimit.remaining - 1).toString(),
        'X-RateLimit-Reset': rateLimit.resetAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/comments
 * Delete a comment by ID
 * Body: { commentId }
 */
export async function DELETE(request) {
  try {
    const body = await request.json();
    const { commentId } = body;

    if (!commentId) {
      return NextResponse.json(
        { error: 'commentId is required.' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('dailyreflections');

    // Delete the comment and all replies
    const result = await db.collection('comments').deleteOne({
      _id: new ObjectId(commentId),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Comment not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment.' },
      { status: 500 }
    );
  }
}

