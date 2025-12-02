import { createHash } from 'crypto';
import clientPromise from '@/lib/mongodb';
import { generateEmbedding } from '@/lib/vectorSearch';

/**
 * Response Cache for LLM queries
 * Stores cached responses in MongoDB for faster retrieval and cost savings
 * Uses semantic similarity matching via embeddings for improved cache hit rates
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
 * Get cached response using semantic similarity search
 * Finds similar questions even if they're worded differently
 *
 * @param {string} query - The user's question
 * @param {Object} context - Context object
 * @param {Object} options - Search options
 * @param {number} options.minSimilarity - Minimum similarity score (0-1, default: 0.85)
 * @param {number} options.limit - Max results to check (default: 3)
 * @returns {Promise<Object|null>} - Cached response or null
 */
export async function getSemanticCachedResponse(query, context = {}, options = {}) {
  const { minSimilarity = 0.85, limit = 3 } = options;

  try {
    const client = await clientPromise;
    const db = client.db('dailyreflections');

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Create context filter for matching context
    const contextFilter = {
      expiresAt: { $gt: new Date() },
    };

    // Only match exact context if provided (e.g., same dateKey)
    if (context.dateKey) {
      contextFilter['context.dateKey'] = context.dateKey;
    }
    if (context.hasHistory !== undefined) {
      contextFilter['context.hasHistory'] = context.hasHistory;
    }

    // Use MongoDB vector search to find similar questions
    const results = await db.collection('response_cache').aggregate([
      {
        $vectorSearch: {
          index: 'query_vector_index',
          path: 'queryEmbedding',
          queryVector: queryEmbedding,
          numCandidates: 100,
          limit: limit,
        }
      },
      {
        $match: contextFilter
      },
      {
        $addFields: {
          similarityScore: { $meta: 'vectorSearchScore' }
        }
      },
      {
        $match: {
          similarityScore: { $gte: minSimilarity }
        }
      },
      {
        $sort: { similarityScore: -1 }
      }
    ]).toArray();

    if (results.length === 0) {
      return null;
    }

    // Use the most similar result
    const bestMatch = results[0];

    console.log(`✅ Semantic cache HIT! Query: "${query.substring(0, 50)}..." matched "${bestMatch.query.substring(0, 50)}..." (similarity: ${(bestMatch.similarityScore * 100).toFixed(1)}%)`);

    // Update hit count
    await db.collection('response_cache').updateOne(
      { _id: bestMatch._id },
      {
        $inc: { hits: 1 },
        $set: { lastAccessedAt: new Date() },
      }
    );

    return {
      response: bestMatch.response,
      citations: bestMatch.citations,
      metadata: {
        ...bestMatch.metadata,
        semanticMatch: true,
        similarityScore: bestMatch.similarityScore,
        matchedQuery: bestMatch.query,
      },
      cacheHit: true,
      semanticMatch: true,
      cachedAt: bestMatch.createdAt,
      hits: bestMatch.hits + 1,
    };
  } catch (error) {
    console.error('Error in semantic cache search:', error);
    return null;
  }
}

/**
 * Get cached response if it exists and is still valid
 * First tries exact match, then falls back to semantic similarity
 *
 * @param {string} query - The user's question
 * @param {Object} context - Context object
 * @param {number} maxAgeMs - Maximum age of cache in milliseconds (default: 7 days)
 * @param {boolean} useSemanticSearch - Use semantic similarity matching (default: true)
 * @returns {Promise<Object|null>} - Cached response or null
 */
export async function getCachedResponse(query, context = {}, maxAgeMs = 7 * 24 * 60 * 60 * 1000, useSemanticSearch = true) {
  try {
    const client = await clientPromise;
    const db = client.db('dailyreflections');
    const cacheKey = generateCacheKey(query, context);

    // Try exact match first (fastest)
    const cached = await db.collection('response_cache').findOne({
      cacheKey,
      expiresAt: { $gt: new Date() },
    });

    if (cached) {
      // Check if cache is still fresh
      const age = Date.now() - cached.createdAt.getTime();
      if (age <= maxAgeMs) {
        console.log(`✅ Exact cache HIT for query: "${query.substring(0, 50)}..." (hits: ${cached.hits + 1})`);

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
          exactMatch: true,
          cachedAt: cached.createdAt,
          hits: cached.hits + 1,
        };
      }
    }

    // Fall back to semantic search if exact match fails
    if (useSemanticSearch) {
      return await getSemanticCachedResponse(query, context);
    }

    return null;
  } catch (error) {
    console.error('Error retrieving cached response:', error);
    return null;
  }
}

/**
 * Store a response in the cache with semantic embedding
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

    // Generate embedding for semantic search
    let queryEmbedding;
    try {
      queryEmbedding = await generateEmbedding(query);
    } catch (embeddingError) {
      console.error('Error generating embedding for cache:', embeddingError);
      // Continue without embedding - exact match will still work
      queryEmbedding = null;
    }

    const updateDoc = {
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
    };

    // Add embedding if generated successfully
    if (queryEmbedding) {
      updateDoc.queryEmbedding = queryEmbedding;
    }

    await db.collection('response_cache').updateOne(
      { cacheKey },
      {
        $set: updateDoc,
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
