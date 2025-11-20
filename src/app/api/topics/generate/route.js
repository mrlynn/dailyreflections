import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { searchCombinedSources } from '@/lib/chatbotSearch';
import { getFeatureFlag } from '@/lib/featureFlags';
import { checkRateLimitByUser, checkRateLimit, getClientIP } from '@/lib/rateLimiter';
import { getSession } from '@/lib/auth';

/**
 * Generates AA meeting topic ideas based on user input using RAG
 * Leverages the existing RAG system to find relevant content from AA literature
 * and generates thoughtful meeting topic ideas based on that content
 */
export async function POST(request) {
  // Check if the feature is enabled
  if (!getFeatureFlag('TOPICS')) {
    return NextResponse.json(
      { error: 'AA Topics feature is not currently available' },
      { status: 404 }
    );
  }

  // Apply rate limiting
  try {
    const session = await getSession(request);
    let rateLimitResult;
    
    if (session?.user?.id) {
      // Use user-based rate limiting for authenticated users
      rateLimitResult = await checkRateLimitByUser(session.user.id);
    } else {
      // Use IP-based rate limiting for anonymous users
      const ip = getClientIP(request);
      rateLimitResult = await checkRateLimit(ip);
    }

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please try again later.',
          resetAt: rateLimitResult.resetAt
        },
        { status: 429 }
      );
    }
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Continue on rate limit errors (fail open)
  }

  try {
    // Parse request body
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string' || query.trim() === '') {
      return NextResponse.json(
        { error: 'Please provide a valid topic, phrase, or keywords' },
        { status: 400 }
      );
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Search AA literature using the existing RAG system
    const searchResults = await searchCombinedSources(query);

    // Format search results for context, including daily reflection links
    const context = searchResults.map(result => {
      let sourceInfo = result.source;
      
      if (result.source === 'Daily Reflection' && result.dateKey) {
        // Include dateKey for daily reflections so AI can reference them
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
        const formattedDate = `${months[result.month - 1]} ${result.day}`;
        sourceInfo = `Daily Reflection (${formattedDate}, dateKey: ${result.dateKey})`;
      } else if (result.page_number) {
        sourceInfo = `${result.source}, Page ${result.page_number}`;
      }
      
      return `
Source: ${sourceInfo}
${result.url ? `URL: ${result.url}` : ''}
Text: ${result.text}
      `.trim();
    }).join('\n\n');

    // Create LLM prompt
    const prompt = `
You are an expert in Alcoholics Anonymous literature and recovery principles. Your task is to generate thoughtful meeting topic ideas based on the user's query and the AA literature context provided.

USER QUERY: ${query}

RELEVANT AA LITERATURE:
${context || "No specific literature found, use your knowledge of AA principles."}

Please generate 5 thoughtful AA meeting topic ideas related to the query. For each topic:
1. Provide a concise title (1-6 words)
2. Write a brief description (1-3 sentences explaining why this would make a good meeting topic)
3. Include a reference to relevant AA literature where applicable (Big Book, 12&12, etc. with page numbers if available from the context)
4. For topics based on Daily Reflections, include the dateKey (MM-DD format) in the reference so users can link to that specific reflection

CRITICAL INSTRUCTION: You MUST format your entire response as a valid JSON object and nothing else. No explanation text, no markdown, just pure JSON with this exact structure:
{
  "topics": [
    {
      "title": "Topic Title",
      "description": "Brief description of why this is a meaningful topic for an AA discussion.",
      "reference": "Source and page number (if available)",
      "dateKey": "MM-DD" // Only include if topic is based on a Daily Reflection (e.g., "01-15" for January 15)
    },
    {
      "title": "Another Topic Title",
      "description": "Another description...",
      "reference": "Another reference...",
      "dateKey": null // Omit or set to null for Big Book topics
    }
  ]
}

Requirements:
- The response must be ONLY valid JSON with a "topics" array containing exactly 5 topic objects
- Each topic must have "title", "description", and "reference" fields
- Include "dateKey" field (as string in MM-DD format or null) when the topic is based on a Daily Reflection
- When referencing Daily Reflections, format the reference as "Daily Reflection, [Month Day] - [Title]" and include the dateKey
- Focus on topics that encourage personal sharing and recovery insights
- Make topics specific enough to focus discussion but broad enough for different perspectives
- Ensure topics are relevant to AA recovery principles
- Avoid controversial or political topics
- Include a mix of topic types (step-related, spiritual principles, recovery challenges, etc.)
- Base your suggestions on the provided AA literature context when possible
- Prioritize Daily Reflections when they are highly relevant to the query
`;

    // Generate topics with OpenAI
    const completionOptions = {
      model: "gpt-4",  // Use the appropriate model
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000
    };

    // Only add response_format for models that support it (newer GPT models)
    // Omit for older models or when not sure about compatibility
    // This is the parameter causing the 400 error

    const completion = await openai.chat.completions.create(completionOptions);

    // Extract and parse the response
    const responseContent = completion.choices[0].message.content;
    let parsedResponse;
    
    try {
      parsedResponse = JSON.parse(responseContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      console.error('Response content:', responseContent);
      return NextResponse.json(
        { error: 'Failed to parse AI response. Please try again.' },
        { status: 500 }
      );
    }

    // Handle different response formats from OpenAI
    let topics = [];
    
    if (Array.isArray(parsedResponse.topics)) {
      topics = parsedResponse.topics;
    } else if (parsedResponse.topics && typeof parsedResponse.topics === 'object') {
      // Handle case where topics is an object with numeric keys
      topics = Object.values(parsedResponse.topics);
    } else if (Array.isArray(parsedResponse)) {
      // Handle case where response is directly an array
      topics = parsedResponse;
    } else if (parsedResponse.topics) {
      // Handle single topic object
      topics = [parsedResponse.topics];
    }

    // Validate topics structure
    if (!Array.isArray(topics) || topics.length === 0) {
      console.error('Invalid topics format:', parsedResponse);
      return NextResponse.json(
        { error: 'AI returned an unexpected format. Please try again.' },
        { status: 500 }
      );
    }

    // Normalize topics: ensure dateKey is included when available, and validate format
    topics = topics.map(topic => {
      // Ensure dateKey is properly formatted (MM-DD) if present
      let dateKey = null;
      if (topic.dateKey) {
        // Validate dateKey format (MM-DD)
        if (/^\d{2}-\d{2}$/.test(topic.dateKey)) {
          dateKey = topic.dateKey;
        } else {
          // Try to extract dateKey from reference if not in topic object
          const dateKeyMatch = topic.reference?.match(/(\d{2}-\d{2})/);
          if (dateKeyMatch) {
            dateKey = dateKeyMatch[1];
          }
        }
      }
      
      return {
        title: topic.title || '',
        description: topic.description || '',
        reference: topic.reference || '',
        dateKey: dateKey || null
      };
    });

    // Return the generated topics
    return NextResponse.json({ topics });
  } catch (error) {
    console.error('Error generating topics:', error);

    // Provide more specific error messages
    let errorMessage = 'Failed to generate topics. Please try again later.';
    let statusCode = 500;

    // Check if it's an OpenAI API error
    if (error.response) {
      // This is an OpenAI API error with response details
      errorMessage = `OpenAI API error: ${error.response.status} - ${error.response.statusText || error.response.data?.error?.message || 'Unknown error'}`;
      statusCode = error.response.status;
    } else if (error.message) {
      errorMessage = error.message;

      // Set appropriate status code for specific errors
      if (error.message.includes('400')) {
        statusCode = 400;
      }
    }

    // Log detailed error information for debugging
    console.error('Error details:', {
      message: errorMessage,
      statusCode,
      originalError: error.toString(),
      stack: error.stack
    });

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}