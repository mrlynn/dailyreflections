import clientPromise from '@/lib/mongodb';

/**
 * Rate Limiter Utility
 * Tracks comment submissions by IP address to prevent spam and abuse
 */

const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_COMMENTS_PER_WINDOW = 10; // Maximum comments per IP per hour
const DB_NAME = 'dailyreflections';
const COLLECTION_NAME = 'rateLimits';

/**
 * Check if a user ID has exceeded the rate limit
 * @param {string} userId - User ID
 * @returns {Promise<{allowed: boolean, remaining: number, resetAt: Date}>}
 */
export async function checkRateLimitByUser(userId) {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    const now = new Date();
    const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW);

    // Find or create rate limit record for this user
    const rateLimit = await db.collection(COLLECTION_NAME).findOneAndUpdate(
      { userId },
      {
        $setOnInsert: {
          userId,
          count: 0,
          windowStart: now,
          lastRequest: now,
        },
        $set: {
          lastRequest: now,
        },
      },
      {
        upsert: true,
        returnDocument: 'after',
      }
    );

    // Clean up old entries (outside current window)
    await db.collection(COLLECTION_NAME).deleteMany({
      windowStart: { $lt: windowStart },
      userId: { $exists: true },
    });

    // Check if we need to reset the window
    const timeSinceWindowStart = now.getTime() - rateLimit.windowStart.getTime();
    let currentCount = rateLimit.count || 0;

    if (timeSinceWindowStart > RATE_LIMIT_WINDOW) {
      // Window expired, reset
      await db.collection(COLLECTION_NAME).updateOne(
        { userId },
        {
          $set: {
            count: 0,
            windowStart: now,
          },
        }
      );
      currentCount = 0;
    }

    // Increment count for this request
    const newCount = currentCount + 1;
    await db.collection(COLLECTION_NAME).updateOne(
      { userId },
      {
        $set: {
          count: newCount,
        },
      }
    );

    const remaining = Math.max(0, MAX_COMMENTS_PER_WINDOW - newCount);
    const resetAt = new Date(rateLimit.windowStart.getTime() + RATE_LIMIT_WINDOW);

    return {
      allowed: newCount <= MAX_COMMENTS_PER_WINDOW,
      remaining,
      resetAt,
      count: newCount,
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // On error, allow the request (fail open)
    return {
      allowed: true,
      remaining: MAX_COMMENTS_PER_WINDOW,
      resetAt: new Date(Date.now() + RATE_LIMIT_WINDOW),
      count: 0,
    };
  }
}

/**
 * Check if an IP address has exceeded the rate limit
 * @param {string} ipAddress - Client IP address
 * @returns {Promise<{allowed: boolean, remaining: number, resetAt: Date}>}
 */
export async function checkRateLimit(ipAddress) {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    const now = new Date();
    const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW);

    // Find or create rate limit record for this IP
    const rateLimit = await db.collection(COLLECTION_NAME).findOneAndUpdate(
      { ipAddress },
      {
        $setOnInsert: {
          ipAddress,
          count: 0,
          windowStart: now,
          lastRequest: now,
        },
        $set: {
          lastRequest: now,
        },
      },
      {
        upsert: true,
        returnDocument: 'after',
      }
    );

    // Clean up old entries (outside current window)
    await db.collection(COLLECTION_NAME).deleteMany({
      windowStart: { $lt: windowStart },
    });

    // Check if we need to reset the window
    const timeSinceWindowStart = now.getTime() - rateLimit.windowStart.getTime();
    let currentCount = rateLimit.count || 0;

    if (timeSinceWindowStart > RATE_LIMIT_WINDOW) {
      // Window expired, reset
      await db.collection(COLLECTION_NAME).updateOne(
        { ipAddress },
        {
          $set: {
            count: 0,
            windowStart: now,
          },
        }
      );
      currentCount = 0;
    }

    // Increment count for this request
    const newCount = currentCount + 1;
    await db.collection(COLLECTION_NAME).updateOne(
      { ipAddress },
      {
        $set: {
          count: newCount,
        },
      }
    );

    const remaining = Math.max(0, MAX_COMMENTS_PER_WINDOW - newCount);
    const resetAt = new Date(rateLimit.windowStart.getTime() + RATE_LIMIT_WINDOW);

    return {
      allowed: newCount <= MAX_COMMENTS_PER_WINDOW,
      remaining,
      resetAt,
      count: newCount,
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // On error, allow the request (fail open)
    return {
      allowed: true,
      remaining: MAX_COMMENTS_PER_WINDOW,
      resetAt: new Date(Date.now() + RATE_LIMIT_WINDOW),
      count: 0,
    };
  }
}

/**
 * Get client IP address from request
 * @param {Request} request - Next.js request object
 * @returns {string} IP address
 */
export function getClientIP(request) {
  // Try various headers that might contain the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  // Fallback to connection remote address (if available)
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }

  // Default fallback
  return 'unknown';
}

/**
 * Create rate limit index (run once on startup or via script)
 */
export async function createRateLimitIndex() {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    await db.collection(COLLECTION_NAME).createIndex(
      { ipAddress: 1 },
      { unique: true, name: 'ipAddress_unique' }
    );
    
    await db.collection(COLLECTION_NAME).createIndex(
      { windowStart: 1 },
      { name: 'windowStart_index', expireAfterSeconds: RATE_LIMIT_WINDOW / 1000 }
    );

    console.log('✅ Rate limit indexes created');
  } catch (error) {
    console.error('Error creating rate limit indexes:', error);
  }
}

