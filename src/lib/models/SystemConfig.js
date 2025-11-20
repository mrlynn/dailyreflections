/**
 * System Configuration Model
 *
 * Stores system-wide configuration settings
 */

import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

/**
 * Schema for system_config collection:
 *
 * {
 *   _id: ObjectId,
 *   key: String,           // Configuration key (unique)
 *   value: Mixed,          // Configuration value (any type)
 *   category: String,      // Category for grouping settings
 *   description: String,   // Human-readable description
 *   created_at: Date,      // When this config was created
 *   updated_at: Date,      // When this config was last updated
 *   updated_by: ObjectId,  // User who last updated this config
 *   metadata: Object       // Additional metadata
 * }
 */

/**
 * Get a configuration value by key
 * @param {string} key - Configuration key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {Promise<*>} Configuration value
 */
export async function getConfig(key, defaultValue = null) {
  if (!key) throw new Error('Configuration key is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const config = await db.collection('system_config').findOne({ key });
  return config ? config.value : defaultValue;
}

/**
 * Set a configuration value
 * @param {string} key - Configuration key
 * @param {*} value - Configuration value
 * @param {string} category - Configuration category
 * @param {string} description - Human-readable description
 * @param {string} userId - User ID who is setting this value
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<boolean>} Success status
 */
export async function setConfig(key, value, category = 'general', description = '', userId = null, metadata = {}) {
  if (!key) throw new Error('Configuration key is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');
  const now = new Date();

  const update = {
    $set: {
      value,
      category,
      description,
      updated_at: now,
      metadata
    },
    $setOnInsert: {
      key,
      created_at: now
    }
  };

  // Add updater if provided
  if (userId) {
    update.$set.updated_by = typeof userId === 'string' ? new ObjectId(userId) : userId;
  }

  const result = await db.collection('system_config').updateOne(
    { key },
    update,
    { upsert: true }
  );

  return result.acknowledged;
}

/**
 * Get all configurations in a category
 * @param {string} category - Configuration category
 * @returns {Promise<Array>} Array of configuration objects
 */
export async function getCategoryConfigs(category) {
  if (!category) throw new Error('Category is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  return await db.collection('system_config')
    .find({ category })
    .sort({ key: 1 })
    .toArray();
}

/**
 * Get all configuration categories
 * @returns {Promise<Array>} Array of unique category names
 */
export async function getConfigCategories() {
  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const result = await db.collection('system_config').aggregate([
    { $group: { _id: '$category' } },
    { $sort: { _id: 1 } }
  ]).toArray();

  return result.map(doc => doc._id);
}

/**
 * Delete a configuration
 * @param {string} key - Configuration key to delete
 * @returns {Promise<boolean>} Success status
 */
export async function deleteConfig(key) {
  if (!key) throw new Error('Configuration key is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const result = await db.collection('system_config').deleteOne({ key });
  return result.deletedCount === 1;
}