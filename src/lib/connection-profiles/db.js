import { ObjectId } from 'mongodb';
import clientPromise, { connectToDatabase } from '../mongodb';
import { VISIBILITY, sanitizeSlug, isValidSlugFormat, isReservedWord } from './constants';

/**
 * Collection names
 */
const COLLECTIONS = {
  PROFILES: 'user_connection_profiles',
  CONNECTIONS: 'user_connections',
  PROFILE_VIEWS: 'user_connection_profile_views',
};

/**
 * Get MongoDB collections for connection profiles system
 * @returns {Object} Object containing MongoDB collections
 */
export async function getConnectionCollections() {
  const { db } = await connectToDatabase();

  return {
    profiles: db.collection(COLLECTIONS.PROFILES),
    connections: db.collection(COLLECTIONS.CONNECTIONS),
    profileViews: db.collection(COLLECTIONS.PROFILE_VIEWS),
  };
}

/**
 * Create a new connection profile for a user
 *
 * @param {string} userId - User ID
 * @param {Object} profileData - Initial profile data
 * @returns {Promise<Object>} Created profile document
 */
export async function createConnectionProfile(userId, profileData = {}) {
  const { profiles } = await getConnectionCollections();

  // Check if user already has a profile
  const existingProfile = await profiles.findOne({ userId: new ObjectId(userId) });

  if (existingProfile) {
    throw new Error('User already has a connection profile');
  }

  // Generate a unique URL slug
  const urlSlug = await generateUniqueSlug(userId);

  // Create default profile
  const newProfile = {
    userId: new ObjectId(userId),
    urlSlug,
    isEnabled: true,
    visibility: VISIBILITY.AUTHENTICATED, // Default to authenticated users only
    createdAt: new Date(),
    updatedAt: new Date(),

    // Customizable display settings
    displayName: profileData.displayName || '',
    message: profileData.message || '',
    sobrietyDate: profileData.sobrietyDate || null,
    homeGroups: profileData.homeGroups || [],

    // Contact fields with individual visibility settings
    contactFields: [],

    // Appearance customization
    theme: {
      primaryColor: profileData.theme?.primaryColor || '#5d88a6', // Default app blue
      imageUrl: profileData.theme?.imageUrl || null,
    },

    // Connection preferences
    connectionSettings: {
      allowConnectionRequests: true,
      autoAcceptAuthenticated: false,
      notifyOnRequests: true,
      notifyOnConnectionView: false,
    },

    // Stats
    stats: {
      viewCount: 0,
      connectionCount: 0,
      lastViewedAt: null,
    }
  };

  // Insert the new profile
  const result = await profiles.insertOne(newProfile);

  // Update user document to reference the connection profile
  const client = await clientPromise;
  await client
    .db('dailyreflections')
    .collection('users')
    .updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          'connectionProfile.isEnabled': true,
          'connectionProfile.urlSlug': urlSlug,
          'connectionStats.pendingRequests': 0,
          'connectionStats.totalConnections': 0,
        }
      }
    );

  return { ...newProfile, _id: result.insertedId };
}

/**
 * Get a user's connection profile
 *
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User's connection profile or null if not found
 */
export async function getUserConnectionProfile(userId) {
  const { profiles } = await getConnectionCollections();

  return profiles.findOne({ userId: new ObjectId(userId) });
}

/**
 * Get a connection profile by its URL slug
 *
 * @param {string} urlSlug - The URL slug to look up
 * @returns {Promise<Object|null>} Connection profile or null if not found
 */
export async function getConnectionProfileBySlug(urlSlug) {
  const { profiles } = await getConnectionCollections();

  return profiles.findOne({ urlSlug });
}

/**
 * Update a user's connection profile
 *
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated profile
 */
export async function updateConnectionProfile(userId, updates) {
  try {
    const { profiles } = await getConnectionCollections();

    // Remove protected fields that shouldn't be directly updated
    const safeUpdates = { ...updates };
    delete safeUpdates._id;
    delete safeUpdates.userId;
    delete safeUpdates.urlSlug;
    delete safeUpdates.createdAt;
    delete safeUpdates.stats;

    // Add updated timestamp
    safeUpdates.updatedAt = new Date();

    // Check if profile exists first
    const existingProfile = await profiles.findOne({ userId: new ObjectId(userId) });

    if (!existingProfile) {
      throw new Error('Connection profile not found');
    }

    const result = await profiles.findOneAndUpdate(
      { userId: new ObjectId(userId) },
      { $set: safeUpdates },
      { returnDocument: 'after' }
    );

    if (!result) {
      throw new Error('Failed to update connection profile');
    }

    return result;
  } catch (error) {
    console.error('Error in updateConnectionProfile:', error);
    throw error;
  }
}

/**
 * Update a profile's URL slug
 *
 * @param {string} userId - User ID
 * @param {string} newSlug - New URL slug
 * @returns {Promise<Object>} Updated profile
 */
export async function updateProfileSlug(userId, newSlug) {
  const { profiles } = await getConnectionCollections();

  // Validate and sanitize slug
  const cleanSlug = sanitizeSlug(newSlug);

  if (!isValidSlugFormat(cleanSlug)) {
    throw new Error('Invalid slug format. Use 3-30 alphanumeric characters or hyphens.');
  }

  // Check if slug is already taken
  const existingWithSlug = await profiles.findOne({ urlSlug: cleanSlug });
  if (existingWithSlug && existingWithSlug.userId.toString() !== userId) {
    throw new Error('This URL is already taken. Please choose another.');
  }

  // Update the profile
  const result = await profiles.findOneAndUpdate(
    { userId: new ObjectId(userId) },
    {
      $set: {
        urlSlug: cleanSlug,
        updatedAt: new Date()
      }
    },
    { returnDocument: 'after' }
  );

  if (!result) {
    throw new Error('Connection profile not found');
  }

  // Update slug reference in user document
  const client = await clientPromise;
  await client
    .db('dailyreflections')
    .collection('users')
    .updateOne(
      { _id: new ObjectId(userId) },
      { $set: { 'connectionProfile.urlSlug': cleanSlug } }
    );

  return result;
}

/**
 * Record a view of a connection profile
 *
 * @param {string} profileId - Profile ID
 * @param {Object} viewerInfo - Information about the viewer
 * @returns {Promise<void>}
 */
export async function recordProfileView(profileId, viewerInfo = {}) {
  const { profiles, profileViews } = await getConnectionCollections();

  // Create view record
  const viewRecord = {
    profileId: new ObjectId(profileId),
    viewedAt: new Date(),
    viewerId: viewerInfo.userId ? new ObjectId(viewerInfo.userId) : null,
    isAuthenticated: Boolean(viewerInfo.userId),
    ip: viewerInfo.ip || null,
    userAgent: viewerInfo.userAgent || null,
  };

  // Insert view record
  await profileViews.insertOne(viewRecord);

  // Update profile stats
  await profiles.updateOne(
    { _id: new ObjectId(profileId) },
    {
      $inc: { 'stats.viewCount': 1 },
      $set: { 'stats.lastViewedAt': new Date() }
    }
  );
}

/**
 * Generate a unique slug for a user
 *
 * @param {string} userId - User ID to base the slug on
 * @returns {Promise<string>} Generated unique slug
 */
async function generateUniqueSlug(userId) {
  const { profiles } = await getConnectionCollections();

  // Try to generate a unique slug with several attempts
  let slug;
  let isUnique = false;
  let attempts = 0;
  const MAX_ATTEMPTS = 5;

  // Generate random alphanumeric string
  // Avoid confusing chars like '0' vs 'O' or '1' vs 'l'
  function generateRandomSlug(length = 8) {
    const characters = 'abcdefghjkmnpqrstuvwxyz23456789';
    let result = '';

    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return result;
  }

  // Try to create a unique slug
  while (!isUnique && attempts < MAX_ATTEMPTS) {
    slug = generateRandomSlug(8);
    // Check if slug exists
    const existing = await profiles.findOne({ urlSlug: slug });
    isUnique = !existing;
    attempts++;
  }

  // If still not unique, add timestamp to ensure uniqueness
  if (!isUnique) {
    const timestamp = Date.now().toString(36).slice(-4);
    slug = `${generateRandomSlug(6)}${timestamp}`;
  }

  return slug;
}

// These functions are now imported from constants.js