/**
 * Simple test script for the search API endpoint
 *
 * This script sends a test request to the search API endpoint to check if it's working correctly.
 * It uses the fetch API to make a direct POST request to the endpoint.
 *
 * Run with: node scripts/test-search-api.js
 */

require('dotenv').config({ path: '.env.local' });

async function testSearchAPI() {
  const testQuery = 'acceptance';

  console.log('🧪 Testing Search API Endpoint');
  console.log('===========================');
  console.log(`Query: "${testQuery}"`);

  try {
    // Use environment variable for URL or default to localhost
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'; // Updated to use port 3003
    const url = `${baseUrl}/api/reflections/search`;

    console.log(`URL: ${url}`);
    console.log('Sending POST request...');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: testQuery,
        limit: 5,
        minScore: 0.6,
      }),
    });

    // Parse the response
    const data = await response.json();

    console.log('\n📊 API Response:');
    console.log('===========================');
    console.log(`Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.error('❌ Error Response:');
      console.error(data);
      return;
    }

    console.log(`Query: ${data.query}`);
    console.log(`Results: ${data.count} found`);
    console.log(`Min Score: ${data.minScore}`);

    if (data.results && data.results.length > 0) {
      console.log('\n🔍 Top Results:');
      data.results.slice(0, 3).forEach((result, index) => {
        console.log(`\n[${index + 1}] ${result.title} (Match: ${Math.round(result.score * 100)}%)`);
        console.log(`Date: ${result.month.toString().padStart(2, '0')}-${result.day.toString().padStart(2, '0')}`);
        console.log(`Quote: ${result.quote.substring(0, 100)}...`);
      });
    } else {
      console.log('\n❌ No results found');
    }

    console.log('\n✅ Test completed successfully');
  } catch (error) {
    console.error('❌ Error testing search API:', error);
  }
}

// Run the test
testSearchAPI().catch(error => {
  console.error('Unhandled error:', error);
});