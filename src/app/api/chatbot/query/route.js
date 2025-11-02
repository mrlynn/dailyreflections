import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { searchCombinedSources, formatCitations, createLLMPrompt } from '@/lib/chatbotSearch';
import { parseDateFromQuery, parseDateKey } from '@/utils/dateUtils';
import clientPromise from '@/lib/mongodb';

// Initialize OpenAI client for generating responses (separate from embedding generation)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Month names for date formatting
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * POST /api/chatbot/query
 * Processes chatbot queries using RAG with AA literature
 *
 * Body parameters:
 * - query: String question from the user
 * - chatHistory: Array of previous messages for context
 *
 * Returns:
 * - response: Generated text response
 * - citations: Array of citations with sources and relevance scores
 */
export async function POST(request) {
  console.log('🤖 API: Chatbot query received');

  try {
    // Parse request body
    const body = await request.json();
    const { query, chatHistory = [] } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query string must not be empty' },
        { status: 400 }
      );
    }

    console.log('📝 Chatbot query:', query);

    // Step 0: Check if query references a specific date reflection
    const dateKey = parseDateFromQuery(query);
    if (dateKey) {
      console.log(`📅 Date detected in query: ${dateKey}`);
      
      try {
        const client = await clientPromise;
        const db = client.db('dailyreflections');
        const { month, day } = parseDateKey(dateKey);
        
        const reflection = await db.collection('reflections').findOne({
          month,
          day,
        });
        
        if (reflection) {
          // Format the reflection for display
          const formattedDate = `${MONTH_NAMES[month - 1]} ${day}`;
          
          // Combine all reflection content
          const reflectionText = `${reflection.title}\n\n${reflection.quote}\n\n${reflection.comment}\n\n${reflection.reference}`;
          
          return NextResponse.json({
            response: `Here's the daily reflection for ${formattedDate}:\n\n${reflectionText}`,
            citations: [{
              source: 'Daily Reflection',
              reference: `Daily Reflection, ${formattedDate} - ${reflection.title}`,
              text: reflectionText.substring(0, 250) + '...',
              score: 1.0,
              scorePercentage: '100%',
              url: `/${dateKey}`,
            }]
          });
        } else {
          // Format date for error message
          const formattedDate = `${MONTH_NAMES[month - 1]} ${day}`;
          
          return NextResponse.json({
            response: `I couldn't find a reflection for ${formattedDate}. The reflection may not exist in the database for that date.`,
            citations: []
          });
        }
      } catch (error) {
        console.error('Error fetching reflection by date:', error);
        // Fall through to regular search if date lookup fails
      }
    }

    // Step 1: Perform vector search across both collections
    const searchResults = await searchCombinedSources(query, {
      limit: 6,
      minScore: 0.6,
    });

    console.log(`✅ Found ${searchResults.length} relevant passages`);

    // If no relevant content found, provide a fallback response
    if (!searchResults || searchResults.length === 0) {
      return NextResponse.json({
        response: "I don't have enough information to answer that question specifically based on AA literature. If you'd like to know more about Alcoholics Anonymous, you might try asking about the 12 steps, the Big Book, or daily reflections.",
        citations: []
      });
    }

    // Step 2: Format citations for the response
    const citations = formatCitations(searchResults);

    // Step 3: Create LLM prompt with context
    const prompt = createLLMPrompt(query, searchResults, chatHistory);

    // Step 4: Generate response using OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4", // Can be adjusted based on needs and availability
      messages: [
        { role: "system", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const generatedText = response.choices[0].message.content.trim();

    console.log('✅ Generated response with citations');

    return NextResponse.json({
      response: generatedText,
      citations: citations
    });
  } catch (error) {
    console.error('❌ API: Error processing chatbot query:', error);

    return NextResponse.json(
      {
        error: 'Failed to process query',
        details: error.message
      },
      { status: 500 }
    );
  }
}