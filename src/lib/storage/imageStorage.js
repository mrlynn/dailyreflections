import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

/**
 * Image Storage for Generated Artwork
 *
 * Supports both local development and production (S3/R2)
 */

// Initialize S3 client for production
const s3Client = new S3Client({
  region: process.env.S3_REGION || 'auto',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
});

/**
 * Determine if we're running in production (Vercel)
 */
function isProduction() {
  return process.env.VERCEL || process.env.NODE_ENV === 'production';
}

/**
 * Upload image to S3/R2
 */
async function uploadToS3({ key, buffer, contentType = 'image/jpeg' }) {
  const bucket = process.env.S3_BUCKET || 'dailyreflections';

  const params = {
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public,max-age=31536000,immutable',
  };

  // Only add ACL if explicitly configured (many buckets have ACLs disabled)
  if (process.env.S3_USE_ACL === 'true') {
    params.ACL = 'public-read';
  }

  await s3Client.send(new PutObjectCommand(params));

  // Construct CDN URL
  const cdnBaseUrl =
    process.env.CDN_BASE_URL ||
    `https://${bucket}.s3.${process.env.S3_REGION || 'us-east-1'}.amazonaws.com`;

  return `${cdnBaseUrl.replace(/\/$/, '')}/${key}`;
}

/**
 * Save image locally (development only)
 */
async function saveToLocalFilesystem({ filename, buffer }) {
  // Only works in development (Vercel filesystem is read-only)
  if (isProduction()) {
    throw new Error('Cannot write to filesystem in production');
  }

  const fs = await import('fs');
  const path = await import('path');

  const publicDir = path.join(process.cwd(), 'public', 'generated-art');

  // Create directory if it doesn't exist
  try {
    await fs.promises.mkdir(publicDir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }

  const localPath = path.join(publicDir, filename);
  await fs.promises.writeFile(localPath, buffer);

  return `/generated-art/${filename}`;
}

/**
 * Download image from URL and save to storage
 *
 * In production: Uploads to S3/R2
 * In development: Saves to public/reflections/
 *
 * @param {string} imageUrl - The OpenAI CDN URL
 * @param {string} filename - Target filename (e.g., "12-02.jpg")
 * @returns {Promise<Object>} - { success, publicUrl, cdnUrl, size }
 */
export async function downloadAndSaveImage(imageUrl, filename) {
  try {
    console.log(`[Image Storage] Downloading image: ${filename}`);
    console.log(`[Image Storage] Source URL: ${imageUrl}`);

    // Fetch the image from OpenAI CDN
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    // Get image as buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`[Image Storage] Downloaded ${buffer.length} bytes`);

    // Calculate hash for verification
    const imageHash = crypto.createHash('md5').update(buffer).digest('hex').substring(0, 8);

    let publicUrl, cdnUrl;

    if (isProduction()) {
      // Production: Upload to S3/R2
      console.log('[Image Storage] Production mode - uploading to S3/R2');
      const key = `generated-art/${filename}`;
      cdnUrl = await uploadToS3({
        key,
        buffer,
        contentType: filename.endsWith('.png') ? 'image/png' : 'image/jpeg',
      });
      publicUrl = cdnUrl; // Same URL for production
      console.log(`[Image Storage] Uploaded to S3: ${cdnUrl}`);
    } else {
      // Development: Save to local filesystem
      console.log('[Image Storage] Development mode - saving to local filesystem');
      publicUrl = await saveToLocalFilesystem({ filename, buffer });
      cdnUrl = null; // No CDN in development
      console.log(`[Image Storage] Saved locally: ${publicUrl}`);
    }

    return {
      success: true,
      publicUrl,  // URL to serve to users
      cdnUrl,     // S3/R2 URL (null in development)
      size: buffer.length,
      hash: imageHash,
      savedAt: new Date(),
      storage: isProduction() ? 's3' : 'local',
    };
  } catch (error) {
    console.error('[Image Storage] Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Generate filename from date key
 * @param {string} dateKey - Date in YYYY-MM-DD format
 * @returns {string} - Filename like "12-02.jpg"
 */
export function getFilenameFromDate(dateKey) {
  const [year, month, day] = dateKey.split('-');
  return `${month}-${day}.jpg`;
}

/**
 * Check if an image exists in storage
 * @param {string} filename - Filename to check
 * @returns {Promise<boolean>}
 */
export async function imageExists(filename) {
  if (isProduction()) {
    // In production, we'd need to check S3
    // For now, return false to allow uploads
    return false;
  } else {
    // In development, check local filesystem
    const fs = await import('fs');
    const path = await import('path');
    const localPath = path.join(process.cwd(), 'public', 'generated-art', filename);
    try {
      await fs.promises.access(localPath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }
}
