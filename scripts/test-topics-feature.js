/**
 * Test Script for AA Topics Feature
 *
 * This script tests the feature flag implementation for the AA Topics feature.
 * It verifies that the feature flag works correctly in both enabled and disabled states.
 */

const { FEATURE_FLAGS, getFeatureFlag, isRouteEnabled } = require('../src/lib/featureFlags');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * Print a header
 * @param {string} text - Header text
 */
function printHeader(text) {
  console.log('\n' + colors.bright + colors.blue + text + colors.reset);
  console.log('='.repeat(text.length) + '\n');
}

/**
 * Print test result
 * @param {string} testName - Test name
 * @param {boolean} passed - Whether the test passed
 */
function printResult(testName, passed) {
  const status = passed
    ? colors.green + 'PASS' + colors.reset
    : colors.red + 'FAIL' + colors.reset;
  console.log(`${testName}: ${status}`);
}

/**
 * Run feature flag tests
 */
function runFeatureFlagTests() {
  printHeader('TESTING AA TOPICS FEATURE FLAG');

  // Test if TOPICS is defined in FEATURE_FLAGS
  const topicsDefined = 'TOPICS' in FEATURE_FLAGS;
  printResult('TOPICS feature flag exists', topicsDefined);

  // Test if sub-features are defined
  const subFeaturesDefined =
    FEATURE_FLAGS.TOPICS &&
    'SHARING' in FEATURE_FLAGS.TOPICS &&
    'FAVORITES' in FEATURE_FLAGS.TOPICS;
  printResult('TOPICS sub-features defined correctly', subFeaturesDefined);

  // Test route mapping
  const topicsRoute = isRouteEnabled('/topics');
  printResult('Route mapping for /topics exists', topicsRoute !== undefined);

  // Test with feature disabled
  // Override the environment variables for testing
  process.env.NEXT_PUBLIC_FEATURE_TOPICS = 'false';
  const topicsDisabled = !getFeatureFlag('TOPICS');
  printResult('Feature disabled when flag is false', topicsDisabled);

  // Test with feature enabled
  process.env.NEXT_PUBLIC_FEATURE_TOPICS = 'true';
  const topicsEnabled = getFeatureFlag('TOPICS');
  printResult('Feature enabled when flag is true', topicsEnabled);

  // Test sub-features
  process.env.NEXT_PUBLIC_FEATURE_TOPICS_SHARING = 'true';
  const sharingEnabled = getFeatureFlag('TOPICS', 'SHARING');
  printResult('SHARING sub-feature works', sharingEnabled);

  // Clean up after tests
  delete process.env.NEXT_PUBLIC_FEATURE_TOPICS;
  delete process.env.NEXT_PUBLIC_FEATURE_TOPICS_SHARING;
}

/**
 * Run API endpoint tests
 */
function runApiTests() {
  printHeader('TESTING AA TOPICS API');

  console.log(colors.yellow + 'API tests require a running server and would be tested manually or with integration tests' + colors.reset);
  console.log('To test the API endpoint:');
  console.log('1. Start the development server with npm run dev');
  console.log('2. Enable the feature flag in .env.local: NEXT_PUBLIC_FEATURE_TOPICS=true');
  console.log('3. Send a POST request to /api/topics/generate with a query parameter');
  console.log('\nExample curl command:');
  console.log('curl -X POST http://localhost:3000/api/topics/generate \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"query": "gratitude"}\'\n');
}

/**
 * Main function
 */
function main() {
  console.log(colors.bright + colors.cyan + '====================================');
  console.log(' AA TOPICS FEATURE TEST');
  console.log('====================================' + colors.reset);

  runFeatureFlagTests();
  runApiTests();

  console.log('\n' + colors.yellow + 'To fully test the feature:' + colors.reset);
  console.log('1. Set NEXT_PUBLIC_FEATURE_TOPICS=true in .env.local to enable the feature');
  console.log('2. Run the development server and navigate to /topics');
  console.log('3. Verify that the Topics page loads and functions correctly');
  console.log('4. Set NEXT_PUBLIC_FEATURE_TOPICS=false to disable the feature');
  console.log('5. Verify that the Coming Soon page appears when navigating to /topics');
  console.log('6. Verify that the Meeting Topics navigation item disappears from the menu');
}

// Run the tests
main();