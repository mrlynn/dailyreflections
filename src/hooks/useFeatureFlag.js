"use client";

import { useState, useEffect } from 'react';
import { FEATURE_FLAGS } from '@/lib/featureFlags';

/**
 * Hook to check if a feature is enabled
 * @param {string} featureKey - The feature key (e.g., 'BLOG', 'ADMIN')
 * @param {string} [subFeature] - Optional sub-feature (e.g., 'COMMENTS', 'ENABLED')
 * @returns {boolean} - Whether the feature is enabled
 */
export function useFeatureFlag(featureKey, subFeature = 'ENABLED') {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    try {
      const feature = FEATURE_FLAGS[featureKey];
      if (!feature) {
        setIsEnabled(false);
        return;
      }

      const enabled = subFeature in feature ? feature[subFeature] : feature.ENABLED;
      setIsEnabled(!!enabled);
    } catch (error) {
      console.error(`Error checking feature flag: ${featureKey}.${subFeature}`, error);
      setIsEnabled(false);
    }
  }, [featureKey, subFeature]);

  return isEnabled;
}

/**
 * Hook to check if a route should be accessible based on feature flags
 * @param {string} path - The route path
 * @returns {boolean} - Whether the route is accessible
 */
export function useRouteEnabled(path) {
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    try {
      // Remove leading slash and split by slash
      const segments = path.replace(/^\//, '').split('/');
      const mainSegment = segments[0];

      // Handle special routes
      if (!mainSegment || mainSegment === '') {
        setIsEnabled(true); // Home page is always enabled
        return;
      }

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
        'circles': 'CIRCLES',
      };

      const feature = routeToFeatureMap[mainSegment];
      if (!feature) {
        setIsEnabled(true); // No feature flag defined, allow access
        return;
      }

      // Handle array of feature/subfeature
      if (Array.isArray(feature)) {
        const featureKey = feature[0];
        const subFeature = feature[1];
        const featureObj = FEATURE_FLAGS[featureKey];
        setIsEnabled(featureObj && (subFeature in featureObj ? featureObj[subFeature] : featureObj.ENABLED));
        return;
      }

      // Simple feature check
      const featureObj = FEATURE_FLAGS[feature];
      setIsEnabled(!!featureObj && !!featureObj.ENABLED);
    } catch (error) {
      console.error(`Error checking route enabled: ${path}`, error);
      setIsEnabled(false);
    }
  }, [path]);

  return isEnabled;
}