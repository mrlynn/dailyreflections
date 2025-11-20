/**
 * User model definitions for password reset and authentication
 *
 * This file defines schemas and functions for user-related operations,
 * particularly for password reset functionality.
 */

/**
 * User schema definition
 *
 * This is a reference schema for the MongoDB users collection.
 * The actual user collection is managed by NextAuth.js adapter.
 *
 * {
 *   _id: ObjectId,
 *   name: String,
 *   displayName: String,
 *   email: String,
 *   emailVerified: Date | null,
 *   image: String | null,
 *   password: String (hashed),
 *   createdAt: Date,
 *   resetPasswordToken: String | null,
 *   resetPasswordExpires: Date | null,
 *
 *   // Onboarding and Personalization Fields
 *   onboarding: {
 *     setupComplete: Boolean,
 *     completedAt: Date,
 *     lastStep: Number,
 *   },
 *   sobriety: {
 *     date: Date,
 *     timezone: String,
 *     milestones: [{
 *       days: Number,
 *       achievedAt: Date,
 *       celebrated: Boolean
 *     }]
 *   },
 *   preferences: {
 *     notifications: {
 *       enabled: Boolean,
 *       morningTime: String, // "HH:MM" format (24hr)
 *       eveningTime: String, // "HH:MM" format (24hr)
 *       quietHoursStart: String, // "HH:MM" format (24hr)
 *       quietHoursEnd: String, // "HH:MM" format (24hr)
 *       channels: {
 *         app: Boolean,
 *         email: Boolean,
 *         sms: Boolean
 *       }
 *     },
 *     accountability: {
 *       contacts: [{
 *         id: String,
 *         name: String,
 *         email: String,
 *         phone: String,
 *         relationship: String,
 *         addedAt: Date
 *       }],
 *       shareInventory: Boolean,
 *       shareMilestones: Boolean
 *     },
 *     theme: String, // "light", "dark", "system"
 *     useDailyLoop: Boolean // Enable morning-midday-night flow
 *   },
 *   roles: [String], // Array of role names, e.g. ["admin", "volunteer_listener"]
 *   volunteer: { // Volunteer-specific data
 *     codeOfConductAccepted: Boolean,
 *     codeOfConductAcceptedAt: Date,
 *     isActive: Boolean,
 *     availability: [{
 *       day: Number, // 0-6 for Sunday-Saturday
 *       startTime: String, // "HH:MM" format (24hr)
 *       endTime: String, // "HH:MM" format (24hr)
 *     }]
 *   }
 * }
 */

import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import crypto from 'crypto';
import cryptoRandomString from 'crypto-random-string';

/**
 * Generate a secure random token for password reset
 * @returns {string} Random token
 */
export function generateResetToken() {
  return cryptoRandomString({ length: 40, type: 'url-safe' });
}

/**
 * Create password reset token for user
 * @param {string} email User email
 * @returns {Promise<{token: string, user: object} | null>} Token and user info or null if user not found
 */
export async function createPasswordResetToken(email) {
  const client = await clientPromise;
  const db = client.db('dailyreflections');

  // Find user by email
  const user = await db.collection('users').findOne({
    email: email.toLowerCase()
  });

  if (!user) {
    return null;
  }

  // Check if user has a password (email/password users only)
  if (!user.password) {
    return null; // OAuth users don't have passwords to reset
  }

  // Generate token
  const token = generateResetToken();

  // Set token expiration (1 hour from now)
  const expires = new Date();
  expires.setHours(expires.getHours() + 1);

  // Update user with reset token and expiration
  await db.collection('users').updateOne(
    { _id: user._id },
    {
      $set: {
        resetPasswordToken: token,
        resetPasswordExpires: expires
      }
    }
  );

  return {
    token,
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name
    }
  };
}

/**
 * Verify password reset token
 * @param {string} token Reset token
 * @returns {Promise<object | null>} User object if token valid, null otherwise
 */
export async function verifyResetToken(token) {
  if (!token) return null;

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  // Find user with matching token that hasn't expired
  const user = await db.collection('users').findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: new Date() }
  });

  return user ? {
    id: user._id.toString(),
    email: user.email
  } : null;
}

/**
 * Reset password for user
 * @param {string} token Reset token
 * @param {string} newPassword New password (plain text)
 * @param {Function} hashFunction Function to hash password (bcrypt.hash)
 * @returns {Promise<boolean>} Success status
 */
export async function resetPassword(token, newPassword, hashFunction) {
  const client = await clientPromise;
  const db = client.db('dailyreflections');

  // Find user with this token
  const user = await db.collection('users').findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: new Date() }
  });

  if (!user) {
    return false;
  }

  // Hash the new password
  const hashedPassword = await hashFunction(newPassword, 12);

  // Update password and clear reset token fields
  await db.collection('users').updateOne(
    { _id: user._id },
    {
      $set: { password: hashedPassword },
      $unset: { resetPasswordToken: "", resetPasswordExpires: "" }
    }
  );

  return true;
}

/**
 * Update user onboarding status
 * @param {string} userId User ID
 * @param {Object} onboardingData Onboarding data to update
 * @param {boolean} onboardingData.setupComplete Whether onboarding is complete
 * @param {number} onboardingData.lastStep Last completed step number
 * @returns {Promise<boolean>} Success status
 */
export async function updateUserOnboarding(userId, onboardingData) {
  if (!userId) throw new Error('User ID is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const updateData = {};

  // Handle lastStep if provided
  if (onboardingData.lastStep !== undefined) {
    updateData['onboarding.lastStep'] = onboardingData.lastStep;
  }

  // Handle setupComplete - explicitly check for true or false
  if (onboardingData.setupComplete === true) {
    updateData['onboarding.setupComplete'] = true;
    updateData['onboarding.completedAt'] = new Date();
    updateData['profile.isComplete'] = true;
  } else if (onboardingData.setupComplete === false) {
    updateData['onboarding.setupComplete'] = false;
    updateData['onboarding.completedAt'] = null;
    updateData['profile.isComplete'] = false;
  }

  const result = await db.collection('users').updateOne(
    { _id: typeof userId === 'string' ? new ObjectId(userId) : userId },
    { $set: updateData }
  );

  return result.modifiedCount === 1;
}

/**
 * Update user sobriety information
 * @param {string} userId User ID
 * @param {Object} sobrietyData Sobriety data to update
 * @param {Date|string} sobrietyData.date Sobriety date
 * @param {string} sobrietyData.timezone User's timezone
 * @returns {Promise<boolean>} Success status
 */
export async function updateUserSobriety(userId, sobrietyData) {
  if (!userId) throw new Error('User ID is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const updateData = {};

  if (sobrietyData.date) {
    updateData['sobriety.date'] = new Date(sobrietyData.date);
  }

  if (sobrietyData.timezone) {
    updateData['sobriety.timezone'] = sobrietyData.timezone;
  }

  const result = await db.collection('users').updateOne(
    { _id: typeof userId === 'string' ? new ObjectId(userId) : userId },
    { $set: updateData }
  );

  return result.modifiedCount === 1;
}

/**
 * Update user notification preferences
 * @param {string} userId User ID
 * @param {Object} notificationPrefs Notification preferences to update
 * @returns {Promise<boolean>} Success status
 */
export async function updateUserNotificationPreferences(userId, notificationPrefs) {
  if (!userId) throw new Error('User ID is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  // Flatten the notification preferences for MongoDB update
  const updateData = {};

  Object.entries(notificationPrefs).forEach(([key, value]) => {
    if (key === 'channels' && typeof value === 'object') {
      // Handle nested channels object
      Object.entries(value).forEach(([channelKey, channelValue]) => {
        updateData[`preferences.notifications.channels.${channelKey}`] = channelValue;
      });
    } else {
      updateData[`preferences.notifications.${key}`] = value;
    }
  });

  const result = await db.collection('users').updateOne(
    { _id: typeof userId === 'string' ? new ObjectId(userId) : userId },
    { $set: updateData }
  );

  return result.modifiedCount === 1;
}

/**
 * Update user accountability preferences
 * @param {string} userId User ID
 * @param {Object} accountabilityPrefs Accountability preferences to update
 * @returns {Promise<boolean>} Success status
 */
export async function updateUserAccountabilityPreferences(userId, accountabilityPrefs) {
  if (!userId) throw new Error('User ID is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  // Flatten the accountability preferences for MongoDB update
  const updateData = {};

  Object.entries(accountabilityPrefs).forEach(([key, value]) => {
    if (key === 'contacts' && Array.isArray(value)) {
      // Handle contacts array - ensure addedAt dates are set
      const contactsWithDates = value.map(contact => ({
        ...contact,
        addedAt: contact.addedAt || new Date()
      }));
      updateData['preferences.accountability.contacts'] = contactsWithDates;
    } else {
      updateData[`preferences.accountability.${key}`] = value;
    }
  });

  const result = await db.collection('users').updateOne(
    { _id: typeof userId === 'string' ? new ObjectId(userId) : userId },
    { $set: updateData }
  );

  return result.modifiedCount === 1;
}

/**
 * Get user preferences including onboarding status
 * @param {string} userId User ID
 * @returns {Promise<Object|null>} User preferences or null if not found
 */
export async function getUserPreferences(userId) {
  if (!userId) throw new Error('User ID is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const user = await db.collection('users').findOne(
    { _id: typeof userId === 'string' ? new ObjectId(userId) : userId },
    {
      projection: {
        onboarding: 1,
        sobriety: 1,
        preferences: 1
      }
    }
  );

  return user;
}

/**
 * Get user by ID with all fields
 * @param {string} userId User ID
 * @returns {Promise<Object|null>} User object or null if not found
 */
export async function getUserById(userId) {
  if (!userId) throw new Error('User ID is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const user = await db.collection('users').findOne(
    { _id: typeof userId === 'string' ? new ObjectId(userId) : userId }
  );

  return user;
}

/**
 * Add the volunteer_listener role to a user
 * @param {string} userId User ID
 * @returns {Promise<boolean>} Success status
 */
export async function addVolunteerRole(userId) {
  if (!userId) throw new Error('User ID is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  // First get the user to see if they already have the role
  const user = await db.collection('users').findOne(
    { _id: typeof userId === 'string' ? new ObjectId(userId) : userId },
    { projection: { roles: 1 } }
  );

  if (!user) {
    throw new Error('User not found');
  }

  // Check if user already has the role
  const roles = user.roles || [];
  if (roles.includes('volunteer_listener')) {
    return true; // Already has the role
  }

  // Add the role
  const result = await db.collection('users').updateOne(
    { _id: typeof userId === 'string' ? new ObjectId(userId) : userId },
    {
      $addToSet: { roles: 'volunteer_listener' },
      $set: {
        'volunteer.isActive': true,
        'volunteer.activatedAt': new Date()
      }
    }
  );

  return result.modifiedCount === 1;
}

/**
 * Remove the volunteer_listener role from a user
 * @param {string} userId User ID
 * @returns {Promise<boolean>} Success status
 */
export async function removeVolunteerRole(userId) {
  if (!userId) throw new Error('User ID is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const result = await db.collection('users').updateOne(
    { _id: typeof userId === 'string' ? new ObjectId(userId) : userId },
    {
      $pull: { roles: 'volunteer_listener' },
      $set: { 'volunteer.isActive': false }
    }
  );

  return result.modifiedCount === 1;
}