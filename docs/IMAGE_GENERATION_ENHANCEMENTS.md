# Image Generation Enhancements

## Overview

The reflection image generation script has been significantly enhanced to create unique, artistic images that are deeply linked to each day's reflection content, and to save images in JPG format for smaller file sizes.

## Key Enhancements

### 1. Enhanced Prompt Generation

**Before:** Simple keyword extraction and basic theme matching
**After:** Sophisticated analysis that creates unique, artistic prompts

#### New Features:
- **Emotional Theme Extraction**: Identifies emotional themes (acceptance, gratitude, serenity, hope, courage, humility, forgiveness, honesty, love, surrender) from the reflection text
- **Visual Metaphor Detection**: Extracts visual metaphors (journey/path, light/illumination, water/flow, growth/renewal, connection/unity, foundation/stability, transformation)
- **Specific Imagery Extraction**: Identifies concrete visual elements mentioned in the text (morning light, mountains, trees, water, sky, garden, bridge, door, window, candle, hands)
- **Flowing Narrative Prompts**: Creates natural, descriptive prompts optimized for DALL-E rather than structured lists

#### Example Enhanced Prompt:
```
Create a unique, artistic horizontal banner image that visually interprets this daily reflection on ACCEPTANCE.

The reflection speaks of: "Acceptance is the answer to all my problems today..."

The image should be capturing the essence of acceptance and serenity, featuring journey and path, with morning light, trees, water. Create a deeply personal and meaningful visual interpretation that feels unique to this specific reflection, not generic or stock-like.

Artistic style: A unique, evocative watercolor and mixed-media illustration with soft, flowing brushstrokes...
```

### 2. JPG Format Conversion

**Benefits:**
- **Smaller File Sizes**: JPG format typically reduces file size by 60-80% compared to PNG
- **Faster Loading**: Smaller files mean faster page loads and better user experience
- **Optimized Compression**: Uses mozjpeg for better compression while maintaining quality

**Implementation:**
- Uses `sharp` library for image conversion
- Converts DALL-E PNG output to optimized JPG
- Quality set to 85% (good balance between size and quality)
- Progressive JPG encoding for better web performance
- Logs file size reduction for monitoring

**Backward Compatibility:**
- API route checks for both JPG (new) and PNG (legacy) formats
- File storage functions support both formats
- Existing PNG images continue to work

### 3. Improved Style Guidance

**Enhanced Style Prompt:**
- More detailed artistic direction
- Emphasis on uniqueness and personal interpretation
- Clear requirements (no text, no faces, no religious symbols)
- Professional quality standards

## Technical Details

### Dependencies

**New Dependency:**
- `sharp` (^0.34.4) - For JPG conversion and optimization

**Installation:**
```bash
npm install sharp
```

### File Format Changes

**Old Format:**
- Files saved as: `MM-DD.png`
- URLs: `/reflections/MM-DD.png`

**New Format:**
- Files saved as: `MM-DD.jpg`
- URLs: `/reflections/MM-DD.jpg`
- Legacy PNG files still supported

### API Changes

**Updated Endpoints:**
- `/api/reflections/[dateKey]` - Now returns image format information and supports both JPG and PNG

**Response Format:**
```json
{
  "image": {
    "url": "/reflections/11-06.jpg",
    "exists": true,
    "format": "jpg"
  }
}
```

## Usage

### Generate Image for Today
```bash
npm run generate-image
```

### Generate Image for Specific Date
```bash
npm run generate-image:date -- --date 11-06
```

### Generate All Images
```bash
npm run generate-all-images
```

### Force Regeneration
```bash
npm run generate-image -- --date 11-06 --force
```

## Expected Results

### File Size Reduction
- **Before**: ~2-3 MB PNG files
- **After**: ~300-600 KB JPG files
- **Reduction**: 60-80% smaller

### Image Quality
- Quality maintained at 85% JPG quality
- Progressive encoding for better web performance
- Visual quality remains high while file size is dramatically reduced

### Uniqueness
- Each image is now uniquely generated based on:
  - The specific reflection title
  - The quote content
  - The reflection comment text
  - Extracted emotional themes
  - Visual metaphors
  - Specific imagery mentioned

## Migration Notes

### Existing Images
- Existing PNG images will continue to work
- No migration needed - both formats are supported
- New images will be generated as JPG

### Regenerating Images
To regenerate existing images in the new JPG format:
```bash
npm run generate-all-images -- --force
```

This will:
1. Generate new images with enhanced prompts
2. Save as JPG format
3. Keep old PNG files (can be manually deleted if desired)

## Troubleshooting

### Sharp Not Available
If sharp is not installed, images will be saved as PNG with a warning message. Install sharp:
```bash
npm install sharp
```

### Image Generation Fails
- Check OpenAI API key is set in `.env.local`
- Verify API quota/limits
- Check console logs for specific error messages

### File Size Not Reduced
- Ensure sharp is installed and working
- Check console logs for conversion messages
- Verify JPG files are being created (check file extension)

## Future Enhancements

Potential future improvements:
- Custom quality settings per image
- Image caching and optimization
- Batch processing optimizations
- A/B testing different prompt styles
- User feedback on image quality

