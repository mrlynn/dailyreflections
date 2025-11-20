/**
 * Script to generate AA literature trivia questions using RAG and OpenAI
 *
 * This script:
 * 1. Uses the chatbotSearch to find relevant content in AA literature
 * 2. Passes the content to OpenAI to generate trivia questions
 * 3. Saves the generated questions to a JSON file
 *
 * Usage:
 * node scripts/trivia/generate-trivia-questions.js
 */

import { searchCombinedSources } from '../../src/lib/chatbotSearch.js';
import { OpenAI } from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configuration
const CATEGORIES = ['big-book', 'traditions', 'steps', 'daily-reflections'];
const QUESTIONS_PER_CATEGORY = 5;
const OUTPUT_FILE = path.join(__dirname, '../../src/lib/generatedTriviaQuestions.js');

/**
 * Generate a trivia question from content
 */
async function generateTriviaQuestion(content, category) {
  try {
    console.log(`Generating question for category: ${category}`);

    // Create a prompt for the OpenAI API
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

    // Call the OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    // Parse the response
    const questionData = JSON.parse(response.choices[0].message.content);

    return {
      ...questionData,
      id: `gen_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      category,
      sourceReference: {
        source: content.source,
        page: content.page_number,
        text: content.text.substring(0, 200) + '...'
      }
    };
  } catch (error) {
    console.error('Error generating trivia question:', error);
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Starting AA Literature Trivia question generation...');
    const generatedQuestions = [];

    for (const category of CATEGORIES) {
      console.log(`\nProcessing category: ${category}`);

      // Get content from the RAG system
      for (let i = 0; i < QUESTIONS_PER_CATEGORY; i++) {
        // Get random result from RAG system
        const results = await searchCombinedSources(category, { limit: 1 });

        if (results.length === 0) {
          console.log(`No content found for category: ${category}`);
          continue;
        }

        // Generate a question from the content
        const question = await generateTriviaQuestion(results[0], category);

        if (question) {
          console.log(`✓ Generated question: "${question.question}"`);
          generatedQuestions.push(question);
        }
      }
    }

    // Create the output file
    const outputContent = `/**
 * Generated AA Literature Trivia Questions
 * Generated on: ${new Date().toISOString()}
 */

export const generatedTriviaQuestions = ${JSON.stringify(generatedQuestions, null, 2)};
`;

    await fs.writeFile(OUTPUT_FILE, outputContent, 'utf-8');
    console.log(`\n✅ Successfully generated ${generatedQuestions.length} trivia questions`);
    console.log(`✅ Output written to: ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Error generating trivia questions:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error);