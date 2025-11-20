/**
 * Generate manifest.json for all reflection images
 * 
 * This script scans the public/reflections directory and creates a manifest.json
 * file listing all available reflection images (preferring JPG over PNG).
 */

import { getAllReflectionImages, writeManifest } from './lib/fileStorage.js';

async function generateManifest() {
  try {
    console.log('📋 Generating reflection image manifest...');
    
    // Get all reflection images (prefers JPG over PNG)
    const images = await getAllReflectionImages();
    
    // Sort by dateKey for consistent ordering
    images.sort((a, b) => {
      const [aMonth, aDay] = a.dateKey.split('-').map(Number);
      const [bMonth, bDay] = b.dateKey.split('-').map(Number);
      
      if (aMonth !== bMonth) {
        return aMonth - bMonth;
      }
      return aDay - bDay;
    });
    
    console.log(`✅ Found ${images.length} reflection images`);
    
    // Write the manifest
    const manifestPath = await writeManifest(images);
    
    console.log(`✨ Manifest generated successfully!`);
    console.log(`   Location: ${manifestPath}`);
    console.log(`   Total images: ${images.length}`);
    
    // Show some stats
    const jpgCount = images.filter(img => img.format === 'jpg').length;
    const pngCount = images.filter(img => img.format === 'png').length;
    
    console.log(`\n📊 Format breakdown:`);
    console.log(`   JPG: ${jpgCount}`);
    console.log(`   PNG: ${pngCount}`);
    
    if (pngCount > 0) {
      console.log(`\n⚠️  Note: ${pngCount} PNG files found. Consider converting to JPG for better performance.`);
    }
    
  } catch (error) {
    console.error('❌ Error generating manifest:', error);
    process.exit(1);
  }
}

// Run the script
generateManifest();

