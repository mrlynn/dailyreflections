# Feature Flags Quick Reference

## What are Feature Flags?
Feature flags allow toggling features on/off without code changes - useful for gradual rollouts, A/B testing, or disabling problematic features.

## Setting Feature Flags
Edit `.env.local` file:
```
# Core Features
NEXT_PUBLIC_FEATURE_REFLECTIONS=true
NEXT_PUBLIC_FEATURE_AUTH=true
NEXT_PUBLIC_FEATURE_SEARCH=true

# Optional Features
NEXT_PUBLIC_FEATURE_BLOG=false
NEXT_PUBLIC_FEATURE_JOURNAL=false
NEXT_PUBLIC_FEATURE_STEP4=false
```

## Using Feature Flags

### Server Components
```javascript
import { getFeatureFlag } from '@/lib/featureFlags';

if (getFeatureFlag('BLOG')) {
  // Blog is enabled
}
```

### Client Components
```javascript
'use client';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

function MyComponent() {
  const isBlogEnabled = useFeatureFlag('BLOG');

  if (!isBlogEnabled) {
    return <p>Coming soon!</p>;
  }

  return <BlogContent />;
}
```

### Navigation
Navigation items automatically respect feature flags:
```javascript
{ label: 'Blog', href: '/blog', icon: ArticleIcon, featureFlag: 'BLOG' }
```

## Testing
Run test script:
```bash
npm run test-feature-flags
```

## How it Works
1. Middleware checks routes against feature flags
2. Disabled features show "Coming Soon" page
3. Navigation hides links to disabled features

## Need More Info?
See full documentation in `docs/FEATURE_FLAGS.md`