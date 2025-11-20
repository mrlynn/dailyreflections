/**
 * MongoDB Connection for Reflection Image Generator
 *
 * This module provides utilities for connecting to MongoDB and working with reflections.
 */

import { MongoClient, ObjectId } from "mongodb";
import clientPromise from '../../src/lib/mongodb.js';

/**
 * Get reflection by date
 *
 * @param {number} month - Month (1-12)
 * @param {number} day - Day (1-31)
 * @returns {Promise<Object|null>} - Reflection document or null if not found
 */
export async function getReflectionByDate(month, day) {
  const client = await clientPromise;
  const db = client.db('dailyreflections');

  return db.collection('reflections').findOne({ month, day });
}

/**
 * Get reflections that need image generation
 *
 * @param {Object} options - Query options
 * @param {boolean} options.onlyFailed - Only include reflections with failed image generation
 * @param {boolean} options.force - Include all reflections regardless of image status
 * @returns {Promise<Array>} - Array of reflection documents
 */
export async function getReflectionsForImageGeneration({ onlyFailed = false, force = false }) {
  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const query = {};

  if (!force) {
    if (onlyFailed) {
      // Only reflections with failed image status
      query["image.status"] = "failed";
    } else {
      // Reflections without images or with failed status
      query.$or = [
        { "image.url": { $exists: false } },
        { "image": { $exists: false } },
        { "image.status": "failed" }
      ];
    }
  }

  return db.collection('reflections').find(query).toArray();
}

/**
 * Update reflection with image data
 *
 * @param {string} id - Reflection ID
 * @param {Object} imageData - Image metadata to store
 * @returns {Promise<Object>} - Updated reflection
 */
export async function updateReflectionWithImage(id, imageData) {
  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const _id = typeof id === 'string' ? new ObjectId(id) : id;

  const result = await db.collection('reflections').findOneAndUpdate(
    { _id },
    { $set: { image: imageData } },
    { returnDocument: 'after' }
  );

  return result;
}

/**
 * Set reflection image status to pending
 *
 * @param {string} id - Reflection ID
 * @param {Object} data - Additional data to store with pending status
 * @returns {Promise<Object>} - Updated reflection
 */
export async function setReflectionImagePending(id, data = {}) {
  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const _id = typeof id === 'string' ? new ObjectId(id) : id;
  const revision = data.revision || 0;

  const result = await db.collection('reflections').findOneAndUpdate(
    { _id },
    {
      $set: {
        image: {
          ...data,
          status: "pending",
          revision: revision,
          generatedAt: new Date()
        }
      }
    },
    { returnDocument: 'after' }
  );

  return result;
}

/**
 * Get a reflection by date key (MM-DD format)
 *
 * @param {string} dateKey - Date key in MM-DD format
 * @returns {Promise<Object|null>} - Reflection document or null if not found
 */
export async function getReflectionByDateKey(dateKey) {
  const [month, day] = dateKey.split('-').map(Number);
  return getReflectionByDate(month, day);
}