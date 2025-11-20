/**
 * Email Delivery Service
 *
 * Manages the delivery of different types of email notifications
 * including daily reflections, Step 10 reminders, etc.
 */

import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { sendDailyReflectionEmail, canSendEmailDuringQuietHours } from '@/lib/emailService';
import { createEmailLog } from '@/lib/models/emailLog';
import { getTodayKey, parseDateKey } from '@/utils/dateUtils';

/**
 * Send daily reflection to a specific user via email
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
    const userObjectId = new ObjectId(userId);

    // Get user and their notification preferences
    const user = await db.collection('users').findOne({
      _id: userObjectId
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    // Check if user has email notifications enabled
    const notifications = user.preferences?.notifications;
    if (!notifications?.enabled || !notifications?.channels?.email) {
      return {
        success: false,
        error: 'User has not enabled email notifications for daily reflections'
      };
    }

    // Get the email address - use notification email if provided, otherwise use account email
    const emailAddress = notifications.email || user.email;
    if (!emailAddress) {
      return {
        success: false,
        error: 'User has no email address configured'
      };
    }

    // Check if we can send during quiet hours (unless overridden)
    const currentTime = new Date();
    if (!overrideQuietHours && !canSendEmailDuringQuietHours(notifications, currentTime)) {
      return {
        success: false,
        error: 'Cannot send during user quiet hours',
        quietHours: true
      };
    }

    // Get today's reflection
    const dateKey = overrideDateKey || getTodayKey();
    const { month, day } = parseDateKey(dateKey);

    // Prevent duplicate sends within the same day
    const existingLog = await db.collection('emailLogs').findOne({
      userId: userObjectId,
      messageType: 'daily_reflection',
      dateKey,
      status: { $ne: 'failed' }
    });

    if (existingLog) {
      return {
        success: false,
        error: 'Daily reflection already sent to user',
        alreadySent: true,
        dateKey,
        lastSentAt: existingLog.sentAt
      };
    }

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

    // Debug: Log if comment is not a string
    if (reflection.comment && typeof reflection.comment !== 'string') {
      console.warn(`[Email Service] Reflection ${dateKey} has non-string comment:`, {
        type: typeof reflection.comment,
        value: reflection.comment,
        hasCommentCleaned: !!reflection.commentCleaned,
        commentCleanedType: reflection.commentCleaned ? typeof reflection.commentCleaned : 'N/A'
      });
    }

    // Send the email
    const result = await sendDailyReflectionEmail(
      {
        email: emailAddress,
        name: user.name || user.displayName || 'Friend'
      },
      reflection
    );

    // Log the email for analytics
    if (result.success) {
      await createEmailLog({
        userId,
        email: emailAddress,
        messageType: 'daily_reflection',
        messageId: result.messageId,
        subject: reflection.title || `Daily Reflection - ${dateKey}`,
        body: reflection.quote || reflection.commentCleaned || reflection.comment || '',
        status: result.status,
        dateKey,
        timestamp: new Date(),
        sentAt: new Date()
      });
    } else {
      // Log failed attempt
      await createEmailLog({
        userId,
        email: emailAddress,
        messageType: 'daily_reflection',
        messageId: null,
        subject: reflection.title || `Daily Reflection - ${dateKey}`,
        body: reflection.quote || reflection.commentCleaned || reflection.comment || '',
        status: 'failed',
        dateKey,
        error: result.error,
        timestamp: new Date(),
        sentAt: new Date()
      });
    }

    return {
      success: result.success,
      messageId: result.messageId,
      status: result.status,
      dateKey,
      error: result.error
    };
  } catch (error) {
    console.error('Error sending daily reflection email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send daily reflection email'
    };
  }
}

/**
 * Send daily reflections to all eligible users via email
 *
 * @param {Object} options - Options for sending
 * @param {string} options.dateKey - Optional date key override (MM-DD format)
 * @returns {Promise<Object>} - Results of sending operation
 */
export async function sendDailyReflectionToAllUsers(options = {}) {
  const client = await clientPromise;
  const db = client.db();

  try {
    // Find all users with email notifications enabled for daily reflections
    const eligibleUsers = await db.collection('users')
      .find({
        'preferences.notifications.enabled': true,
        'preferences.notifications.channels.email': true,
        $or: [
          { 'preferences.notifications.email': { $exists: true, $ne: null, $ne: '' } },
          { email: { $exists: true, $ne: null, $ne: '' } }
        ]
      })
      .toArray();

    console.log(`Found ${eligibleUsers.length} eligible users for daily reflection email`);
    
    // Debug logging
    if (eligibleUsers.length === 0) {
      console.warn('⚠️  No eligible users found. Checking query...');
      // Try a more lenient query to see what users exist
      const allUsersWithEmail = await db.collection('users')
        .find({ email: { $exists: true, $ne: null, $ne: '' } })
        .limit(5)
        .toArray();
      console.log(`Found ${allUsersWithEmail.length} users with email addresses (sample)`);
      if (allUsersWithEmail.length > 0) {
        const sample = allUsersWithEmail[0];
        console.log('Sample user structure:', {
          hasPreferences: !!sample.preferences,
          hasNotifications: !!sample.preferences?.notifications,
          notificationsEnabled: sample.preferences?.notifications?.enabled,
          emailChannelEnabled: sample.preferences?.notifications?.channels?.email
        });
      }
    }

    // Results tracking
    const results = {
      total: eligibleUsers.length,
      sent: 0,
      failed: 0,
      skipped: 0,
      quietHours: 0,
      alreadySent: 0,
      errors: []
    };

    // Send to each eligible user
    for (const user of eligibleUsers) {
      const result = await sendDailyReflectionToUser(user._id.toString(), options.dateKey);

      if (result.success) {
        results.sent++;
        console.log(`✅ Email sent to ${user.name || user.email}`);
      } else {
        if (result.quietHours) {
          results.quietHours++;
          results.skipped++;
          console.log(`⏸️  Skipped ${user.name || user.email} - quiet hours`);
        } else if (result.alreadySent) {
          results.alreadySent++;
          results.skipped++;
          console.log(`🔁 Already sent to ${user.name || user.email} for ${result.dateKey}`);
        } else {
          results.failed++;
          const errorInfo = {
            userId: user._id.toString(),
            email: user.preferences?.notifications?.email || user.email,
            error: result.error
          };
          results.errors.push(errorInfo);
          console.error(`❌ Failed to send to ${user.name || user.email}:`, result.error);
        }
      }

      // Add a small delay between sends to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
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

export default {
  sendDailyReflectionToUser,
  sendDailyReflectionToAllUsers
};

