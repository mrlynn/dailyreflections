/**
 * File Storage Module for Reflection Image Generator
 *
 * This module provides utilities for storing and managing reflection images locally.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

// Base directory for storing reflection images
const REFLECTIONS_DIR = path.join(process.cwd(), "public", "reflections");

/**
 * Ensure the reflections directory exists
 */
function ensureReflectionsDir() {
  if (!fs.existsSync(REFLECTIONS_DIR)) {
    fs.mkdirSync(REFLECTIONS_DIR, { recursive: true });
  }
}

/**
 * Save an image to local storage
 *
 * @param {Object} options - Save options
 * @param {string} options.dateKey - Date key in MM-DD format
 * @param {Buffer} options.imageBuffer - Image data as Buffer
 * @returns {Promise<Object>} - Metadata about the saved image
 */
export async function saveReflectionImage({ dateKey, imageBuffer }) {
  ensureReflectionsDir();

  // Calculate image hash for verification
  const imageHash = crypto.createHash("md5").update(imageBuffer).digest("hex").substring(0, 8);

  // Define file path (JPG format for smaller file size)
  const filePath = path.join(REFLECTIONS_DIR, `${dateKey}.jpg`);

  // Write file
  await fs.promises.writeFile(filePath, imageBuffer);

  // Generate URL for the image (relative to public directory)
  const relativeUrl = `/reflections/${dateKey}.jpg`;

  return {
    url: relativeUrl,
    path: filePath,
    hash: imageHash,
    size: imageBuffer.length,
    dateKey,
  };
}

/**
 * Load image from local storage
 *
 * @param {string} dateKey - Date key in MM-DD format
 * @returns {Promise<Buffer|null>} - Image buffer or null if not found
 */
export async function loadReflectionImage(dateKey) {
  // Try JPG first (new format), then PNG (legacy format)
  const jpgPath = path.join(REFLECTIONS_DIR, `${dateKey}.jpg`);
  const pngPath = path.join(REFLECTIONS_DIR, `${dateKey}.png`);

  try {
    if (fs.existsSync(jpgPath)) {
      return await fs.promises.readFile(jpgPath);
    }
    if (fs.existsSync(pngPath)) {
      return await fs.promises.readFile(pngPath);
    }
  } catch (error) {
    console.warn(`Could not load image for ${dateKey}:`, error);
  }

  return null;
}

/**
 * Check if an image exists for a specific date
 *
 * @param {string} dateKey - Date key in MM-DD format
 * @returns {boolean} - Whether the image exists
 */
export function reflectionImageExists(dateKey) {
  // Check for both JPG (new) and PNG (legacy) formats
  const jpgPath = path.join(REFLECTIONS_DIR, `${dateKey}.jpg`);
  const pngPath = path.join(REFLECTIONS_DIR, `${dateKey}.png`);
  return fs.existsSync(jpgPath) || fs.existsSync(pngPath);
}

/**
 * Get all existing reflection images with their actual file formats
 *
 * @returns {Promise<Array<{dateKey: string, format: string, url: string}>>} - Array of image info
 */
export async function getAllReflectionImages() {
  ensureReflectionsDir();

  const files = await fs.promises.readdir(REFLECTIONS_DIR);

  // Filter for JPG and PNG files with MM-DD naming pattern
  const imageFiles = files.filter(file => file.match(/^\d{2}-\d{2}\.(jpg|png)$/));
  
  // Group by dateKey to handle cases where both formats exist (prefer JPG)
  const imageMap = new Map();
  
  for (const file of imageFiles) {
    const match = file.match(/^(\d{2}-\d{2})\.(jpg|png)$/);
    if (match) {
      const dateKey = match[1];
      const format = match[2];
      
      // If JPG exists, prefer it; otherwise use PNG
      if (!imageMap.has(dateKey) || format === 'jpg') {
        imageMap.set(dateKey, {
          dateKey,
          format,
          url: `/reflections/${dateKey}.${format}`
        });
      }
    }
  }
  
  return Array.from(imageMap.values());
}

/**
 * Create and write a manifest of all generated images
 *
 * @param {Array} images - Array of image metadata objects
 * @returns {Promise<string>} - Path where manifest was saved
 */
export async function writeManifest(images) {
  ensureReflectionsDir();

  const filePath = path.join(REFLECTIONS_DIR, "manifest.json");

  // Write manifest
  await fs.promises.writeFile(
    filePath,
    JSON.stringify({
      images,
      generatedAt: new Date().toISOString(),
      count: images.length
    }, null, 2)
  );

  return filePath;
}

/**
 * Delete a reflection image
 *
 * @param {string} dateKey - Date key in MM-DD format
 * @returns {Promise<boolean>} - Whether the image was deleted
 */
export async function deleteReflectionImage(dateKey) {
  // Delete both JPG and PNG if they exist
  const jpgPath = path.join(REFLECTIONS_DIR, `${dateKey}.jpg`);
  const pngPath = path.join(REFLECTIONS_DIR, `${dateKey}.png`);
  
  let deleted = false;
  
  if (fs.existsSync(jpgPath)) {
    await fs.promises.unlink(jpgPath);
    deleted = true;
  }
  
  if (fs.existsSync(pngPath)) {
    await fs.promises.unlink(pngPath);
    deleted = true;
  }

  return deleted;
}