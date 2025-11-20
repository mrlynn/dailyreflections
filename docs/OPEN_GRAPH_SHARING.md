# Open Graph & Social Media Sharing

## Overview

Daily reflection pages now include comprehensive Open Graph metadata optimized for social media sharing. Each reflection page uses its **day-specific image** in share previews, making shared links more visually engaging and recognizable.

## Implementation

### Dynamic Image Selection

The metadata generation automatically:
1. **Checks for day-specific images** - Looks for JPG (new format) or PNG (legacy format)
2. **Uses reflection image** - If found, uses the day's unique reflection image
3. **Falls back to logo** - If no reflection image exists, uses the default logo

### Image Format Support

- **JPG format** (preferred) - New images generated with enhanced script
- **PNG format** (legacy) - Existing images continue to work
- **Default logo** - Fallback for reflections without images

### Open Graph Tags

Each daily reflection page includes:

```html
<!-- Open Graph -->
<meta property="og:title" content="[Reflection Title] - [Date] | Daily Reflections - AA Literature" />
<meta property="og:description" content="[Reflection quote/excerpt]..." />
<meta property="og:url" content="https://aacompanion.com/[dateKey]" />
<meta property="og:type" content="article" />
<meta property="og:image" content="https://aacompanion.com/reflections/[dateKey].jpg" />
<meta property="og:image:width" content="1792" />
<meta property="og:image:height" content="1024" />
<meta property="og:image:alt" content="[Reflection Title] - [Date]" />
<meta property="og:site_name" content="Daily Reflections - AA Literature" />
<meta property="og:locale" content="en_US" />

<!-- Article-specific -->
<meta property="article:published_time" content="[ISO date]" />
<meta property="article:section" content="Daily Reflections" />
<meta property="article:tag" content="daily reflection, [date], [title], AA literature..." />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="[Reflection Title] - [Date] | Daily Reflections - AA Literature" />
<meta name="twitter:description" content="[Reflection quote/excerpt]..." />
<meta name="twitter:image" content="https://aacompanion.com/reflections/[dateKey].jpg" />
```

## Image Dimensions

- **Reflection Images**: 1792x1024 (widescreen banner format)
- **Default Logo**: 1200x630 (standard OG image size)

## Best Practices Implemented

✅ **Unique images per reflection** - Each day has its own shareable image  
✅ **Absolute URLs** - All image URLs are fully qualified  
✅ **Proper dimensions** - Image dimensions specified for optimal display  
✅ **Alt text** - Descriptive alt text for accessibility  
✅ **Article type** - Reflection pages use `og:type: article` for better categorization  
✅ **Article metadata** - Includes published time, section, and tags  
✅ **Twitter Cards** - Optimized for Twitter sharing with large image cards  
✅ **Fallback handling** - Gracefully handles missing images  

## Testing

### Facebook Sharing Debugger
Test your URLs at: https://developers.facebook.com/tools/debug/

### Twitter Card Validator
Test your URLs at: https://cards-dev.twitter.com/validator

### LinkedIn Post Inspector
Test your URLs at: https://www.linkedin.com/post-inspector/

### Example Test URLs
```
https://aacompanion.com/11-06
https://aacompanion.com/01-01
```

## Environment Variables

Ensure these are set for proper absolute URLs:

```bash
NEXT_PUBLIC_BASE_URL=https://aacompanion.com
# or
NEXTAUTH_URL=https://aacompanion.com
```

## Sharing Preview

When users share a daily reflection link, they'll see:
- **Title**: Reflection title and date
- **Description**: Quote or reflection excerpt
- **Image**: The day's unique reflection image (if available)
- **Site Name**: "Daily Reflections - AA Literature"

This creates a visually rich, engaging preview that encourages clicks and shares.

## Future Enhancements

Potential improvements:
- Add `article:author` metadata
- Include actual publication dates from reflection data
- Generate optimized OG images (1200x630) from reflection images
- Add structured data (JSON-LD) for better SEO
- Support for video reflections (if added)

