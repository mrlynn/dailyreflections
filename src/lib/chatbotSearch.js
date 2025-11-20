/**
 * Unified search utility for chatbot queries
 * Searches across AA literature (Big Book, Twelve Steps and Twelve Traditions) and Daily Reflections
 * Using OpenAI embeddings (1536 dimensions)
 */

import clientPromise from './mongodb';
import { OpenAI } from 'openai';
import { searchBigBookPages } from './bigbook/vectorSearch';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Search across AA literature and Daily Reflections
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

    // Search in all collections, with adjusted parameters to favor AA literature
    const [aaLiteratureResults, bigBookResults, reflectionsResults] = await Promise.all([
      // Give AA literature search more results and a lower threshold
      searchAALiteratureContent(db, embedding, {
        limit: Math.ceil(limit * 1.2), // 20% more results from AA literature
        minScore: minScore * 0.95 // 5% lower threshold for AA literature
      }),
      // New: Search in Big Book pages
      searchBigBookPages(query, {
        limit: Math.ceil(limit * 1.2), // Same importance as AA literature
        minScore: minScore * 0.95, // Same threshold as AA literature
        useExistingEmbedding: true, // Reuse the embedding we already generated
      }),
      // Keep reflection search more restrictive
      searchReflectionContent(db, embedding, {
        limit: Math.floor(limit * 0.8), // 20% fewer results from Reflections
        minScore: minScore * 1.05 // 5% higher threshold for Reflections
      })
    ]);

    // Add a source weight boost to AA literature and Big Book results
    const weightedResults = [
      // Give AA literature results a 1.2x score boost to prioritize them
      ...aaLiteratureResults.map(result => ({
        ...result,
        score: result.score * 1.2, // 20% boost for AA literature results
      })),
      // Give Big Book results a 1.2x score boost (same as AA literature)
      ...bigBookResults.map(result => ({
        ...result,
        score: result.score * 1.2, // 20% boost for Big Book results
      })),
      ...reflectionsResults
    ];

    // Combine and sort results by relevance score
    const combinedResults = weightedResults
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return combinedResults;
  } catch (error) {
    console.error('Error in combined search:', error);
    throw new Error('Combined search failed');
  }
}

/**
 * Search AA literature content (Big Book and Twelve Steps and Twelve Traditions)
 * @param {Object} db - MongoDB database connection
 * @param {number[]} embedding - Query embedding
 * @param {Object} options - Search options
 * @returns {Promise<Array>} - Search results
 */
async function searchAALiteratureContent(db, embedding, options) {
  const { limit, minScore } = options;

  try {
    // Define the vector search aggregate pipeline
    const pipeline = [
      {
        $vectorSearch: {
          index: 'text_vector_index', // Index name for AA literature content
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
          source: 1, // 'AA Big Book 4th Edition' or 'AA Twelve Steps and Twelve Traditions'
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
    return results.map(result => {
      // Check if it's Big Book or 12&12
      const isBigBook = result.source === 'AA Big Book 4th Edition';
      const is12And12 = result.source === 'AA Twelve Steps and Twelve Traditions';

      // Create appropriate reference based on source
      let reference = 'AA Literature';
      if (isBigBook) {
        reference = `Big Book, Page ${result.page_number}`;
      } else if (is12And12) {
        reference = `Twelve Steps and Twelve Traditions, Page ${result.page_number}`;
      }

      return {
        ...result,
        reference,
        url: null, // No direct URL for literature pages yet
      };
    });
  } catch (error) {
    console.error('Error searching AA literature content:', error);
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
        text, // Add text field for consistency with literature results
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
 * @param {Object} [todaysReflection] - Today's reflection (optional)
 * @returns {string} - LLM prompt
 */
export function createLLMPrompt(query, results, chatHistory = [], todaysReflection = null) {
  // Format chat history
  const formattedHistory = chatHistory
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n\n');

  // Format search results as context
  const context = results.map((result, i) => {
    let sourceInfo;

    // Determine the source info based on result source
    if (result.source === 'Daily Reflection') {
      sourceInfo = `Daily Reflection (${result.reference})`;
    } else if (result.source === 'AA Big Book 4th Edition') {
      sourceInfo = `Big Book (Page ${result.page_number})`;
    } else if (result.source === 'Big Book Reader') {
      sourceInfo = `Big Book (Page ${result.pageNumber})`;
    } else if (result.source === 'AA Twelve Steps and Twelve Traditions') {
      sourceInfo = `Twelve Steps and Twelve Traditions (Page ${result.page_number})`;
    } else {
      sourceInfo = result.source;
    }

    return `[${i + 1}] From ${sourceInfo}:\n"${result.text}"`;
  }).join('\n\n');

  // Format today's reflection if available
  let todaysReflectionContext = '';
  if (todaysReflection) {
    const date = new Date();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const formattedDate = `${monthNames[date.getMonth()]} ${date.getDate()}`;

    todaysReflectionContext = `
TODAY'S REFLECTION (${formattedDate}):
Title: ${todaysReflection.title}
Quote: "${todaysReflection.quote}"
Reflection: ${todaysReflection.comment}
Reference: ${todaysReflection.reference}
`;
  }

  // Check if the query is about today's reflection
  const isAboutTodaysReflection = /today|today['']?s|current|this/i.test(query.toLowerCase()) &&
                                 /reflection|reading|message|daily/i.test(query.toLowerCase());

  // Check if the query is asking for explanation/meaning
  const isAskingForMeaning = /\b(mean|meaning|explain|interpret|understand|significance|about|thoughts on)\b/i.test(query.toLowerCase());

  // Create the point 10 instruction based on conditions
  let point10 = '';
  if (todaysReflectionContext) {
    if (isAskingForMeaning) {
      point10 = '10. IMPORTANT: Since the user is asking about the meaning of the reflection, provide a detailed explanation of its significance, themes, and recovery lessons. Don\'t just paraphrase, but deeply analyze what the reflection teaches.';
    } else {
      point10 = '10. When discussing today\'s reflection, address the user\'s specific question about it while referencing its key points.';
    }
  }

  // Create the focus instruction based on conditions
  let focusInstruction = '';
  if (todaysReflectionContext) {
    if (isAskingForMeaning) {
      focusInstruction = 'Your answer should focus on EXPLAINING the meaning and significance of today\'s reflection shown above. Analyze its themes, message, and how it relates to recovery principles. Break down the reflection\'s core ideas and what they teach about recovery.';
    } else {
      focusInstruction = 'Your answer should focus primarily on addressing the question about today\'s reflection shown above.';
    }
  }

  // Build the prompt step by step
  let prompt = `You are a compassionate and knowledgeable recovery assistant for Alcoholics Anonymous.
Your responses should be helpful, supportive, and primarily based on AA core literature (Big Book, 12&12).

`;

  if (formattedHistory) {
    prompt += `Recent conversation history:\n${formattedHistory}\n\n`;
  }

  if (todaysReflectionContext) {
    prompt += `${todaysReflectionContext}\n\n`;
  }

  prompt += `Please answer the following question based on the provided excerpts from AA literature:

Question: ${query}\n\n`;

  if (focusInstruction) {
    prompt += `${focusInstruction}\n\n`;
  }

  prompt += `Relevant excerpts (ranked by relevance):
${context}

Instructions:
1. PRIORITIZE the Big Book, Twelve Steps and Twelve Traditions, and other AA core literature excerpts over Daily Reflections when formulating your answer.
2. Base your answer primarily on the provided AA literature excerpts and widely known AA principles.
3. Be compassionate, supportive, and non-judgmental in your response.
4. DO NOT invent or assume information not present in the excerpts.
5. When directly referencing content from the excerpts, indicate the source (e.g., "As mentioned in the Big Book, page X..." or "As stated in the Twelve Steps and Twelve Traditions, page Y..." or "As today's reflection states...").
6. If the excerpts don't contain relevant information, acknowledge this limitation politely.
7. Format your answer in clear, readable paragraphs.
8. Use a warm, supportive tone appropriate for someone in recovery or seeking help.
9. When both AA literature and Daily Reflection content are relevant, give MORE WEIGHT to the AA literature content.`;

  if (point10) {
    prompt += `\n${point10}`;
  }

  prompt += `\n\nYour answer:`;

  return prompt;
}