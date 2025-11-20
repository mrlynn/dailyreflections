import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { searchCombinedSources } from '@/lib/chatbotSearch';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/trivia/generate
 *
 * Generates a trivia question based on provided category and content
 * Uses OpenAI to create the question, options, and explanation
 */
export async function POST(request) {
  try {
    const { category } = await request.json();

    // Use our RAG system to get relevant content from AA literature
    const results = await searchCombinedSources(category, { limit: 1 });

    if (results.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No content found for the given category' },
        { status: 404 }
      );
    }

    const content = results[0];

    // Generate a trivia question using OpenAI
    const question = await generateTriviaQuestion(content, category);

    return NextResponse.json({
      success: true,
      question
    });
  } catch (error) {
    console.error('Error generating trivia question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate trivia question' },
      { status: 500 }
    );
  }
}

/**
 * Generates a trivia question based on AA literature content
 * @param {Object} content - The content to base the question on
 * @param {String} category - The category for the question
 * @returns {Object} - The generated trivia question
 */
async function generateTriviaQuestion(content, category) {
  try {
    // Create a prompt for generating a trivia question
    const prompt = `Create a multiple-choice trivia question about Alcoholics Anonymous based on this excerpt from ${content.source}:
"${content.text.substring(0, 500)}..."

Format your response as JSON like this:
{
  "question": "The question text goes here?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0, // Index of the correct answer (0-3)
  "explanation": "Brief explanation of why this is correct",
  "difficulty": 3 // 1-5, where 5 is most difficult
}`;

    // Call OpenAI to generate the question
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    // Parse the response and add additional metadata
    const questionData = JSON.parse(response.choices[0].message.content);

    return {
      ...questionData,
      category,
      sourceReference: {
        source: content.source,
        page: content.page_number,
        text: content.text.substring(0, 200) + '...'
      }
    };
  } catch (error) {
    console.error('Error in OpenAI question generation:', error);
    throw new Error('Failed to generate trivia question');
  }
}