/**
 * Unified search utility for chatbot queries
 * Searches across both AA Big Book content and Daily Reflections
 * Using OpenAI embeddings (1536 dimensions)
 */

import clientPromise from './mongodb';
import { OpenAI } from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Search across both AA Big Book content and Daily Reflections
 * @param {string|number[]} query - Text query or pre-generated embedding
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Combined search results
 */
export async function searchCombinedSources(query, options = {}) {
  const {
    limit = 5,
    minScore = 0.65,
    useExistingEmbedding = false,
  } = options;

  try {
    // Get embedding from query (if not already provided)
    let embedding;
    if (useExistingEmbedding && Array.isArray(query)) {
      embedding = query;
    } else if (typeof query === 'string') {
      // Generate embedding using OpenAI
      try {
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: query,
        });
        embedding = response.data[0].embedding;
      } catch (error) {
        console.error('Error generating OpenAI embedding:', error);
        throw new Error('Failed to generate embedding');
      }
    } else {
      throw new Error('Query must be a string or an embedding array');
    }

    // Connect to database
    const client = await clientPromise;
    const db = client.db('dailyreflections');

    // Search in both collections
    const [bigBookResults, reflectionsResults] = await Promise.all([
      searchBigBookContent(db, embedding, { limit, minScore }),
      searchReflectionContent(db, embedding, { limit, minScore })
    ]);

    // Combine and sort results by relevance score
    const combinedResults = [...bigBookResults, ...reflectionsResults]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return combinedResults;
  } catch (error) {
    console.error('Error in combined search:', error);
    throw new Error('Combined search failed');
  }
}

/**
 * Search AA Big Book content
 * @param {Object} db - MongoDB database connection
 * @param {number[]} embedding - Query embedding
 * @param {Object} options - Search options
 * @returns {Promise<Array>} - Search results
 */
async function searchBigBookContent(db, embedding, options) {
  const { limit, minScore } = options;

  try {
    // Define the vector search aggregate pipeline
    const pipeline = [
      {
        $vectorSearch: {
          index: 'text_vector_index', // Index name for Big Book content
          path: 'embedding',
          queryVector: embedding,
          numCandidates: Math.max(limit * 10, 100),
          limit: limit * 2,
        },
      },
      // Project fields including the vector search score
      {
        $project: {
          _id: 0,
          text: 1,
          page_number: 1,
          chunk_id: 1,
          source: 1, // Should be 'AA Big Book 4th Edition'
          score: { $meta: 'vectorSearchScore' },
        },
      },
      // Filter results above minimum score
      {
        $match: {
          score: { $gte: minScore }
        },
      },
      // Sort by similarity score
      {
        $sort: {
          score: -1,
        },
      },
      // Limit results
      {
        $limit: limit,
      },
    ];

    // Execute search
    const results = await db.collection('text_chunks').aggregate(pipeline).toArray();

    // Format results for consistency
    return results.map(result => ({
      ...result,
      reference: `Big Book, Page ${result.page_number}`,
      url: null, // No direct URL for Big Book pages yet
    }));
  } catch (error) {
    console.error('Error searching Big Book content:', error);
    return []; // Return empty array on error
  }
}

/**
 * Search Daily Reflections content
 * @param {Object} db - MongoDB database connection
 * @param {number[]} embedding - Query embedding
 * @param {Object} options - Search options
 * @returns {Promise<Array>} - Search results
 */
async function searchReflectionContent(db, embedding, options) {
  const { limit, minScore } = options;

  try {
    // Define the vector search aggregate pipeline
    const pipeline = [
      {
        $vectorSearch: {
          index: 'reflections_vector_index', // Index name for Daily Reflections
          path: 'embedding',
          queryVector: embedding,
          numCandidates: Math.max(limit * 10, 100),
          limit: limit * 2,
        },
      },
      // Project fields including the vector search score
      {
        $project: {
          _id: 0,
          title: 1,
          quote: 1,
          comment: 1,
          reference: 1,
          month: 1,
          day: 1,
          dateKey: 1,
          score: { $meta: 'vectorSearchScore' },
          source: { $literal: 'Daily Reflection' },
        },
      },
      // Filter results above minimum score
      {
        $match: {
          score: { $gte: minScore }
        },
      },
      // Sort by similarity score
      {
        $sort: {
          score: -1,
        },
      },
      // Limit results
      {
        $limit: limit,
      },
    ];

    // Execute search
    const results = await db.collection('reflections').aggregate(pipeline).toArray();

    // Format results for consistency
    return results.map(result => {
      // Format date as "Month Day" (e.g., "January 1")
      const months = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
      const formattedDate = `${months[result.month - 1]} ${result.day}`;

      // Create a composite text from title, quote, and comment for searching
      const text = `${result.title}\n\n${result.quote}\n\n${result.comment}`;

      return {
        ...result,
        text, // Add text field for consistency with Big Book results
        reference: `Daily Reflection, ${formattedDate} - ${result.title}`,
        url: `/${result.dateKey}`, // URL to the specific reflection
      };
    });
  } catch (error) {
    console.error('Error searching Reflection content:', error);
    return []; // Return empty array on error
  }
}

/**
 * Format citations for display in the chatbot UI
 * @param {Array} results - Search results from combined search
 * @returns {Array} - Formatted citations
 */
export function formatCitations(results) {
  return results.map(result => ({
    source: result.source,
    reference: result.reference,
    text: result.text?.substring(0, 250) + '...',
    score: parseFloat(result.score.toFixed(4)),
    scorePercentage: `${Math.round(result.score * 100)}%`,
    url: result.url,
  }));
}

/**
 * Create a prompt for LLM with context from search results
 * @param {string} query - User's query
 * @param {Array} results - Search results
 * @param {Array} chatHistory - Chat history
 * @returns {string} - LLM prompt
 */
export function createLLMPrompt(query, results, chatHistory = []) {
  // Format chat history
  const formattedHistory = chatHistory
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n\n');

  // Format search results as context
  const context = results.map((result, i) => {
    const sourceInfo = result.source === 'Daily Reflection'
      ? `Daily Reflection (${result.reference})`
      : `Big Book (Page ${result.page_number})`;

    return `[${i + 1}] From ${sourceInfo}:\n"${result.text}"`;
  }).join('\n\n');

  return `You are a compassionate and knowledgeable recovery assistant for Alcoholics Anonymous.
Your responses should be helpful, supportive, and based on AA literature.

${formattedHistory ? `Recent conversation history:\n${formattedHistory}\n\n` : ''}

Please answer the following question based on the provided excerpts from AA literature:

Question: ${query}

Relevant excerpts (ranked by relevance):
${context}

Instructions:
1. Base your answer only on the provided excerpts and widely known AA principles.
2. Be compassionate, supportive, and non-judgmental in your response.
3. DO NOT invent or assume information not present in the excerpts.
4. When directly referencing content from the excerpts, indicate the source (e.g., "As mentioned in the Big Book, page X..." or "As today's reflection states...").
5. If the excerpts don't contain relevant information, acknowledge this limitation politely.
6. Format your answer in clear, readable paragraphs.
7. Use a warm, supportive tone appropriate for someone in recovery or seeking help.

Your answer:`;
}