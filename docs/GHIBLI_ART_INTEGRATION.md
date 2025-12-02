# Ghibli Art Director Integration Guide

This document explains how to integrate AI-generated Ghibli-style artwork into your application pages.

## Overview

The Ghibli Art Director Agent automatically generates Studio Ghibli-style artwork for:
- **Daily Reflections**: Peaceful scenes for daily AA reflections
- **Step Illustrations**: Symbolic metaphors for the 12 steps
- **Milestone Badges**: Celebratory badges for recovery milestones
- **Seasonal Graphics**: Landscape artwork for seasonal themes

## Using the GeneratedArtDisplay Component

The easiest way to display generated artwork is using the `GeneratedArtDisplay` component.

### Import

```javascript
import GeneratedArtDisplay from '@/components/GeneratedArtDisplay';
```

### Daily Reflection Example

```javascript
// In your daily reflection page (e.g., /today or /[dateKey])
import GeneratedArtDisplay from '@/components/GeneratedArtDisplay';

export default function TodayPage() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  return (
    <Box>
      {/* Display generated art for today's reflection */}
      <GeneratedArtDisplay
        artType="daily-reflection"
        reference={today}
        width="100%"
        height="500px"
        borderRadius="12px"
      />

      {/* Your reflection content */}
      <Typography variant="h4">Today's Reflection</Typography>
      {/* ... rest of your content ... */}
    </Box>
  );
}
```

### Step Illustration Example

```javascript
// In your steps page (e.g., /steps/[number])
import GeneratedArtDisplay from '@/components/GeneratedArtDisplay';

export default function StepPage({ params }) {
  const stepNumber = params.number; // 1-12

  return (
    <Box>
      {/* Display generated art for this step */}
      <GeneratedArtDisplay
        artType="step"
        reference={stepNumber}
        width="100%"
        height="400px"
        borderRadius="8px"
      />

      {/* Your step content */}
      <Typography variant="h4">Step {stepNumber}</Typography>
      {/* ... rest of your content ... */}
    </Box>
  );
}
```

### Milestone Badge Example

```javascript
// In your sobriety tracker or profile page
import GeneratedArtDisplay from '@/components/GeneratedArtDisplay';

export default function SobrietyPage({ userDaysSober }) {
  // Determine milestone type based on days sober
  const getMilestoneType = (days) => {
    if (days >= 365) return '1_year';
    if (days >= 90) return '90_days';
    if (days >= 30) return '30_days';
    if (days >= 7) return '7_days';
    if (days >= 1) return '24_hours';
    return null;
  };

  const milestoneType = getMilestoneType(userDaysSober);

  return (
    <Box>
      {milestoneType && (
        <GeneratedArtDisplay
          artType="milestone"
          reference={milestoneType}
          width="300px"
          height="300px"
          borderRadius="50%" // Circular badge
        />
      )}

      {/* Your sobriety content */}
      <Typography variant="h4">{userDaysSober} Days Sober</Typography>
      {/* ... rest of your content ... */}
    </Box>
  );
}
```

## Component Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `artType` | string | Yes | - | Type of art: `'daily-reflection'`, `'step'`, `'milestone'` |
| `reference` | string | Yes | - | Reference value (date, step number, milestone type) |
| `width` | string | No | `'100%'` | Width of the image container |
| `height` | string | No | `'400px'` | Height of the image container |
| `borderRadius` | string | No | `'8px'` | Border radius of the image |

## Direct API Usage

If you need more control, you can call the API endpoints directly:

### Daily Reflection API

```javascript
// GET /api/art/daily-reflection?date=YYYY-MM-DD
const response = await fetch('/api/art/daily-reflection?date=2024-01-15');
const data = await response.json();

if (data.hasArt) {
  console.log(data.artwork.imageUrl);
  console.log(data.artwork.styleCharacteristics);
}
```

### Step Illustration API

```javascript
// GET /api/art/step?number=1
const response = await fetch('/api/art/step?number=1');
const data = await response.json();

if (data.hasArt) {
  console.log(data.artwork.imageUrl);
}
```

### Milestone Badge API

```javascript
// GET /api/art/milestone?type=30_days
const response = await fetch('/api/art/milestone?type=30_days');
const data = await response.json();

if (data.hasArt) {
  console.log(data.artwork.imageUrl);
}
```

## Milestone Types Reference

| Type | Days | Description |
|------|------|-------------|
| `24_hours` | 1 | First 24 hours |
| `7_days` | 7 | One week |
| `30_days` | 30 | One month |
| `60_days` | 60 | Two months |
| `90_days` | 90 | Three months |
| `6_months` | 180 | Six months |
| `1_year` | 365 | One year |
| `18_months` | 548 | Eighteen months |
| `2_years` | 730 | Two years |
| `5_years` | 1825 | Five years |
| `10_years` | 3650 | Ten years |

## Generating New Artwork (Admin Only)

Artwork is generated through the admin dashboard at `/admin/art-director`.

### Manual Generation

1. Navigate to `/admin/art-director`
2. Click "Generate Art" button
3. Select art type
4. Enter reference value
5. Choose Ghibli style level
6. Click "Generate"

### Programmatic Generation

```javascript
const response = await fetch('/api/admin/agents/art-director/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    request_type: 'single',
    art_type: 'daily_reflection',
    generation_items: [{
      reference_key: 'date',
      reference_value: '2024-01-15',
      content_data: {
        text: 'Daily reflection text...',
      },
    }],
    configuration: {
      ghibli_style_level: 'moderate',
      quality_setting: 'standard',
      auto_approve: true,
      manual_review_required: false,
    },
  }),
});

const data = await response.json();
console.log(data.results);
```

### Batch Generation

Generate multiple artworks in one request:

```javascript
const response = await fetch('/api/admin/agents/art-director/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    request_type: 'batch_daily',
    art_type: 'daily_reflection',
    generation_items: [
      { reference_key: 'date', reference_value: '2024-01-15', content_data: { text: '...' } },
      { reference_key: 'date', reference_value: '2024-01-16', content_data: { text: '...' } },
      { reference_key: 'date', reference_value: '2024-01-17', content_data: { text: '...' } },
    ],
    configuration: {
      ghibli_style_level: 'moderate',
      quality_setting: 'standard',
      auto_approve: true,
    },
  }),
});
```

## Ghibli Style Levels

| Level | Description | Visual Effect |
|-------|-------------|---------------|
| `subtle` | Minimal Ghibli influence | Slight watercolor feel, gentle lighting |
| `moderate` | Balanced Ghibli style | Watercolor textures, atmospheric depth, soft colors |
| `strong` | Full Ghibli aesthetic | Rich watercolor, detailed natural elements, golden hour lighting, strong atmospheric perspective |

## Best Practices

1. **Fallback Gracefully**: The component automatically hides if no artwork is available
2. **Loading States**: The component shows a skeleton loader while fetching
3. **Performance**: Use appropriate image sizes for your use case
4. **Cost Awareness**: Each generation costs ~$0.04 (standard 1024x1024) or ~$0.08 (wide 1792x1024)
5. **Versioning**: If you regenerate art, the new version automatically supersedes the old

## Troubleshooting

### Artwork Not Displaying

1. Check that artwork has been generated for the reference value
2. Verify the reference format (date: YYYY-MM-DD, step: 1-12, milestone: valid type)
3. Check browser console for API errors
4. Ensure MongoDB connection is working

### Slow Loading

1. Generated images are hosted on OpenAI's CDN (temporary)
2. Consider implementing permanent storage (S3, Cloudinary) for faster loading
3. Use Next.js Image component's priority prop for above-the-fold images

### Generation Failures

1. Check OpenAI API key is valid
2. Verify sufficient API credits
3. Check MongoDB connection
4. Review error logs in admin dashboard

## Architecture

For detailed information about the agent architecture, visit:
- Admin Dashboard: `/admin/art-director`
- Architecture Visualization: Interactive ReactFlow diagram in the dashboard
- Agent Code: `/src/lib/agents/art/`

## Cost Tracking

All generation costs are tracked in:
- `ArtGenerationHistory` MongoDB collection
- Admin dashboard analytics
- Individual artwork records

View cost analytics at `/admin/art-director` in the "Generation History" tab.
