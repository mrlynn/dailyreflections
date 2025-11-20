/**
 * Feature Flags Configuration
 *
 * This file defines all feature flags for the Daily Reflections application.
 * Each flag should have a default value that can be overridden by environment variables.
 *
 * Usage in client components:
 *   import { useFeatureFlag } from '@/hooks/useFeatureFlag';
 *   const isBlogEnabled = useFeatureFlag('BLOG');
 *
 * Usage in server components:
 *   import { getFeatureFlag } from '@/lib/featureFlags';
 *   const isBlogEnabled = getFeatureFlag('BLOG');
 */

// Default feature flag configuration
export const FEATURE_FLAGS = {
  // Core features
  REFLECTIONS: {
    ENABLED: true, // Core feature, always enabled
    COMMENTS: process.env.NEXT_PUBLIC_FEATURE_REFLECTIONS_COMMENTS !== 'false',
  },

  // User authentication and profile
  AUTH: {
    ENABLED: process.env.NEXT_PUBLIC_FEATURE_AUTH !== 'false',
    REGISTRATION: process.env.NEXT_PUBLIC_FEATURE_AUTH_REGISTRATION === 'true',
    PROFILE: process.env.NEXT_PUBLIC_FEATURE_AUTH_PROFILE === 'true',
  },

  // Blog system
  BLOG: {
    ENABLED: process.env.NEXT_PUBLIC_FEATURE_BLOG === 'true',
    COMMENTS: process.env.NEXT_PUBLIC_FEATURE_BLOG_COMMENTS === 'true',
  },

  // Journal features
  JOURNAL: {
    ENABLED: process.env.NEXT_PUBLIC_FEATURE_JOURNAL === 'true',
    INSIGHTS: process.env.NEXT_PUBLIC_FEATURE_JOURNAL_INSIGHTS === 'true',
  },

  // Step 4 inventory features
  STEP4: {
    ENABLED: process.env.NEXT_PUBLIC_FEATURE_STEP4 === 'true',
    ENCRYPTION: process.env.NEXT_PUBLIC_FEATURE_STEP4_ENCRYPTION === 'true',
  },

  // Circles (private groups)
  CIRCLES: {
    ENABLED: process.env.NEXT_PUBLIC_FEATURE_CIRCLES === 'true',
    SHARING: process.env.NEXT_PUBLIC_FEATURE_CIRCLES_SHARING === 'true',
    MODERATION: process.env.NEXT_PUBLIC_FEATURE_CIRCLES_MODERATION === 'true',
  },

  // Sobriety tracking
  SOBRIETY: {
    ENABLED: process.env.NEXT_PUBLIC_FEATURE_SOBRIETY === 'true',
    MILESTONES: process.env.NEXT_PUBLIC_FEATURE_SOBRIETY_MILESTONES === 'true',
  },

  // Today's reflection quick access
  TODAY: {
    ENABLED: process.env.NEXT_PUBLIC_FEATURE_TODAY !== 'false',
  },

  // Admin features
  ADMIN: {
    ENABLED: process.env.NEXT_PUBLIC_FEATURE_ADMIN === 'true',
    USER_MANAGEMENT: process.env.NEXT_PUBLIC_FEATURE_ADMIN_USER_MANAGEMENT === 'true',
    CONTENT_MODERATION: process.env.NEXT_PUBLIC_FEATURE_ADMIN_CONTENT_MODERATION === 'true',
    BLOG: process.env.NEXT_PUBLIC_FEATURE_ADMIN_BLOG !== 'false',
  },

  // Search features
  SEARCH: {
    ENABLED: process.env.NEXT_PUBLIC_FEATURE_SEARCH !== 'false',
    ADVANCED: process.env.NEXT_PUBLIC_FEATURE_SEARCH_ADVANCED === 'true',
  },

  // Big Book reader
  BIGBOOK: {
    ENABLED: process.env.NEXT_PUBLIC_FEATURE_BIGBOOK === 'true',
    AI_HELPER: process.env.NEXT_PUBLIC_FEATURE_BIGBOOK_AI === 'true',
    COMMENTS: process.env.NEXT_PUBLIC_FEATURE_BIGBOOK_COMMENTS !== 'false',
  },

  // AA Topics Brainstorming
  TOPICS: {
    ENABLED: process.env.NEXT_PUBLIC_FEATURE_TOPICS === 'true',
    SHARING: process.env.NEXT_PUBLIC_FEATURE_TOPICS_SHARING === 'true',
    FAVORITES: process.env.NEXT_PUBLIC_FEATURE_TOPICS_FAVORITES === 'true',
  },

  // Realtime Chat (Ably)
  REALTIME_CHAT: {
    ENABLED: process.env.NEXT_PUBLIC_FEATURE_REALTIME_CHAT === 'true',
    VOLUNTEER_CHAT: process.env.NEXT_PUBLIC_FEATURE_REALTIME_CHAT_VOLUNTEER === 'true',
    USER_CHAT: process.env.NEXT_PUBLIC_FEATURE_REALTIME_CHAT_USER === 'true',
  },
};

/**
 * Get a feature flag value (for server components)
 * @param {string} featureKey - The feature key (e.g., 'BLOG', 'ADMIN')
 * @param {string} [subFeature] - Optional sub-feature (e.g., 'COMMENTS', 'ENABLED')
 * @returns {boolean} - Whether the feature is enabled
 */
export function getFeatureFlag(featureKey, subFeature = 'ENABLED') {
  try {
    const feature = FEATURE_FLAGS[featureKey];
    if (!feature) return false;

    return subFeature in feature ? feature[subFeature] : feature.ENABLED;
  } catch (error) {
    console.error(`Error getting feature flag: ${featureKey}.${subFeature}`, error);
    return false;
  }
}

/**
 * Check if a route should be accessible based on feature flags
 * @param {string} path - The route path
 * @returns {boolean} - Whether the route is accessible
 */
export function isRouteEnabled(path) {
  // Remove leading slash and split by slash
  const segments = path.replace(/^\//, '').split('/');
  const mainSegment = segments[0];

  // Handle special routes
  if (!mainSegment || mainSegment === '') return true; // Home page

  // Map routes to feature flags
  const routeToFeatureMap = {
    'blog': 'BLOG',
    'journal': 'JOURNAL',
    'step4': 'STEP4',
    'sobriety': 'SOBRIETY',
    'big-book': 'BIGBOOK',
    'today': 'TODAY',
    'profile': ['AUTH', 'PROFILE'],
    'admin': 'ADMIN',
    'topics': 'TOPICS',
    'circles': 'CIRCLES',
  };

  const feature = routeToFeatureMap[mainSegment];
  if (!feature) return true; // No feature flag, allow access

  // Handle array of feature/subfeature
  if (Array.isArray(feature)) {
    return getFeatureFlag(feature[0], feature[1]);
  }

  // Simple feature check
  return getFeatureFlag(feature);
}