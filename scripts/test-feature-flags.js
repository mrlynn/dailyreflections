/**
 * Feature Flag Test Script
 *
 * This script helps test and verify that feature flags are working properly.
 * It prints the current state of all feature flags based on environment variables.
 */

// Import the feature flags configuration
const { FEATURE_FLAGS, getFeatureFlag } = require('../src/lib/featureFlags');

/**
 * Format boolean values for display
 * @param {boolean} value - The boolean value to format
 * @returns {string} - Formatted string with color codes for console
 */
function formatBoolean(value) {
  if (value === true) {
    return '\x1b[32m✓ Enabled\x1b[0m';  // Green checkmark
  } else {
    return '\x1b[31m✗ Disabled\x1b[0m'; // Red X
  }
}

/**
 * Print feature flags in a formatted table
 */
function printFeatureFlags() {
  console.log('\n\x1b[1m=== FEATURE FLAGS STATUS ===\x1b[0m\n');

  // Table header
  console.log('\x1b[1m%-25s %-25s %-15s\x1b[0m', 'FEATURE', 'SUB-FEATURE', 'STATUS');
  console.log('─'.repeat(70));

  // Iterate through all feature flags
  Object.keys(FEATURE_FLAGS).forEach(featureKey => {
    const feature = FEATURE_FLAGS[featureKey];
    const subFeatures = Object.keys(feature);

    // Print main feature status
    console.log(
      '%-25s %-25s %s',
      featureKey,
      'ENABLED',
      formatBoolean(getFeatureFlag(featureKey))
    );

    // Print sub-features if they exist
    subFeatures.forEach(subFeature => {
      if (subFeature !== 'ENABLED') {
        console.log(
          '%-25s %-25s %s',
          '',
          subFeature,
          formatBoolean(getFeatureFlag(featureKey, subFeature))
        );
      }
    });

    // Add separator between features
    console.log('─'.repeat(70));
  });
}

/**
 * Test route access based on feature flags
 */
function testRouteAccess() {
  const { isRouteEnabled } = require('../src/lib/featureFlags');

  console.log('\n\x1b[1m=== ROUTE ACCESS STATUS ===\x1b[0m\n');

  // Table header
  console.log('\x1b[1m%-30s %-15s\x1b[0m', 'ROUTE', 'ACCESSIBLE');
  console.log('─'.repeat(50));

  // Test various routes
  const routes = [
    '/',
    '/today',
    '/search',
    '/blog',
    '/journal',
    '/step4',
    '/sobriety',
    '/profile',
    '/admin',
    '/admin/users',
    '/unknown-route',
  ];

  routes.forEach(route => {
    console.log(
      '%-30s %s',
      route,
      formatBoolean(isRouteEnabled(route))
    );
  });
}

// Main execution
console.log('\x1b[1m\x1b[36m======================================');
console.log(' DAILY REFLECTIONS FEATURE FLAG TEST ');
console.log('======================================\x1b[0m');

printFeatureFlags();
testRouteAccess();

console.log('\n\x1b[33mTo modify feature flags, update your .env.local file and restart the application.\x1b[0m\n');