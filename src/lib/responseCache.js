import { createHash } from 'crypto';
import clientPromise from '@/lib/mongodb';

/**
 * Response Cache for LLM queries
 * Stores cached responses in MongoDB for faster retrieval and cost savings
 */

/**
 * Generate a cache key from the query and context
 * Uses a hash to create a consistent key for similar queries
 *
 * @param {string} query - The user's question
 * @param {Object} context - Context object (e.g., dateKey, userId)
 * @returns {string} - Cache key
 */
export function generateCacheKey(query, context = {}) {
  // Normalize the query
  const normalizedQuery = query.toLowerCase().trim();

  // Create a deterministic string from context
  const contextStr = JSON.stringify(
    Object.keys(context).sort().reduce((acc, key) => {
      acc[key] = context[key];
      return acc;
    }, {})
  );

  // Combine and hash
  const combined = `${normalizedQuery}:${contextStr}`;
  return createHash('sha256').update(combined).digest('hex');
}

/**
 * Get cached response if it exists and is still valid
 *
 * @param {string} query - The user's question
 * @param {Object} context - Context object
 * @param {number} maxAgeMs - Maximum age of cache in milliseconds (default: 7 days)
 * @returns {Promise<Object|null>} - Cached response or null
 */
export async function getCachedResponse(query, context = {}, maxAgeMs = 7 * 24 * 60 * 60 * 1000) {
  try {
    const client = await clientPromise;
    const db = client.db('dailyreflections');
    const cacheKey = generateCacheKey(query, context);

    const cached = await db.collection('response_cache').findOne({
      cacheKey,
      expiresAt: { $gt: new Date() },
    });

    if (!cached) {
      return null;
    }

    // Check if cache is still fresh
    const age = Date.now() - cached.createdAt.getTime();
    if (age > maxAgeMs) {
      return null;
    }

    // Update hit count and last accessed time
    await db.collection('response_cache').updateOne(
      { cacheKey },
      {
        $inc: { hits: 1 },
        $set: { lastAccessedAt: new Date() },
      }
    );

    return {
      response: cached.response,
      citations: cached.citations,
      metadata: cached.metadata,
      cacheHit: true,
      cachedAt: cached.createdAt,
      hits: cached.hits + 1,
    };
  } catch (error) {
    console.error('Error retrieving cached response:', error);
    return null;
  }
}

/**
 * Store a response in the cache
 *
 * @param {string} query - The user's question
 * @param {Object} context - Context object
 * @param {string} response - The LLM's response
 * @param {Array} citations - Citations/sources used
 * @param {Object} metadata - Additional metadata
 * @param {number} ttlDays - Time to live in days (default: 30)
 * @returns {Promise<boolean>} - Success status
 */
export async function setCachedResponse(query, context = {}, response, citations = [], metadata = {}, ttlDays = 30) {
  try {
    const client = await clientPromise;
    const db = client.db('dailyreflections');
    const cacheKey = generateCacheKey(query, context);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ttlDays);

    await db.collection('response_cache').updateOne(
      { cacheKey },
      {
        $set: {
          cacheKey,
          query,
          normalizedQuery: query.toLowerCase().trim(),
          context,
          response,
          citations,
          metadata,
          expiresAt,
          createdAt: new Date(),
          lastAccessedAt: new Date(),
        },
        $setOnInsert: {
          hits: 0,
        },
      },
      { upsert: true }
    );

    return true;
  } catch (error) {
    console.error('Error storing cached response:', error);
    return false;
  }
}

/**
 * Invalidate cache entries matching certain criteria
 * Useful when content updates (e.g., reflection data changes)
 *
 * @param {Object} criteria - MongoDB query criteria
 * @returns {Promise<number>} - Number of entries invalidated
 */
export async function invalidateCache(criteria = {}) {
  try {
    const client = await clientPromise;
    const db = client.db('dailyreflections');

    const result = await db.collection('response_cache').deleteMany(criteria);
    return result.deletedCount;
  } catch (error) {
    console.error('Error invalidating cache:', error);
    return 0;
  }
}

/**
 * Invalidate cache for a specific date's reflection
 *
 * @param {string} dateKey - Date key (MM-DD format)
 * @returns {Promise<number>} - Number of entries invalidated
 */
export async function invalidateDateCache(dateKey) {
  return invalidateCache({ 'context.dateKey': dateKey });
}

/**
 * Clean up expired cache entries
 * Should be run periodically (e.g., daily cron job)
 *
 * @returns {Promise<number>} - Number of entries removed
 */
export async function cleanExpiredCache() {
  try {
    const client = await clientPromise;
    const db = client.db('dailyreflections');

    const result = await db.collection('response_cache').deleteMany({
      expiresAt: { $lt: new Date() },
    });

    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning expired cache:', error);
    return 0;
  }
}

/**
 * Get cache statistics
 *
 * @returns {Promise<Object>} - Cache statistics
 */
export async function getCacheStats() {
  try {
    const client = await clientPromise;
    const db = client.db('dailyreflections');

    const [totalEntries, hitStats, topQueries] = await Promise.all([
      db.collection('response_cache').countDocuments(),
      db.collection('response_cache').aggregate([
        {
          $group: {
            _id: null,
            totalHits: { $sum: '$hits' },
            avgHits: { $avg: '$hits' },
          },
        },
      ]).toArray(),
      db.collection('response_cache').find()
        .sort({ hits: -1 })
        .limit(10)
        .project({ query: 1, hits: 1, context: 1 })
        .toArray(),
    ]);

    return {
      totalEntries,
      totalHits: hitStats[0]?.totalHits || 0,
      avgHits: hitStats[0]?.avgHits || 0,
      topQueries,
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return null;
  }
}

/**
 * Pre-warm cache with common questions
 * Useful for anticipating common user queries
 *
 * @param {Array} commonQuestions - Array of {query, context, response, citations}
 * @returns {Promise<number>} - Number of entries warmed
 */
export async function warmCache(commonQuestions) {
  let warmed = 0;

  for (const item of commonQuestions) {
    const success = await setCachedResponse(
      item.query,
      item.context || {},
      item.response,
      item.citations || [],
      { preWarmed: true, ...item.metadata },
      item.ttlDays || 30
    );

    if (success) warmed++;
  }

  return warmed;
}
