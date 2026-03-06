#!/usr/bin/env node
/**
 * Compress reflection JPG images to reduce repo size
 *
 * Uses sharp to compress with quality 82 and optional resize.
 * Run from project root: node scripts/compress-reflection-images.js
 *
 * Options:
 *   --dry-run    Show what would be compressed without writing
 *   --quality N  JPEG quality 1-100 (default: 82)
 *   --max-width N  Resize if wider (default: 1200, 0 to disable)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const REFLECTIONS_DIR = path.join(__dirname, '../public/reflections');
const DEFAULT_QUALITY = 82;
const DEFAULT_MAX_WIDTH = 1200;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const qualityArg = args.find(a => a.startsWith('--quality='));
const quality = qualityArg ? parseInt(qualityArg.split('=')[1], 10) : DEFAULT_QUALITY;
const widthArg = args.find(a => a.startsWith('--max-width='));
const maxWidth = widthArg ? parseInt(widthArg.split('=')[1], 10) : DEFAULT_MAX_WIDTH;

async function compressImage(filePath) {
  const stats = fs.statSync(filePath);
  const originalSize = stats.size;

  let pipeline = sharp(filePath);
  const metadata = await pipeline.metadata();
  const needsResize = maxWidth > 0 && metadata.width > maxWidth;

  if (needsResize) {
    pipeline = pipeline.resize(maxWidth, null, { withoutEnlargement: true });
  }
  pipeline = pipeline.jpeg({ quality, mozjpeg: true });

  const buffer = await pipeline.toBuffer();
  const newSize = buffer.length;

  return { originalSize, newSize, needsResize, buffer };
}

async function main() {
  if (!fs.existsSync(REFLECTIONS_DIR)) {
    console.error('Reflections directory not found:', REFLECTIONS_DIR);
    process.exit(1);
  }

  const files = fs.readdirSync(REFLECTIONS_DIR)
    .filter(f => f.endsWith('.jpg'))
    .map(f => path.join(REFLECTIONS_DIR, f));

  if (files.length === 0) {
    console.log('No JPG files found in', REFLECTIONS_DIR);
    process.exit(0);
  }

  console.log(`Compressing ${files.length} images (quality=${quality}, maxWidth=${maxWidth})`);
  if (dryRun) console.log('DRY RUN - no files will be modified\n');

  let totalOriginal = 0;
  let totalNew = 0;
  let resized = 0;

  for (const filePath of files) {
    try {
      const { originalSize, newSize, needsResize, buffer } = await compressImage(filePath);
      totalOriginal += originalSize;

      if (!dryRun && buffer && newSize < originalSize) {
        fs.writeFileSync(filePath, buffer);
        totalNew += newSize;
      } else {
        totalNew += dryRun ? newSize : originalSize;
      }
      if (needsResize) resized++;
    } catch (err) {
      console.error('Error:', path.basename(filePath), err.message);
    }
  }

  const saved = totalOriginal - totalNew;
  const pct = ((saved / totalOriginal) * 100).toFixed(1);

  console.log('\n--- Summary ---');
  console.log(`Original: ${(totalOriginal / 1024 / 1024).toFixed(1)} MB`);
  console.log(`${dryRun ? 'Estimated' : 'New'}: ${(totalNew / 1024 / 1024).toFixed(1)} MB`);
  console.log(`Saved: ${(saved / 1024 / 1024).toFixed(1)} MB (${pct}%)`);
  if (resized > 0) console.log(`Resized: ${resized} images`);
  if (dryRun) console.log('\nRun without --dry-run to apply compression.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
