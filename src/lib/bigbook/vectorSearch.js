/**
 * Vector search utilities for Big Book pages
 */

import { getBigBookCollections, BIG_BOOK_VECTOR_INDEX, normalizeVectorResult } from './service';
import { generateEmbedding } from '../vectorSearch';

/**
 * Search Big Book pages using vector similarity
 *
 * @param {string|number[]} query - Text query or pre-generated embedding vector
 * @param {Object} options - Search options
 * @param {number} [options.limit=5] - Maximum number of results to return
 * @param {number} [options.minScore=0.7] - Minimum similarity score (0-1)
 * @param {boolean} [options.useExistingEmbedding=false] - Whether query is already an embedding
 * @returns {Promise<Array>} - Matched Big Book pages
 */
export async function searchBigBookPages(query, options = {}) {
  const {
    limit = 5,
    minScore = 0.7,
    useExistingEmbedding = false,
  } = options;

  try {
    // Get embedding from query (if not already provided)
    let embedding;
    if (useExistingEmbedding && Array.isArray(query)) {
      embedding = query;
    } else if (typeof query === 'string') {
      embedding = await generateEmbedding(query);
    } else {
      throw new Error('Query must be a string or an embedding array');
    }

    console.log(`Big Book vector search for: "${query.substring ? query.substring(0, 50) : 'Existing embedding'}..."`);

    // Get collections
    const { vectors } = await getBigBookCollections();

    try {
      // Define the vector search aggregate pipeline
      const pipeline = [
        {
          $vectorSearch: {
            index: BIG_BOOK_VECTOR_INDEX,
            path: 'embedding',
            queryVector: embedding,
            numCandidates: Math.max(limit * 10, 100), // Higher value for better recall
            limit: limit * 3, // Get more than we need for post-filtering
          },
        },
        // Project fields including the vector search score
        {
          $project: {
            _id: 1,
            pageId: 1,
            pageNumber: 1,
            chapterTitle: 1,
            text: 1,
            score: { $meta: 'vectorSearchScore' }, // Capture the score
          },
        },
        // Filter results above minimum score
        {
          $match: {
            score: { $gte: minScore }
          },
        },
        // Sort by similarity score (highest first)
        {
          $sort: {
            score: -1,
          },
        },
        // Limit results after filtering
        {
          $limit: limit,
        },
      ];

      // Execute search
      const results = await vectors.aggregate(pipeline).toArray();

      console.log(`Big Book vector search returned ${results.length} results`);
      if (results.length > 0) {
        console.log(`Top result score: ${results[0].score}`);
      }

      // Format results
      return results.map(result => {
        const formattedResult = normalizeVectorResult(result);

        return {
          ...formattedResult,
          source: 'Big Book Reader',
          reference: `Big Book, Page ${formattedResult.pageNumber}`,
          url: `/big-book/page/${formattedResult.pageNumber}`,
        };
      });

    } catch (vectorError) {
      console.error('Big Book vector search failed:', vectorError.message);
      return []; // Return empty array on error
    }
  } catch (error) {
    console.error('Error in Big Book vector search:', error);
    return []; // Return empty array on error
  }
}