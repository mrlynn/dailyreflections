import { createMetadata, formatDateKeyForSEO, getBaseUrl } from '@/utils/seoUtils';
import clientPromise from '@/lib/mongodb';
import { parseDateKey } from '@/utils/dateUtils';
import { promises as fs } from 'fs';
import path from 'path';
import { cache } from 'react';

/**
 * Cached function to check if a file exists at a given path
 * This reduces redundant filesystem accesses for image checks
 */
const fileExists = cache(async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
});

/**
 * Cached function to fetch reflection data for a specific date
 * Using React's cache() to avoid redundant database queries
 */
const getReflectionData = cache(async (dateKey) => {
  try {
    if (!/^\d{2}-\d{2}$/.test(dateKey)) {
      return null;
    }

    const client = await clientPromise;
    const db = client.db('dailyreflections');
    const { month, day } = parseDateKey(dateKey);

    const reflection = await db.collection('reflections').findOne({
      month,
      day,
    });

    return reflection;
  } catch (error) {
    console.error('Error fetching reflection data for caching:', error);
    return null;
  }
});

/**
 * Generate dynamic metadata for daily reflection pages
 */
export async function generateMetadata({ params }) {
  try {
    const { dateKey } = await params;

    // Validate dateKey format
    if (!/^\d{2}-\d{2}$/.test(dateKey)) {
      // Return default metadata for invalid dates
      return createMetadata({
        title: 'Daily Reflection',
        description: 'Daily recovery reflection from Alcoholics Anonymous literature',
        path: `/${dateKey}`,
      });
    }

    // Parse month/day for later metadata usage
    const parsedDate = parseDateKey(dateKey);
    const monthNumber = parsedDate?.month ?? parseInt(dateKey.split('-')[0], 10);
    const dayNumber = parsedDate?.day ?? parseInt(dateKey.split('-')[1], 10);
    const monthString = String(monthNumber).padStart(2, '0');
    const dayString = String(dayNumber).padStart(2, '0');

    // Use cached function to fetch reflection data
    const reflection = await getReflectionData(dateKey);

    if (!reflection) {
      // Return default metadata if reflection not found
      const formattedDate = formatDateKeyForSEO(dateKey);
      return createMetadata({
        title: `Daily Reflection - ${formattedDate}`,
        description: `Daily recovery reflection for ${formattedDate} from Alcoholics Anonymous literature`,
        path: `/${dateKey}`,
      });
    }

    // Create rich metadata from reflection data
    const formattedDate = formatDateKeyForSEO(dateKey);
    const title = `${reflection.title} - ${formattedDate}`;

    // Extract and clean text from reflection comment for better social sharing
    let cleanCommentText = '';
    if (reflection.comment) {
      // Use commentCleaned field if available, otherwise sanitize HTML
      if (reflection.commentCleaned) {
        cleanCommentText = reflection.commentCleaned;
      } else {
        cleanCommentText = reflection.comment
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }
    }

    // Create more comprehensive description that combines quote and comment
    let description = '';

    // Start with the quote if available
    if (reflection.quote) {
      description = `"${reflection.quote}" `;
    }

    // Add a portion of the reflection text if available
    if (cleanCommentText.length > 0) {
      // Calculate how much space we have left after the quote
      const maxLength = 280; // Good length for social sharing
      const quoteLength = description.length;
      const availableSpace = Math.max(maxLength - quoteLength - 3, 50); // Ensure at least some comment text

      // Add truncated comment text to the description
      description += `${cleanCommentText.substring(0, availableSpace)}${cleanCommentText.length > availableSpace ? '...' : ''}`;
    } else {
      // Fallback if no comment text is available
      description = description || `Daily reflection for ${formattedDate}: ${reflection.title}. Explore recovery wisdom and share your insights.`;
    }

    // Ensure the description mentions the formatted date if not already included
    if (!description.includes(formattedDate)) {
      description += ` (${formattedDate})`;
    }

    // Check for day-specific reflection image (JPG or PNG)
    let ogImage = null;
    const baseUrl = getBaseUrl();

    // Get image URL from reflection if available (avoids filesystem checks)
    if (reflection.image && reflection.image.url) {
      // Ensure baseUrl doesn't have trailing slash
      const formattedBaseUrl = baseUrl.replace(/\/$/, '');
      ogImage = `${formattedBaseUrl}${reflection.image.url}`;
    } else {
      // Legacy fallback approach checking the filesystem
      // Check for JPG first (new format), then PNG (legacy) using cached function
      const jpgPath = path.join(process.cwd(), 'public', 'reflections', `${dateKey}.jpg`);
      const pngPath = path.join(process.cwd(), 'public', 'reflections', `${dateKey}.png`);

      // Ensure baseUrl doesn't have trailing slash
      const formattedBaseUrl = baseUrl.replace(/\/$/, '');

      // Use cached fileExists function for both checks
      const jpgExists = await fileExists(jpgPath);
      if (jpgExists) {
        ogImage = `${formattedBaseUrl}/reflections/${dateKey}.jpg`;
      } else {
        const pngExists = await fileExists(pngPath);
        if (pngExists) {
          ogImage = `${formattedBaseUrl}/reflections/${dateKey}.png`;
        } else {
          // No image found, will use default logo
          ogImage = null;
        }
      }
    }

    // Enhance keywords with more relevant terms from the reflection title
    const keywords = [
      'daily reflection',
      formattedDate.toLowerCase(),
      ...reflection.title.toLowerCase().split(' ').filter(word => word.length > 3),
      'AA literature',
      'Alcoholics Anonymous',
      'recovery',
      'sobriety',
      '12 steps',
    ];

    // Create additional metadata for social sharing
    const publishedTime = new Date(`2023-${monthString}-${dayString}`).toISOString();

    return createMetadata({
      title,
      description,
      path: `/${dateKey}`,
      keywords: Array.from(new Set(keywords)).slice(0, 12), // Deduplicate and limit to 12 keywords
      ogImage: ogImage || undefined, // Use day-specific image or fallback to default
      ogType: 'article',
      // Add these extra properties for more complete OpenGraph
      additionalMetadata: {
        openGraph: {
          // Enhanced article metadata for better social sharing
          article: {
            publishedTime,
            author: 'Alcoholics Anonymous World Services, Inc.',
            section: 'Daily Reflections',
            tags: [formattedDate.toLowerCase(), 'daily reflection', 'recovery', 'aa literature']
          }
        }
        // Removed duplicate tags that are already provided in the main metadata object
        // The og:title, og:description, twitter:title, twitter:description, and twitter:card
        // will be handled by the core metadata object created in seoUtils.js
      }
    });
  } catch (error) {
    console.error('Error generating metadata for dateKey:', error);
    // Return default metadata on error
    return createMetadata({
      title: 'Daily Reflection',
      description: 'Daily recovery reflection from Alcoholics Anonymous literature',
      path: `/${params?.dateKey || ''}`,
    });
  }
}

export default function DateKeyLayout({ children }) {
  return children;
}
