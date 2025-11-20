/**
 * SMS Delivery Service
 *
 * Manages the delivery of different types of SMS notifications
 * including daily reflections, Step 10 reminders, etc.
 */

import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import smsService from '@/lib/smsService';
import { createSMSLog } from '@/lib/models/smsLog';
import { getTodayKey, parseDateKey } from '@/utils/dateUtils';

/**
 * Send daily reflection to a specific user
 *
 * @param {string} userId - User ID
 * @param {string} overrideDateKey - Optional date key override (MM-DD format)
 * @param {boolean} overrideQuietHours - Optional flag to override quiet hours check
 * @returns {Promise<Object>} - Result of sending operation
 */
export async function sendDailyReflectionToUser(userId, overrideDateKey = null, overrideQuietHours = false) {
  const client = await clientPromise;
  const db = client.db();

  try {
    // Get user's SMS preferences
    const userPreferences = await db.collection('userSMSPreferences').findOne({
      userId: new ObjectId(userId)
    });

    // Skip if user has no phone number or hasn't enabled SMS or hasn't verified phone
    if (!userPreferences?.phoneNumber || !userPreferences?.preferences?.enabled ||
        !userPreferences?.preferences?.dailyReflection || !userPreferences?.verified) {
      return {
        success: false,
        error: userPreferences?.verified === false ?
          'User has not verified their phone number' :
          'User has not enabled daily reflection SMS notifications'
      };
    }

    // Check if we can send during quiet hours (unless overridden)
    const currentTime = new Date();
    if (!overrideQuietHours && !smsService.canSendDuringQuietHours(userPreferences.preferences, currentTime)) {
      return {
        success: false,
        error: 'Cannot send during user quiet hours',
        quietHours: true
      };
    }

    // Get today's reflection
    const dateKey = overrideDateKey || getTodayKey();
    const { month, day } = parseDateKey(dateKey);

    const reflection = await db.collection('reflections').findOne({
      month: parseInt(month),
      day: parseInt(day)
    });

    if (!reflection) {
      return {
        success: false,
        error: `No reflection found for date: ${dateKey}`
      };
    }

    // Format the reflection for SMS
    const messageBody = smsService.formatReflectionForSMS(reflection);

    // Send the SMS
    const result = await smsService.sendSMS(
      userPreferences.phoneNumber,
      messageBody,
      { priority: false }
    );

    // Log the SMS for analytics
    await createSMSLog({
      userId,
      phoneNumber: userPreferences.phoneNumber,
      messageType: 'daily_reflection',
      messageId: result.messageId,
      body: messageBody,
      status: result.status,
      timestamp: new Date(),
      sentAt: new Date()
    });

    return {
      success: true,
      messageId: result.messageId,
      status: result.status,
      dateKey
    };
  } catch (error) {
    console.error('Error sending daily reflection:', error);
    return {
      success: false,
      error: error.message || 'Failed to send daily reflection'
    };
  }
}

/**
 * Send daily reflections to all eligible users
 *
 * @param {Object} options - Options for sending
 * @returns {Promise<Object>} - Results of sending operation
 */
export async function sendDailyReflectionToAllUsers(options = {}) {
  const client = await clientPromise;
  const db = client.db();

  try {
    // Find all users with SMS enabled for daily reflections who have verified their phone number
    const eligibleUsers = await db.collection('userSMSPreferences')
      .find({
        'phoneNumber': { $exists: true, $ne: null },
        'preferences.enabled': true,
        'preferences.dailyReflection': true,
        'verified': true // Only send to verified phone numbers
      })
      .toArray();

    console.log(`Found ${eligibleUsers.length} eligible users for daily reflection SMS`);

    // Results tracking
    const results = {
      total: eligibleUsers.length,
      sent: 0,
      failed: 0,
      skipped: 0,
      quietHours: 0,
      errors: []
    };

    // Send to each eligible user
    for (const user of eligibleUsers) {
      const result = await sendDailyReflectionToUser(user.userId.toString(), options.dateKey);

      if (result.success) {
        results.sent++;
      } else {
        if (result.quietHours) {
          results.quietHours++;
          results.skipped++;
        } else {
          results.failed++;
          results.errors.push({
            userId: user.userId.toString(),
            error: result.error
          });
        }
      }

      // Add a small delay between sends to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  } catch (error) {
    console.error('Error sending daily reflections to all users:', error);
    return {
      success: false,
      error: error.message || 'Failed to send daily reflections to all users'
    };
  }
}

/**
 * Send Step 10 reminder to a specific user
 *
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Result of sending operation
 */
export async function sendStep10ReminderToUser(userId) {
  const client = await clientPromise;
  const db = client.db();

  try {
    // Get user's SMS preferences
    const userPreferences = await db.collection('userSMSPreferences').findOne({
      userId: new ObjectId(userId)
    });

    // Skip if user has no phone number or hasn't enabled SMS or hasn't verified phone
    if (!userPreferences?.phoneNumber || !userPreferences?.preferences?.enabled ||
        !userPreferences?.preferences?.step10Reminder || !userPreferences?.verified) {
      return {
        success: false,
        error: userPreferences?.verified === false ?
          'User has not verified their phone number' :
          'User has not enabled Step 10 reminder SMS notifications'
      };
    }

    // Check if we can send during quiet hours
    const currentTime = new Date();
    if (!smsService.canSendDuringQuietHours(userPreferences.preferences, currentTime)) {
      return {
        success: false,
        error: 'Cannot send during user quiet hours',
        quietHours: true
      };
    }

    // Format the Step 10 reminder for SMS
    const messageBody = smsService.formatStep10ReminderForSMS();

    // Send the SMS
    const result = await smsService.sendSMS(
      userPreferences.phoneNumber,
      messageBody,
      { priority: false }
    );

    // Log the SMS for analytics
    await createSMSLog({
      userId,
      phoneNumber: userPreferences.phoneNumber,
      messageType: 'step10_reminder',
      messageId: result.messageId,
      body: messageBody,
      status: result.status,
      timestamp: new Date(),
      sentAt: new Date()
    });

    return {
      success: true,
      messageId: result.messageId,
      status: result.status
    };
  } catch (error) {
    console.error('Error sending Step 10 reminder:', error);
    return {
      success: false,
      error: error.message || 'Failed to send Step 10 reminder'
    };
  }
}

/**
 * Send Step 4 check-in reminder to a specific user
 *
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Result of sending operation
 */
export async function sendStep4CheckInToUser(userId) {
  const client = await clientPromise;
  const db = client.db();

  try {
    // Get user's SMS preferences
    const userPreferences = await db.collection('userSMSPreferences').findOne({
      userId: new ObjectId(userId)
    });

    // Skip if user has no phone number or hasn't enabled SMS or hasn't verified phone
    if (!userPreferences?.phoneNumber || !userPreferences?.preferences?.enabled ||
        !userPreferences?.preferences?.step4CheckIn || !userPreferences?.verified) {
      return {
        success: false,
        error: userPreferences?.verified === false ?
          'User has not verified their phone number' :
          'User has not enabled Step 4 check-in SMS notifications'
      };
    }

    // Check if we can send during quiet hours
    const currentTime = new Date();
    if (!smsService.canSendDuringQuietHours(userPreferences.preferences, currentTime)) {
      return {
        success: false,
        error: 'Cannot send during user quiet hours',
        quietHours: true
      };
    }

    // Format the Step 4 check-in for SMS
    const messageBody = smsService.formatStep4CheckInForSMS();

    // Send the SMS
    const result = await smsService.sendSMS(
      userPreferences.phoneNumber,
      messageBody,
      { priority: false }
    );

    // Log the SMS for analytics
    await createSMSLog({
      userId,
      phoneNumber: userPreferences.phoneNumber,
      messageType: 'step4_checkin',
      messageId: result.messageId,
      body: messageBody,
      status: result.status,
      timestamp: new Date(),
      sentAt: new Date()
    });

    return {
      success: true,
      messageId: result.messageId,
      status: result.status
    };
  } catch (error) {
    console.error('Error sending Step 4 check-in:', error);
    return {
      success: false,
      error: error.message || 'Failed to send Step 4 check-in'
    };
  }
}

export default {
  sendDailyReflectionToUser,
  sendDailyReflectionToAllUsers,
  sendStep10ReminderToUser,
  sendStep4CheckInToUser
};