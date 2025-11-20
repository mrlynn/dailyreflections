/**
 * Image Optimization Script
 *
 * This script optimizes large images in the public/reflections directory
 * to improve loading performance and reduce bandwidth usage.
 *
 * Usage:
 * 1. Install sharp: npm install sharp
 * 2. Run: node scripts/optimize-images.js
 */

const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

// Configuration
const REFLECTIONS_DIR = path.join(process.cwd(), 'public', 'reflections');
const QUALITY = 80;  // JPEG quality (0-100)
const MAX_WIDTH = 1792; // Maximum width to maintain aspect ratio
const TARGET_SIZE = 500 * 1024; // Target file size (500KB)
const LARGE_FILE_THRESHOLD = 1024 * 1024; // Consider files larger than 1MB for optimization

async function optimizeImages() {
  try {
    console.log('Starting image optimization...');

    // Get all files in the reflections directory
    const files = await fs.readdir(REFLECTIONS_DIR);
    const imageFiles = files.filter(file => /\.(jpg|jpeg|png)$/i.test(file));

    console.log(`Found ${imageFiles.length} image files to process`);

    let optimizedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process each image
    for (const file of imageFiles) {
      try {
        const filePath = path.join(REFLECTIONS_DIR, file);
        const stats = await fs.stat(filePath);
        const fileSize = stats.size;

        // Skip small files that don't need optimization
        if (fileSize < LARGE_FILE_THRESHOLD) {
          console.log(`Skipping ${file} (${(fileSize / 1024).toFixed(2)} KB - below threshold)`);
          skippedCount++;
          continue;
        }

        console.log(`Processing ${file} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);

        // Create backup
        const backupPath = path.join(REFLECTIONS_DIR, `${file}.backup`);
        await fs.copyFile(filePath, backupPath);

        // Optimize image
        let currentQuality = QUALITY;
        let optimizedBuffer;

        // First pass: resize and set initial quality
        optimizedBuffer = await sharp(filePath)
          .resize({
            width: MAX_WIDTH,
            height: null,
            withoutEnlargement: true,
            fit: 'inside'
          })
          .jpeg({ quality: currentQuality })
          .toBuffer();

        // Adjust quality until target size is reached or quality becomes too low
        while (optimizedBuffer.length > TARGET_SIZE && currentQuality > 40) {
          currentQuality -= 5;
          console.log(`  Reducing quality to ${currentQuality} to meet target size`);

          optimizedBuffer = await sharp(filePath)
            .resize({
              width: MAX_WIDTH,
              height: null,
              withoutEnlargement: true,
              fit: 'inside'
            })
            .jpeg({ quality: currentQuality })
            .toBuffer();
        }

        // Save optimized image
        await fs.writeFile(filePath, optimizedBuffer);

        const newSize = optimizedBuffer.length;
        const savings = ((fileSize - newSize) / fileSize * 100).toFixed(2);

        console.log(`✅ Optimized ${file}: ${(fileSize / 1024 / 1024).toFixed(2)} MB → ${(newSize / 1024 / 1024).toFixed(2)} MB (${savings}% reduction)`);
        optimizedCount++;

      } catch (err) {
        console.error(`❌ Error processing ${file}:`, err.message);
        errorCount++;
      }
    }

    // Summary
    console.log('\nOptimization Complete!');
    console.log(`- Total images: ${imageFiles.length}`);
    console.log(`- Optimized: ${optimizedCount}`);
    console.log(`- Skipped (already small): ${skippedCount}`);
    console.log(`- Errors: ${errorCount}`);

    if (errorCount > 0) {
      console.log('\n⚠️ Some images encountered errors during optimization. Check the logs above.');
    }

  } catch (err) {
    console.error('Failed to process images:', err);
  }
}

// Run the optimization
optimizeImages();