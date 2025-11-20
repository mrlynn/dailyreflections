/**
 * Volunteer Application Model
 *
 * Stores application information for users who want to become chat volunteers
 */

import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

/**
 * Schema for volunteer_applications collection:
 *
 * {
 *   _id: ObjectId,
 *   user_id: ObjectId,          // Reference to user
 *   status: String,             // "pending", "approved", "rejected"
 *   responses: {               // Application form responses
 *     sobrietyDuration: String,
 *     volunteerMotivation: String,
 *     recoveryConnection: String,
 *     serviceMeaning: String
 *   },
 *   created_at: Date,
 *   reviewed_by: [ObjectId],    // Admin IDs who reviewed
 *   approved: Boolean,
 *   approved_at: Date,
 *   rejected_at: Date,
 *   rejection_reason: String,
 *   code_of_conduct_accepted: Boolean,
 *   code_of_conduct_accepted_at: Date,
 *   notes: [                    // Admin notes on application
 *     {
 *       admin_id: ObjectId,
 *       content: String,
 *       created_at: Date
 *     }
 *   ]
 * }
 */

/**
 * Create a new volunteer application
 * @param {string} userId - User ID of the applicant
 * @param {Object} responses - Application form responses
 * @returns {Promise<Object>} Created application object
 */
export async function createVolunteerApplication(userId, responses) {
  if (!userId) throw new Error('User ID is required');
  if (!responses) throw new Error('Application responses are required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  // Check if user already has an active application
  const existingApplication = await db.collection('volunteer_applications').findOne({
    user_id: typeof userId === 'string' ? new ObjectId(userId) : userId,
    status: { $in: ['pending', 'approved'] }
  });

  if (existingApplication) {
    throw new Error('User already has an active volunteer application');
  }

  const application = {
    user_id: typeof userId === 'string' ? new ObjectId(userId) : userId,
    status: 'pending',
    responses,
    created_at: new Date(),
    reviewed_by: [],
    approved: false,
    notes: []
  };

  const result = await db.collection('volunteer_applications').insertOne(application);

  return {
    ...application,
    _id: result.insertedId
  };
}

/**
 * Get a volunteer application by ID
 * @param {string} applicationId - Application ID
 * @returns {Promise<Object|null>} Application object or null if not found
 */
export async function getVolunteerApplicationById(applicationId) {
  const client = await clientPromise;
  const db = client.db('dailyreflections');

  return await db.collection('volunteer_applications').findOne({
    _id: typeof applicationId === 'string' ? new ObjectId(applicationId) : applicationId
  });
}

/**
 * Get volunteer application by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Most recent application or null if not found
 */
export async function getVolunteerApplicationByUserId(userId) {
  const client = await clientPromise;
  const db = client.db('dailyreflections');

  return await db.collection('volunteer_applications')
    .findOne(
      { user_id: typeof userId === 'string' ? new ObjectId(userId) : userId },
      { sort: { created_at: -1 } }
    );
}

/**
 * Get all pending volunteer applications
 * @returns {Promise<Array>} Array of pending applications
 */
export async function getPendingVolunteerApplications() {
  const client = await clientPromise;
  const db = client.db('dailyreflections');

  return await db.collection('volunteer_applications')
    .find({ status: 'pending' })
    .sort({ created_at: 1 })
    .toArray();
}

/**
 * Update volunteer application status
 * @param {string} applicationId - Application ID
 * @param {string} status - New status ("pending", "approved", "rejected")
 * @param {string} adminId - ID of admin making the change
 * @param {string} [reason] - Reason for rejection (required if status is "rejected")
 * @returns {Promise<boolean>} Success status
 */
export async function updateVolunteerApplicationStatus(applicationId, status, adminId, reason = null) {
  if (!applicationId) throw new Error('Application ID is required');
  if (!status) throw new Error('Status is required');
  if (!adminId) throw new Error('Admin ID is required');

  if (status === 'rejected' && !reason) {
    throw new Error('Rejection reason is required');
  }

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  // Create update data for $set operation
  const setData = {
    status
  };

  if (status === 'approved') {
    setData.approved = true;
    setData.approved_at = new Date();
  } else if (status === 'rejected') {
    setData.approved = false;
    setData.rejected_at = new Date();
    setData.rejection_reason = reason;
  }

  // Use multiple update operators correctly
  const result = await db.collection('volunteer_applications').updateOne(
    { _id: typeof applicationId === 'string' ? new ObjectId(applicationId) : applicationId },
    {
      $set: setData,
      $addToSet: { reviewed_by: typeof adminId === 'string' ? new ObjectId(adminId) : adminId }
    }
  );

  return result.modifiedCount === 1;
}

/**
 * Record code of conduct agreement
 * @param {string} applicationId - Application ID
 * @param {string} userId - User ID accepting the code of conduct
 * @returns {Promise<boolean>} Success status
 */
export async function recordCodeOfConductAgreement(applicationId, userId) {
  if (!applicationId) throw new Error('Application ID is required');
  if (!userId) throw new Error('User ID is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const result = await db.collection('volunteer_applications').updateOne(
    { _id: typeof applicationId === 'string' ? new ObjectId(applicationId) : applicationId },
    {
      $set: {
        code_of_conduct_accepted: true,
        code_of_conduct_accepted_at: new Date()
      }
    }
  );

  // Also update the user's volunteer record
  await db.collection('users').updateOne(
    { _id: typeof userId === 'string' ? new ObjectId(userId) : userId },
    {
      $set: {
        'volunteer.codeOfConductAccepted': true,
        'volunteer.codeOfConductAcceptedAt': new Date()
      }
    }
  );

  return result.modifiedCount === 1;
}

/**
 * Add a note to a volunteer application
 * @param {string} applicationId - Application ID
 * @param {string} adminId - Admin ID adding the note
 * @param {string} content - Note content
 * @returns {Promise<boolean>} Success status
 */
export async function addApplicationNote(applicationId, adminId, content) {
  if (!applicationId) throw new Error('Application ID is required');
  if (!adminId) throw new Error('Admin ID is required');
  if (!content) throw new Error('Note content is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const note = {
    admin_id: typeof adminId === 'string' ? new ObjectId(adminId) : adminId,
    content,
    created_at: new Date()
  };

  const result = await db.collection('volunteer_applications').updateOne(
    { _id: typeof applicationId === 'string' ? new ObjectId(applicationId) : applicationId },
    {
      $push: { notes: note }
    }
  );

  return result.modifiedCount === 1;
}