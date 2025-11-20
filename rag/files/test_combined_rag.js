/**
 * Test script for the combined AA Big Book and Daily Reflections RAG system
 * Run this after ingesting the AA Big Book chunks and setting up the vector index
 */

import { searchCombinedSources, formatCitations, createLLMPrompt } from '../../src/lib/chatbotSearch.js';
import { createLLMPrompt as createEnhancedLLMPrompt } from '../../src/lib/chatbotSearch_enhanced.js';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Test the RAG system with a specific query
 */
async function testQuery(query, useEnhancedPrompt = false) {
  console.log(`\n\nTesting query: "${query}"`);
  console.log('====================================');

  try {
    // Search for relevant content
    console.log('Searching for relevant content...');
    const searchResults = await searchCombinedSources(query, {
      limit: 6,
      minScore: 0.6,
    });

    console.log(`Found ${searchResults.length} relevant results`);

    // Count results by source
    const bigBookCount = searchResults.filter(r => r.source === 'AA Big Book 4th Edition').length;
    const reflectionsCount = searchResults.filter(r => r.source === 'Daily Reflection').length;

    console.log(`Results by source: Big Book: ${bigBookCount}, Daily Reflections: ${reflectionsCount}`);

    // Format citations
    const citations = formatCitations(searchResults);

    // Display the top 2 citations
    console.log('\nTop citations:');
    citations.slice(0, 2).forEach((citation, i) => {
      console.log(`${i + 1}. ${citation.source} - ${citation.reference} (Score: ${citation.scorePercentage})`);
      console.log(`   ${citation.text.substring(0, 150)}...\n`);
    });

    // Create LLM prompt
    const prompt = useEnhancedPrompt
      ? createEnhancedLLMPrompt(query, searchResults)
      : createLLMPrompt(query, searchResults);

    // Generate response using OpenAI
    console.log('Generating response...');
    const response = await openai.chat.completions.create({
      model: "gpt-4", // Can be adjusted based on needs and availability
      messages: [
        { role: "system", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Display the response
    console.log('\nGenerated response:');
    console.log('------------------------------------');
    console.log(response.choices[0].message.content);
    console.log('====================================\n\n');

    return {
      query,
      resultCount: searchResults.length,
      bigBookCount,
      reflectionsCount,
      response: response.choices[0].message.content,
    };
  } catch (error) {
    console.error('Error testing query:', error);
    return { query, error: error.message };
  }
}

/**
 * Run test cases
 */
async function runTests() {
  console.log('Running tests for combined AA Big Book and Daily Reflections RAG system');
  console.log('================================================================\n');

  // Define test queries
  const testQueries = [
    // Big Book specific queries
    "What are the 12 steps in the Big Book?",
    "Explain the third step in detail",
    "What does the Big Book say about resentment?",

    // Daily Reflection queries
    "What does today's reflection mean?",
    "Explain yesterday's reflection",

    // Mixed queries
    "How does the principle of anonymity apply to my recovery?",
    "What does it mean to have a spiritual awakening?",

    // Specific scenario queries
    "How do I make amends to someone I can't face?",
    "How can I deal with a slip in sobriety?"
  ];

  // Run each test query with both prompt types
  const results = [];
  for (const query of testQueries) {
    // Test with standard prompt
    const standardResult = await testQuery(query, false);
    results.push({ ...standardResult, promptType: 'standard' });

    // Test with enhanced prompt
    const enhancedResult = await testQuery(query, true);
    results.push({ ...enhancedResult, promptType: 'enhanced' });
  }

  // Summary
  console.log('Test Summary:');
  console.log('================================================================');
  results.forEach(result => {
    if (result.error) {
      console.log(`❌ "${result.query}" (${result.promptType}): Error - ${result.error}`);
    } else {
      console.log(`✅ "${result.query}" (${result.promptType}): ${result.bigBookCount} Big Book, ${result.reflectionsCount} Reflections`);
    }
  });
}

// Run the tests
runTests().catch(console.error);