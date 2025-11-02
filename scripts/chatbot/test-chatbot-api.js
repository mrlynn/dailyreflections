/**
 * Test script for the chatbot API
 *
 * This script sends test queries to the chatbot API and displays the responses,
 * allowing you to verify that the RAG system is working properly with both
 * the AA Big Book and Daily Reflections content.
 *
 * Run with: node scripts/chatbot/test-chatbot-api.js
 */

const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

// Configuration
const API_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
const TEST_QUERIES = [
  "What are the 12 steps?",
  "How do I find serenity?",
  "What does acceptance mean in recovery?",
  "Tell me about today's reflection",
  "What does the Big Book say about resentment?"
];

/**
 * Test the chatbot API with different queries
 */
async function testChatbotAPI() {
  console.log('🤖 Chatbot API Test');
  console.log('===================');
  console.log(`📡 API URL: ${API_URL}`);

  for (const [index, query] of TEST_QUERIES.entries()) {
    console.log(`\n📝 Test Query #${index + 1}: "${query}"`);

    try {
      console.log('⏳ Sending request to API...');
      const startTime = Date.now();

      const response = await fetch(`${API_URL}/api/chatbot/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Response received in ${responseTime}ms`);

      // Display response
      console.log('\n🔍 Response:');
      console.log('-------------');
      console.log(data.response);

      // Display citations
      if (data.citations && data.citations.length > 0) {
        console.log('\n📚 Citations:');
        console.log('-------------');

        data.citations.forEach((citation, idx) => {
          console.log(`[${idx + 1}] ${citation.reference} (${citation.scorePercentage})`);
          console.log(`    "${citation.text.substring(0, 100)}..."\n`);
        });

        // Analyze citation sources
        const bigBookCitations = data.citations.filter(c => c.source === 'AA Big Book 4th Edition').length;
        const reflectionCitations = data.citations.filter(c => c.source === 'Daily Reflection').length;

        console.log(`📊 Citation breakdown: ${bigBookCitations} from Big Book, ${reflectionCitations} from Daily Reflections`);
      } else {
        console.log('\n⚠️ No citations returned');
      }

      console.log('\n' + '='.repeat(50));
    } catch (error) {
      console.error(`❌ Error testing query "${query}":`, error);
    }
  }

  console.log('\n🎉 Test complete!');
}

// Run the test
if (require.main === module) {
  testChatbotAPI().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}