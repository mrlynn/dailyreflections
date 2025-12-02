# LLM Response Caching Implementation

This document describes the caching system implemented for LLM responses to reduce API costs and improve response times.

## Overview

The caching system stores LLM responses in MongoDB and serves them for repeated queries, avoiding expensive API calls to OpenAI.

## Components

### 1. Cache Utility (`src/lib/responseCache.js`)

Core caching functions:

- **`getCachedResponse(query, context, maxAgeMs)`** - Retrieve cached response
- **`setCachedResponse(query, context, response, citations, metadata, ttlDays)`** - Store response
- **`invalidateCache(criteria)`** - Remove cache entries
- **`invalidateDateCache(dateKey)`** - Invalidate specific date's cache
- **`cleanExpiredCache()`** - Remove expired entries
- **`getCacheStats()`** - Get cache performance statistics
- **`warmCache(commonQuestions)`** - Pre-populate cache

### 2. Chatbot API Integration (`src/app/api/chatbot/query/route.js`)

The chatbot API now:
1. Checks cache BEFORE calling LLM (after crisis detection)
2. Returns cached response if found (with hit tracking)
3. Stores new responses in cache for future use

### 3. Cache Management API (`src/app/api/cache/manage/route.js`)

Admin-only endpoints:

**GET /api/cache/manage** - View cache statistics
```json
{
  "stats": {
    "totalEntries": 150,
    "totalHits": 1250,
    "avgHits": 8.3,
    "topQueries": [...]
  }
}
```

**POST /api/cache/manage** - Manage cache

Actions:
- `clean` - Remove expired entries
- `invalidate` - Remove entries matching criteria
- `invalidate_date` - Remove entries for specific date

Examples:
```bash
# Clean expired cache
curl -X POST /api/cache/manage \
  -H "Content-Type: application/json" \
  -d '{"action": "clean"}'

# Invalidate cache for a specific date
curl -X POST /api/cache/manage \
  -H "Content-Type: application/json" \
  -d '{"action": "invalidate_date", "dateKey": "11-28"}'

# Invalidate all cache
curl -X POST /api/cache/manage \
  -H "Content-Type: application/json" \
  -d '{"action": "invalidate"}'
```

### 4. Cache Warming API (`src/app/api/cache/warm/route.js`)

Pre-populates cache with common questions.

**Usage:**
```bash
# Warm the cache (admin only)
curl -X POST /api/cache/warm \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie"
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully warmed 5 cache entries",
  "totalQuestions": 5,
  "warmedCount": 5
}
```

**Common questions included:**
- What are the 12 steps of AA?
- What is a higher power in AA?
- How do I find an AA meeting near me?
- What is the difference between a sponsor and a friend?
- What should I do if I relapsed?

## Database Schema

### Collection: `response_cache`

```javascript
{
  _id: ObjectId,
  cacheKey: String,              // SHA-256 hash of query + context
  query: String,                  // Original query text
  normalizedQuery: String,        // Lowercase trimmed query
  queryEmbedding: Array,          // 1536-dim vector for semantic search
  context: Object,                // Context object (dateKey, etc.)
  response: String,               // LLM's response
  citations: Array,               // Citations/sources
  metadata: Object,               // Additional metadata
  expiresAt: Date,                // TTL expiration
  createdAt: Date,                // Cache entry creation
  lastAccessedAt: Date,           // Last time cache was hit
  hits: Number,                   // Number of times served from cache
}
```

**Indexes:**
```javascript
// Standard indexes
db.response_cache.createIndex({ cacheKey: 1 }, { unique: true });
db.response_cache.createIndex({ expiresAt: 1 });
db.response_cache.createIndex({ "context.dateKey": 1 });
db.response_cache.createIndex({ hits: -1 });
db.response_cache.createIndex({ normalizedQuery: "text" });

// Vector search index (Atlas Search)
db.response_cache.createSearchIndex(
  "query_vector_index",
  "vectorSearch",
  {
    fields: [
      {
        type: "vector",
        path: "queryEmbedding",
        numDimensions: 1536,
        similarity: "cosine"
      }
    ]
  }
);
```

## Cache Strategy

### Semantic Matching with Embeddings 🎯

The cache uses **semantic similarity matching** via OpenAI embeddings to match questions that are similar in meaning but worded differently. This dramatically improves cache hit rates!

**How it works:**
1. **Exact Match First**: Checks for identical query + context (fastest, ~10ms)
2. **Semantic Fallback**: Uses vector search to find similar questions (fast, ~50ms)
3. **Similarity Threshold**: Returns cached response if similarity ≥ 85%

**Example semantic matches:**
- "What are the 12 steps?" → "Tell me about the twelve steps of AA"
- "How do I find a meeting?" → "Where can I locate AA meetings near me?"
- "What is step 4?" → "Explain the fourth step to me"

**Benefits:**
- 🚀 **Higher cache hit rate**: ~60-80% (vs ~20-30% with exact match only)
- 💰 **More cost savings**: Fewer OpenAI API calls
- ⚡ **Better UX**: More questions answered instantly

### What Gets Cached

✅ **Cached:**
- General questions about AA principles
- Questions about specific reflections
- Frequently asked questions
- Step-related queries

❌ **NOT Cached:**
- Crisis/suicidal queries (always fresh response)
- User-specific questions requiring personal context
- Queries with extensive chat history (context-dependent)

### Cache Keys & Embeddings

**Exact Match Cache Keys:**
Cache keys are generated from:
1. Normalized query (lowercase, trimmed)
2. Context object (sorted keys for consistency)
3. SHA-256 hash for uniqueness

Example:
```javascript
Query: "What is Step 4?"
Context: { hasHistory: false }
Cache Key: "a3f5b7c9d2e4f6a8b1c3d5e7f9a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8"
```

**Semantic Search Embeddings:**
Each cached query also includes:
- `queryEmbedding`: 1536-dimensional vector from OpenAI `text-embedding-3-small`
- MongoDB vector search index for fast similarity search
- Cosine similarity metric (0-1 scale, higher = more similar)

### TTL (Time To Live)

Default TTLs by category:
- **Fundamentals**: 90 days (12 steps, higher power, etc.)
- **Practical**: 30 days (meetings, resources)
- **Crisis Support**: 30 days (relapse, help)
- **Date-specific**: 30 days (reflections)
- **General**: 30 days (default)

## Performance Benefits

### Cost Savings

**Without Cache:**
- Average query: ~$0.002 (GPT-4)
- 1000 queries/day: ~$2/day = $60/month

**With Exact Match Cache (30% hit rate):**
- Cached queries: $0
- New queries (70%): ~$1.40/day = $42/month
- **Savings: $18/month (30%)**

**With Semantic Cache (70% hit rate):**
- Cached queries: $0
- New queries (30%): ~$0.60/day = $18/month
- **Savings: $42/month (70%)** 🎉

**Embedding Cost:**
- `text-embedding-3-small`: ~$0.0001 per query
- 1000 queries/day: ~$0.10/day = $3/month
- **Net savings: $39/month (65%)**

### Response Time

- **Exact cache hit**: ~10-20ms (hash lookup)
- **Semantic cache hit**: ~50-100ms (vector search + embedding generation)
- **Cache miss**: ~2-5s (LLM generation + embedding)
- **Improvement**: 20-100x faster for cached responses

## Monitoring

### View Cache Stats

```bash
curl /api/cache/manage
```

Returns:
- Total cache entries
- Total cache hits
- Average hits per entry
- Top 10 most requested queries

### Logs

Cache operations are logged with match type:
```
✅ Exact cache HIT for query: "What are the 12 steps..." (hits: 15)
✅ Semantic cache HIT! Query: "Tell me about the twelve steps" matched "What are the 12 steps of AA?" (similarity: 92.3%)
❌ Cache MISS for query: "Tell me about my specific situation..."
```

## Maintenance

### Automated Cleanup

Set up a daily cron job to clean expired entries:

```bash
# Add to crontab
0 2 * * * curl -X POST https://your-domain.com/api/cache/manage \
  -H "Content-Type: application/json" \
  -d '{"action": "clean"}'
```

### Cache Invalidation

**When to invalidate:**
1. Reflection content updated → `invalidate_date`
2. System prompt changed → `invalidate` (all)
3. Major content updates → `invalidate` with criteria

**Example - Invalidate after reflection update:**
```javascript
// After updating reflection for 11-28
await fetch('/api/cache/manage', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'invalidate_date',
    dateKey: '11-28'
  })
});
```

## Best Practices

1. **Cache warming**: Call `POST /api/cache/warm` (admin) after deployments
2. **Monitor hit rate**: Aim for >60% cache hit rate
3. **Review top queries**: Use stats to identify new common questions
4. **Invalidate thoughtfully**: Don't clear entire cache unnecessarily
5. **Set appropriate TTLs**: Longer for stable content, shorter for dynamic
6. **Handle cache failures gracefully**: System falls back to LLM if cache fails

## Future Enhancements

- [x] **Semantic similarity matching** (cache similar questions) ✅ IMPLEMENTED
- [ ] Distributed caching (Redis for faster lookups)
- [ ] A/B testing cached vs fresh responses
- [ ] User feedback on cached responses
- [ ] Auto-warming based on trending queries
- [ ] Cache preheating based on time of day patterns
- [ ] Adaptive similarity threshold based on query type
- [ ] Multi-language embedding support

## Troubleshooting

### Cache not working?

1. Check MongoDB connection
2. Verify indexes exist
3. Check cache key generation (logs)
4. Ensure TTL hasn't expired

### Low hit rate?

1. Review top queries - are they too varied?
2. Check if semantic search is working (look for "Semantic cache HIT" in logs)
3. Adjust similarity threshold (currently 0.85) - lower = more matches, but less accurate
4. Adjust TTL values - longer TTL = more cache hits
5. Check vector index status: `db.response_cache.getSearchIndexes()`

### Stale responses?

1. Reduce TTL for affected category
2. Invalidate specific entries
3. Add version to cache keys
