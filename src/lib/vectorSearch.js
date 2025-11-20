/**
 * Vector search utilities for semantic search of reflections
 */

import clientPromise from './mongodb';
import { OpenAI } from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate an embedding for a text query
 * @param {string} text - The text to generate an embedding for
 * @returns {Promise<number[]>} - The embedding as an array of floats
 */
export async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

/**
 * Search for reflections using vector similarity
 *
 * @param {string|number[]} query - Text query or pre-generated embedding vector
 * @param {Object} options - Search options
 * @param {number} [options.limit=5] - Maximum number of results to return
 * @param {number} [options.minScore=0.7] - Minimum similarity score (0-1)
 * @param {boolean} [options.useExistingEmbedding=false] - Whether query is already an embedding
 * @returns {Promise<Array>} - Matched reflections
 */
export async function searchReflections(query, options = {}) {
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

    // Log the query for debugging
    console.log(`Vector search for: "${query.substring ? query.substring(0, 50) : 'Existing embedding'}...", dimensions: ${Array.isArray(embedding) ? embedding.length : 'unknown'}`);

    // Connect to database - IMPORTANT: Use the correct database name
    const client = await clientPromise;
    const db = client.db('dailyreflections');

    try {
      // Define the vector search aggregate pipeline
      // NOTE: $meta can only be used in $project and $sort, NOT in $match
      const pipeline = [
        {
          $vectorSearch: {
            index: 'reflections_vector_index', // Index name in MongoDB Atlas
            path: 'embedding',
            queryVector: embedding,
            numCandidates: Math.max(limit * 10, 100), // Higher value for better recall
            limit: limit * 3, // Get more than we need for post-filtering (increased)
          },
        },
        // Project fields including the vector search score
        // This MUST come before any filtering or sorting that uses the score
        {
          $project: {
            _id: 1,
            title: 1,
            quote: 1,
            comment: 1,
            commentCleaned: 1,
            reference: 1,
            month: 1,
            day: 1,
            dateKey: 1,
            score: { $meta: 'vectorSearchScore' }, // This is where we capture the score
          },
        },
        // Filter results above minimum score AFTER projecting the score
        // Vector search scores are typically between 0 and 1 (cosine similarity)
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

      console.log('Executing vector search pipeline with:', {
        index: 'reflections_vector_index',
        embeddingDimensions: embedding.length,
        limit: limit,
        minScore: minScore,
      });

      // Execute search
      const results = await db.collection('reflections').aggregate(pipeline).toArray();
      
      console.log(`Vector search returned ${results.length} results`);
      if (results.length > 0) {
        console.log(`Top result score: ${results[0].score}`);
      }
      
      return results;
    } catch (vectorError) {
      console.error('Vector search failed, falling back to text search:', vectorError.message);

      // Fallback to MongoDB text search when vector search is not available
      if (typeof query === 'string') {
        console.log('Using enhanced text search fallback for:', query);

        // Try MongoDB text index search first
        try {
          // Prepare search terms - handle phrases and individual words
          const searchTerms = query.trim();

          console.log('Performing MongoDB $text search');
          const textSearchResults = await db.collection('reflections')
            .find(
              { $text: { $search: searchTerms } },
              { score: { $meta: "textScore" } }
            )
            .sort({ score: { $meta: "textScore" } })
            .limit(limit)
            .toArray();

          if (textSearchResults.length > 0) {
            console.log(`Found ${textSearchResults.length} results using MongoDB text search`);
            // Normalize scores to be between 0-1 for consistency with vector search
            const maxScore = Math.max(...textSearchResults.map(doc => doc.score || 0));
            return textSearchResults.map(doc => ({
              ...doc,
              score: maxScore > 0 ? (doc.score / maxScore) * 0.95 : 0.8 // Scale to max 0.95 to indicate text search
            }));
          }
        } catch (textIndexError) {
          console.log('MongoDB text search failed, likely missing text index:', textIndexError.message);
        }

        // Fallback to regex search if text search fails or returns no results
        console.log('Falling back to regex search');
        const regexResults = await db.collection('reflections').find({
          $or: [
            { title: { $regex: query, $options: 'i' } },
            { quote: { $regex: query, $options: 'i' } },
            { comment: { $regex: query, $options: 'i' } },
            { reference: { $regex: query, $options: 'i' } }
          ]
        }).limit(limit).toArray();

        console.log(`Found ${regexResults.length} results using regex search`);

        // Add a basic score for each result (1.0 for exact title match, 0.8 otherwise)
        return regexResults.map(doc => ({
          ...doc,
          score: doc.title.toLowerCase().includes(query.toLowerCase()) ? 0.9 : 0.7
        }));
      }

      // If it's not a string query (e.g., sourceDate), just re-throw
      throw vectorError;
    }
  } catch (error) {
    console.error('Error in vector search:', error);
    throw new Error('Vector search failed');
  }
}

/**
 * Get a reflection's embedding by date key (MM-DD)
 *
 * @param {string} dateKey - Date key in MM-DD format
 * @returns {Promise<number[]>} - The reflection's embedding vector
 */
export async function getReflectionEmbedding(dateKey) {
  try {
    const [month, day] = dateKey.split('-').map(Number);

    const client = await clientPromise;
    const db = client.db('dailyreflections');

    const reflection = await db.collection('reflections').findOne(
      { month, day },
      { projection: { embedding: 1 } }
    );

    if (!reflection || !reflection.embedding) {
      throw new Error('Reflection not found or has no embedding');
    }

    return reflection.embedding;
  } catch (error) {
    console.error('Error getting reflection embedding:', error);
    throw new Error('Failed to get reflection embedding');
  }
}

/**
 * Find similar reflections to a specific date's reflection
 *
 * @param {string} dateKey - Source reflection date key (MM-DD format)
 * @param {Object} options - Search options as per searchReflections
 * @returns {Promise<Array>} - Similar reflections
 */
export async function findSimilarReflections(dateKey, options = {}) {
  try {
    console.log(`Finding similar reflections to date: ${dateKey}`);

    // Get the source reflection's embedding
    const embedding = await getReflectionEmbedding(dateKey);

    // Search for similar reflections using the embedding
    return await searchReflections(embedding, {
      ...options,
      useExistingEmbedding: true
    });
  } catch (error) {
    console.error('Error finding similar reflections:', error);

    // Fallback: Return random reflections if vector search fails
    try {
      console.log('Using fallback for similar reflections - returning random entries');
      const client = await clientPromise;
      const db = client.db('dailyreflections');

      // Get the source reflection to exclude it from results
      const [month, day] = dateKey.split('-').map(Number);

      // Get the source reflection to use its title and content for text search
      const sourceReflection = await db.collection('reflections').findOne(
        { month, day },
        { projection: { title: 1, quote: 1, comment: 1 } }
      );

      let similarReflections = [];

      // If we have the source reflection, use text search to find similar ones
      if (sourceReflection) {
        console.log('Using text-based similarity for fallback with source:', sourceReflection.title);

        // Extract meaningful terms from the title and quote
        const searchTerms = `${sourceReflection.title} ${sourceReflection.quote.substring(0, 100)}`;

        try {
          // First try text index search if available
          similarReflections = await db.collection('reflections')
            .find(
              {
                $and: [
                  { $text: { $search: searchTerms } },
                  { $or: [{ month: { $ne: month } }, { day: { $ne: day } }] } // Exclude source
                ]
              },
              { score: { $meta: "textScore" } }
            )
            .sort({ score: { $meta: "textScore" } })
            .limit(options.limit || 3)
            .toArray();

          if (similarReflections.length > 0) {
            console.log(`Found ${similarReflections.length} similar reflections using text search`);
          }
        } catch (textSearchError) {
          console.log('Text search failed, will try random sample');
        }
      }

      // If text search failed or found nothing, fall back to random sample
      if (similarReflections.length === 0) {
        console.log('Using random sampling as last resort fallback');
        similarReflections = await db.collection('reflections')
          .aggregate([
            { $match: { $or: [{ month: { $ne: month } }, { day: { $ne: day } }] } },
            { $sample: { size: options.limit || 3 } },
            { $project: { _id: 1, title: 1, quote: 1, comment: 1, reference: 1, month: 1, day: 1 } }
          ])
          .toArray();
      }

      // Add an artificial score to each result
      return similarReflections.map(doc => ({
        ...doc,
        // If it already has a score from text search, normalize it to 0-1 range
        score: doc.score ? Math.min(doc.score / 10, 0.95) : 0.75 // Medium-high score so they appear relevant
      }));
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      throw new Error('Failed to find similar reflections');
    }
  }
}