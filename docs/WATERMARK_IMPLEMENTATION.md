# Watermark Implementation

## Overview

Daily reflection images are automatically watermarked with the app logo (`logo-white.png`) during the image generation process. This ensures brand consistency and helps protect the images when shared.

## Implementation

### Automated Watermarking

The watermarking is integrated directly into the image generation pipeline using `sharp`, the same library used for JPG conversion. This means:

- ✅ **Fully automated** - No separate script needed
- ✅ **Integrated workflow** - Part of the existing generation process
- ✅ **Consistent** - Uses the same toolchain (Node.js/JavaScript)
- ✅ **Efficient** - Single pass processing

### Watermark Configuration

**Default Settings:**
- **Position**: Bottom-right corner
- **Opacity**: 70% (0.7)
- **Size**: 12% of image width
- **Padding**: 24 pixels from edges

**Position Options:**
- `bottom-right` (default)
- `bottom-left`
- `top-right`
- `top-left`

### Technical Details

The watermarking process:

1. **Loads the logo** from `public/logo-white.png`
2. **Resizes the logo** to 12% of the reflection image width (maintains aspect ratio)
3. **Applies opacity** by modifying the alpha channel (70% opacity)
4. **Positions the logo** in the bottom-right corner with 24px padding
5. **Composites onto the image** using the 'over' blend mode
6. **Converts to JPG** with optimization

### Code Location

The watermarking functionality is in:
- `scripts/lib/imageProvider.js` - `addWatermark()` function
- Integrated into `convertToJpg()` function

### Usage

Watermarking is **enabled by default** for all new image generations. It happens automatically when:

```bash
npm run generate-image -- --date 11-06
```

To disable watermarking (if needed), you would modify the `convertToJpg()` call in `imageProvider.js`:

```javascript
const jpgBuffer = await convertToJpg(imageBuffer, 85, false); // false = no watermark
```

### Customization

To customize watermark settings, modify the options in `convertToJpg()`:

```javascript
processedBuffer = await addWatermark(imageBuffer, {
  position: 'bottom-right',  // Change position
  opacity: 0.7,              // Change opacity (0-1)
  size: 0.12,                // Change size (percentage of width)
  padding: 24                // Change padding (pixels)
});
```

### Image Quality

The watermark:
- Uses the white logo variant for visibility on various backgrounds
- Maintains aspect ratio when resizing
- Applies smooth opacity for professional appearance
- Doesn't significantly impact file size

### Error Handling

If watermarking fails:
- The process logs a warning
- Falls back to image without watermark
- Image generation continues normally
- No errors are thrown

This ensures image generation always succeeds, even if watermarking has issues.

## Benefits

1. **Brand Protection** - Images are clearly marked with your logo
2. **Brand Consistency** - All shared images include your branding
3. **Professional Appearance** - Subtle, tasteful watermarking
4. **Automated** - No manual steps required
5. **Flexible** - Easy to customize position, size, and opacity

## Future Enhancements

Potential improvements:
- Configurable watermark settings via environment variables
- Different watermark styles (text, icon-only, etc.)
- Watermark position based on image content analysis
- Batch watermarking for existing images

