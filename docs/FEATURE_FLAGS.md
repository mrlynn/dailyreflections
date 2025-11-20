# Feature Flag System

This document explains how to use the feature flag system implemented in the Daily Reflections application. Feature flags allow you to enable or disable specific features without changing code, which is useful for gradual feature rollout, A/B testing, or temporarily disabling problematic features.

## Table of Contents

1. [Overview](#overview)
2. [Configuration](#configuration)
3. [Using Feature Flags in Code](#using-feature-flags-in-code)
4. [Feature Flag Middleware](#feature-flag-middleware)
5. [Coming Soon Pages](#coming-soon-pages)
6. [Testing Feature Flags](#testing-feature-flags)
7. [Best Practices](#best-practices)

## Overview

Our feature flag system provides:

- **Environment-based configuration** - Control features via environment variables
- **Hierarchical structure** - Main features with optional sub-features
- **Server and client support** - Check flags on both server and client
- **Navigation integration** - Automatically hide navigation items for disabled features
- **Route protection** - Redirect to "Coming Soon" page when accessing disabled features

## Configuration

Feature flags are configured via environment variables in your `.env.local` file:

```bash
# Core Features (enabled by default)
NEXT_PUBLIC_FEATURE_REFLECTIONS=true
NEXT_PUBLIC_FEATURE_REFLECTIONS_COMMENTS=true
NEXT_PUBLIC_FEATURE_AUTH=true
NEXT_PUBLIC_FEATURE_SEARCH=true
NEXT_PUBLIC_FEATURE_TODAY=true
NEXT_PUBLIC_FEATURE_BIGBOOK_COMMENTS=true

# Blog Feature
NEXT_PUBLIC_FEATURE_BLOG=false
NEXT_PUBLIC_FEATURE_BLOG_COMMENTS=false

# Journal Feature
NEXT_PUBLIC_FEATURE_JOURNAL=false
NEXT_PUBLIC_FEATURE_JOURNAL_INSIGHTS=false

# Step 4 Inventory Feature
NEXT_PUBLIC_FEATURE_STEP4=false
NEXT_PUBLIC_FEATURE_STEP4_ENCRYPTION=false

# Sobriety Tracking Feature
NEXT_PUBLIC_FEATURE_SOBRIETY=false
NEXT_PUBLIC_FEATURE_SOBRIETY_MILESTONES=false

# User Management Features
NEXT_PUBLIC_FEATURE_AUTH_REGISTRATION=true
NEXT_PUBLIC_FEATURE_AUTH_PROFILE=true

# Admin Features
NEXT_PUBLIC_FEATURE_ADMIN=false
NEXT_PUBLIC_FEATURE_ADMIN_USER_MANAGEMENT=false
NEXT_PUBLIC_FEATURE_ADMIN_CONTENT_MODERATION=false
```

### Naming Convention

- All feature flags use the prefix `NEXT_PUBLIC_FEATURE_` for consistency and to make them available on both client and server
- Main features use all uppercase names (e.g., `BLOG`, `JOURNAL`)
- Sub-features use the main feature name followed by a specific capability (e.g., `BLOG_COMMENTS`)

### Default Values

If an environment variable is not set:
- Core features default to `true` (enabled)
- Optional features default to `false` (disabled)

## Using Feature Flags in Code

### In Server Components

Use the `getFeatureFlag` function:

```javascript
import { getFeatureFlag } from '@/lib/featureFlags';

// Check if a feature is enabled
const isBlogEnabled = getFeatureFlag('BLOG');

// Check if a sub-feature is enabled
const isBlogCommentsEnabled = getFeatureFlag('BLOG', 'COMMENTS');

// Conditional rendering based on feature flags
export default function BlogPage() {
  if (!getFeatureFlag('BLOG')) {
    return <ComingSoonPage feature="Blog" />;
  }

  return (
    <div>
      <h1>Blog</h1>
      {/* Blog content */}

      {getFeatureFlag('BLOG', 'COMMENTS') && <CommentSection />}
    </div>
  );
}
```

### In Client Components

Use the `useFeatureFlag` hook:

```javascript
'use client';

import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export default function BlogCommentsSection() {
  const isCommentsEnabled = useFeatureFlag('BLOG', 'COMMENTS');

  if (!isCommentsEnabled) {
    return <p>Comments are coming soon!</p>;
  }

  return (
    <div>
      <h2>Comments</h2>
      {/* Comments UI */}
    </div>
  );
}
```

### In Navigation

Navigation items already respect feature flags via our custom `NavItem` and `NavSection` components:

```javascript
// src/components/Navigation/navConfig.js
export const toolsNav = [
  { label: '10th Step Journal', href: '/journal', icon: EditNoteIcon, featureFlag: 'JOURNAL' },
  { label: '4th Step Inventory', href: '/step4', icon: PsychologyIcon, featureFlag: 'STEP4' },
  { label: 'Sobriety Tracker', href: '/sobriety', icon: CelebrationIcon, featureFlag: 'SOBRIETY' },
];
```

Each nav item with a `featureFlag` property will only be shown if that feature is enabled.

## Feature Flag Middleware

The application includes middleware that automatically checks route access against feature flags:

```javascript
// src/middleware.js
if (!isRouteEnabled(pathname)) {
  // If feature is disabled, redirect to the coming soon page
  const comingSoonUrl = new URL('/coming-soon', request.url);
  comingSoonUrl.searchParams.set('feature', pathname);
  return NextResponse.rewrite(comingSoonUrl);
}
```

### Route to Feature Mapping

Routes are automatically mapped to features using this convention:

```javascript
const routeToFeatureMap = {
  'blog': 'BLOG',
  'journal': 'JOURNAL',
  'step4': 'STEP4',
  'sobriety': 'SOBRIETY',
  'today': 'TODAY',
  'profile': ['AUTH', 'PROFILE'],
  'admin': 'ADMIN',
};
```

## Coming Soon Pages

When a user attempts to access a disabled feature, they are redirected to a "Coming Soon" page:

- The page displays a friendly message explaining that the feature is under development
- It includes the feature name extracted from the URL
- A "Go Back" button allows users to return to the previous page
- The design is consistent with the application's look and feel

## Testing Feature Flags

We've included a test script to verify your feature flag configuration:

```bash
npm run test-feature-flags
```

This command will display:
- A list of all feature flags and their current status (enabled/disabled)
- Route accessibility for major routes based on feature flags

Output example:

```
====================================
 DAILY REFLECTIONS FEATURE FLAG TEST
====================================

=== FEATURE FLAGS STATUS ===

FEATURE                  SUB-FEATURE             STATUS
----------------------------------------------------------------------
REFLECTIONS              ENABLED                 ✓ Enabled
                         COMMENTS                ✓ Enabled
----------------------------------------------------------------------
AUTH                     ENABLED                 ✓ Enabled
                         REGISTRATION            ✓ Enabled
                         PROFILE                 ✓ Enabled
----------------------------------------------------------------------
BLOG                     ENABLED                 ✗ Disabled
                         COMMENTS                ✗ Disabled
----------------------------------------------------------------------
JOURNAL                  ENABLED                 ✗ Disabled
                         INSIGHTS                ✗ Disabled
----------------------------------------------------------------------

=== ROUTE ACCESS STATUS ===

ROUTE                          ACCESSIBLE
--------------------------------------------------
/                              ✓ Enabled
/today                         ✓ Enabled
/search                        ✓ Enabled
/blog                          ✗ Disabled
/journal                       ✗ Disabled
/step4                         ✗ Disabled
/sobriety                      ✗ Disabled
/profile                       ✓ Enabled
/admin                         ✗ Disabled
/admin/users                   ✗ Disabled
/unknown-route                 ✓ Enabled

To modify feature flags, update your .env.local file and restart the application.
```

## Best Practices

1. **Keep Main Features Off Until Ready**
   - Set new main features to `false` by default
   - Only enable when ready for production use

2. **Use Sub-Features for Granular Control**
   - For complex features, implement sub-features
   - This allows enabling a feature but disabling specific parts that need more work

3. **Test Both States**
   - Always test with both enabled and disabled states
   - Ensure Coming Soon pages appear correctly
   - Verify navigation items show/hide correctly

4. **Documentation**
   - Document each feature flag in code comments
   - Keep the `.env.local.example` file up to date
   - Add notes about feature dependencies if relevant

5. **Cleanup**
   - Remove feature flags when features are stable and fully deployed
   - Don't leave unnecessary conditional code in the codebase

6. **Environment Differences**
   - Use different feature flag configurations for development, staging, and production
   - This allows testing features in staging before enabling them in production

7. **Code Review**
   - Check that new features use feature flags appropriately
   - Verify that navigation items include the correct feature flag properties

## Advanced Usage

### Feature Flag Types

Our system supports different types of feature flags:

1. **Release Toggles**: Control the rollout of new features
   - Example: `NEXT_PUBLIC_FEATURE_BLOG=false`

2. **Permission Toggles**: Limit features to certain users
   - Example: Admin features that require the `isAdmin` user property

3. **Operational Toggles**: Turn features on/off for operational reasons
   - Example: Temporarily disabling a feature experiencing issues

### Adding New Feature Flags

To add a new feature flag:

1. Add the feature flag to `src/lib/featureFlags.js`
2. Update the route mapping if it's a main feature
3. Add the flag to `.env.local.example`
4. Update documentation

Example adding a new "Meditation Timer" feature:

```javascript
// 1. Add to FEATURE_FLAGS in src/lib/featureFlags.js
MEDITATION: {
  ENABLED: process.env.NEXT_PUBLIC_FEATURE_MEDITATION === 'true',
  TIMER: process.env.NEXT_PUBLIC_FEATURE_MEDITATION_TIMER === 'true',
  GUIDED: process.env.NEXT_PUBLIC_FEATURE_MEDITATION_GUIDED === 'true',
},

// 2. Update route mapping
const routeToFeatureMap = {
  // ...existing routes
  'meditation': 'MEDITATION',
};

// 3. Update .env.local.example
// # Meditation Features
// NEXT_PUBLIC_FEATURE_MEDITATION=false
// NEXT_PUBLIC_FEATURE_MEDITATION_TIMER=false
// NEXT_PUBLIC_FEATURE_MEDITATION_GUIDED=false
```

## Conclusion

The feature flag system provides a flexible way to control feature availability without code changes. Use it to manage the rollout of new features and handle any temporary feature disabling needs. If you have questions or need help with feature flags, refer to this document or reach out to the development team.