/**
 * S3/R2 Upload Module for Reflection Image Generator
 *
 * This module provides utilities for uploading images to S3 or Cloudflare R2.
 * It supports both AWS S3 and S3-compatible services like Cloudflare R2.
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// Initialize the S3 client with environment variables
const s3 = new S3Client({
  region: process.env.S3_REGION || "auto",
  endpoint: process.env.S3_ENDPOINT, // Set for R2 or other S3-compatible services
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
});

/**
 * Upload an image to S3/R2
 *
 * @param {Object} options - Upload options
 * @param {string} options.key - S3 object key (path in bucket)
 * @param {Buffer} options.body - Image data as Buffer
 * @param {string} options.contentType - MIME type of the image
 * @param {boolean} options.public - Whether the image should be publicly accessible
 * @returns {Promise<string>} - URL of the uploaded image
 */
export async function uploadToS3({ key, body, contentType = "image/png", public: isPublic = true }) {
  const bucket = process.env.S3_BUCKET || "dailyreflections";

  try {
    // Upload the image to S3/R2
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: "public,max-age=31536000,immutable",
        ACL: isPublic ? "public-read" : undefined,
      })
    );

    // Construct and return the URL
    const cdnBaseUrl = process.env.CDN_BASE_URL || `https://${bucket}.${process.env.S3_ENDPOINT?.replace(/^https?:\/\//, "") || "s3.amazonaws.com"}`;
    return `${cdnBaseUrl.replace(/\/$/, "")}/${key}`;
  } catch (error) {
    console.error("Error uploading image to S3:", error);
    throw error;
  }
}

/**
 * Upload an image to S3/R2 with date-based key structure
 *
 * @param {Object} options - Upload options
 * @param {string} options.dateKey - Date key in MM-DD format
 * @param {Buffer} options.imageBuffer - Image data as Buffer
 * @param {string} options.contentType - MIME type of the image (default: image/png)
 * @returns {Promise<Object>} - Upload result with URL and metadata
 */
export async function uploadReflectionImage({ dateKey, imageBuffer, contentType = "image/png" }) {
  // Create S3 key in the format reflections/MM-DD.png
  const key = `reflections/${dateKey}.png`;

  // Calculate image hash for cache busting and verification
  const imageHash = crypto.createHash("md5").update(imageBuffer).digest("hex").substring(0, 8);

  // Upload the image
  const url = await uploadToS3({
    key,
    body: imageBuffer,
    contentType,
  });

  return {
    url,
    key,
    contentType,
    hash: imageHash,
    size: imageBuffer.length,
  };
}

/**
 * Save image to local storage as backup
 *
 * @param {Object} options - Save options
 * @param {string} options.dateKey - Date key in MM-DD format
 * @param {Buffer} options.imageBuffer - Image data as Buffer
 * @returns {Promise<string>} - Path where image was saved
 */
export async function saveLocalBackup({ dateKey, imageBuffer }) {
  const backupDir = path.join(process.cwd(), "public", "reflections");

  // Create directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const filePath = path.join(backupDir, `${dateKey}.png`);

  // Write file
  await fs.promises.writeFile(filePath, imageBuffer);

  return filePath;
}

/**
 * Load image from local storage
 *
 * @param {string} dateKey - Date key in MM-DD format
 * @returns {Promise<Buffer|null>} - Image buffer or null if not found
 */
export async function loadLocalImage(dateKey) {
  const filePath = path.join(process.cwd(), "public", "reflections", `${dateKey}.png`);

  try {
    if (fs.existsSync(filePath)) {
      return fs.promises.readFile(filePath);
    }
  } catch (error) {
    console.warn(`Could not load local image for ${dateKey}:`, error);
  }

  return null;
}

/**
 * Create and write a manifest of all generated images
 *
 * @param {Array} images - Array of image metadata objects
 * @returns {Promise<string>} - Path where manifest was saved
 */
export async function writeManifest(images) {
  const manifestDir = path.join(process.cwd(), "public", "reflections");

  // Create directory if it doesn't exist
  if (!fs.existsSync(manifestDir)) {
    fs.mkdirSync(manifestDir, { recursive: true });
  }

  const filePath = path.join(manifestDir, "manifest.json");

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