/**
 * SMS Log Model
 *
 * Schema for storing SMS message logs for tracking and analytics
 */

import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

const SMS_LOG_COLLECTION = 'smsLogs';

/**
 * Create a new SMS log entry
 *
 * @param {Object} logData - SMS log data
 * @returns {Promise<Object>} - Created log entry
 */
export async function createSMSLog(logData) {
  const client = await clientPromise;
  const db = client.db();

  const log = {
    userId: logData.userId ? new ObjectId(logData.userId) : null,
    phoneNumber: logData.phoneNumber,
    messageType: logData.messageType, // 'daily_reflection', 'step10_reminder', 'step4_checkin', etc.
    messageId: logData.messageId, // Twilio SID
    body: logData.body,
    status: logData.status,
    error: logData.error || null,
    timestamp: logData.timestamp || new Date(),
    sentAt: logData.sentAt || new Date(),
  };

  const result = await db.collection(SMS_LOG_COLLECTION).insertOne(log);
  return { ...log, _id: result.insertedId };
}

/**
 * Get SMS logs for a specific user
 *
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Array of SMS logs
 */
export async function getSMSLogsByUser(userId, options = {}) {
  const client = await clientPromise;
  const db = client.db();

  const { limit = 50, skip = 0, status = null } = options;

  const query = { userId: new ObjectId(userId) };

  // Add status filter if provided
  if (status) {
    query.status = status;
  }

  const logs = await db.collection(SMS_LOG_COLLECTION)
    .find(query)
    .sort({ sentAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  return logs;
}

/**
 * Update SMS log status
 *
 * @param {string} logId - SMS log ID
 * @param {string} status - New status
 * @param {Object} additionalData - Additional data to update
 * @returns {Promise<Object>} - Updated log
 */
export async function updateSMSLogStatus(logId, status, additionalData = {}) {
  const client = await clientPromise;
  const db = client.db();

  const updateData = {
    status,
    updatedAt: new Date(),
    ...additionalData
  };

  const result = await db.collection(SMS_LOG_COLLECTION).updateOne(
    { _id: new ObjectId(logId) },
    { $set: updateData }
  );

  return { success: result.modifiedCount > 0, ...updateData };
}

/**
 * Get SMS metrics for analytics
 *
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - SMS metrics
 */
export async function getSMSMetrics(options = {}) {
  const client = await clientPromise;
  const db = client.db();

  const { startDate, endDate } = options;

  const query = {};

  if (startDate || endDate) {
    query.sentAt = {};
    if (startDate) query.sentAt.$gte = new Date(startDate);
    if (endDate) query.sentAt.$lt = new Date(endDate);
  }

  // Get total count
  const totalCount = await db.collection(SMS_LOG_COLLECTION).countDocuments(query);

  // Get counts by status
  const statusCounts = await db.collection(SMS_LOG_COLLECTION).aggregate([
    { $match: query },
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]).toArray();

  // Get counts by message type
  const typeCounts = await db.collection(SMS_LOG_COLLECTION).aggregate([
    { $match: query },
    { $group: { _id: "$messageType", count: { $sum: 1 } } }
  ]).toArray();

  // Format the results
  const statusResults = {};
  statusCounts.forEach(item => {
    statusResults[item._id] = item.count;
  });

  const typeResults = {};
  typeCounts.forEach(item => {
    typeResults[item._id] = item.count;
  });

  return {
    totalCount,
    statusCounts: statusResults,
    typeCounts: typeResults
  };
}

export default {
  createSMSLog,
  getSMSLogsByUser,
  updateSMSLogStatus,
  getSMSMetrics
};