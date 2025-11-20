/**
 * Admin utility functions for authorization and admin operations
 */

import { getSession } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';

/**
 * Check if a user is an admin based on the session
 * @param {Object} session - The session object from getSession()
 * @returns {boolean} - Whether the user is an admin
 */
export function isAdmin(session) {
  return session?.user?.isAdmin === true;
}

/**
 * Server-side function to check if a request is from an admin
 * @param {Request} request - The request object
 * @returns {Promise<boolean>} - Whether the request is from an admin
 */
export async function isAdminRequest(request) {
  const session = await getSession(request);
  return isAdmin(session);
}

/**
 * Make a user an admin
 * @param {string} email - The email of the user to make admin
 * @returns {Promise<{ success: boolean, message: string }>} - Result of the operation
 */
export async function makeUserAdmin(email) {
  try {
    const client = await clientPromise;
    const db = client.db('dailyreflections');

    const result = await db.collection('users').updateOne(
      { email: email.toLowerCase() },
      { $set: { isAdmin: true } }
    );

    if (result.matchedCount === 0) {
      return { success: false, message: 'User not found' };
    }

    return { success: true, message: 'User is now an admin' };
  } catch (error) {
    console.error('Error making user admin:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Remove admin privileges from a user
 * @param {string} email - The email of the user to remove admin from
 * @returns {Promise<{ success: boolean, message: string }>} - Result of the operation
 */
export async function removeUserAdmin(email) {
  try {
    const client = await clientPromise;
    const db = client.db('dailyreflections');

    const result = await db.collection('users').updateOne(
      { email: email.toLowerCase() },
      { $set: { isAdmin: false } }
    );

    if (result.matchedCount === 0) {
      return { success: false, message: 'User not found' };
    }

    return { success: true, message: 'User is no longer an admin' };
  } catch (error) {
    console.error('Error removing admin status:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Get all admin users
 * @returns {Promise<Array>} - Array of admin users
 */
export async function getAdminUsers() {
  try {
    const client = await clientPromise;
    const db = client.db('dailyreflections');

    // Find users with isAdmin: true and project only necessary fields
    const adminUsers = await db.collection('users')
      .find({ isAdmin: true })
      .project({
        email: 1,
        name: 1,
        displayName: 1,
        image: 1,
        createdAt: 1
      })
      .toArray();

    return adminUsers;
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return [];
  }
}