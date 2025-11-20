/**
 * Daily Reflections Email Sender Script
 *
 * This script is designed to be run as a cron job to send daily reflection email messages
 * to all eligible users. It respects each user's time zone and quiet hours preferences.
 *
 * Recommended cron schedule: Every hour
 *
 * The script will:
 * 1. Find all users with email notifications enabled for daily reflections
 * 2. Check if it's the right time to send based on their preferences
 * 3. Send the reflection only to users in appropriate time zones
 * 4. Log results
 *
 * Usage:
 * node scripts/send-daily-reflection-emails.js
 */

// Load environment variables
require('dotenv').config();

const { MongoClient, ObjectId } = require('mongodb');

// Check if email feature is enabled (optional feature flag)
if (process.env.NEXT_PUBLIC_FEATURE_EMAIL_NOTIFICATIONS === 'false') {
  console.log('Email notifications feature is not enabled. Exiting.');
  process.exit(0);
}

async function main() {
  console.log('Starting daily reflections email sender...');

  const mongoClient = new MongoClient(process.env.MONGODB_URI);

  try {
    await mongoClient.connect();
    console.log('Connected to MongoDB');

    const db = mongoClient.db(process.env.MONGODB_DB || 'dailyreflections');

    // Get current hour
    const now = new Date();
    const currentHour = now.getUTCHours();

    console.log(`Current UTC hour: ${currentHour}`);

    // Find users who should receive messages at this hour
    const eligibleUsers = await findEligibleUsers(db, currentHour);
    console.log(`Found ${eligibleUsers.length} eligible users for daily reflection email at this hour`);

    // No eligible users, exit early
    if (eligibleUsers.length === 0) {
      console.log('No eligible users found for this hour. Exiting.');
      return;
    }

    // Send messages
    const results = await sendMessagesToEligibleUsers(eligibleUsers);

    // Log the results
    console.log('Completed sending daily reflection emails:');
    console.log(`- Total eligible: ${results.total}`);
    console.log(`- Sent: ${results.sent}`);
    console.log(`- Failed: ${results.failed}`);
    console.log(`- Skipped: ${results.skipped}`);
    console.log(`- Quiet hours: ${results.quietHours}`);

    if (results.errors.length > 0) {
      console.log('Errors:');
      results.errors.forEach(err => {
        console.log(`- User ${err.userId}: ${err.error}`);
      });
    }

    // Log to database
    await db.collection('emailDeliveryLogs').insertOne({
      type: 'daily_reflection',
      timestamp: new Date(),
      results: {
        total: results.total,
        sent: results.sent,
        failed: results.failed,
        skipped: results.skipped,
        quietHours: results.quietHours,
        errors: results.errors
      }
    });

  } catch (error) {
    console.error('Error in daily reflections email sender:', error);
  } finally {
    await mongoClient.close();
    console.log('MongoDB connection closed');
  }
}

/**
 * Find users who should receive daily reflections at the current hour
 */
async function findEligibleUsers(db, currentHour) {
  // Find all users with email notifications enabled for daily reflections
  const allEligibleUsers = await db.collection('users')
    .find({
      'preferences.notifications.enabled': true,
      'preferences.notifications.channels.email': true,
      $or: [
        { 'preferences.notifications.email': { $exists: true, $ne: null, $ne: '' } },
        { email: { $exists: true, $ne: null, $ne: '' } }
      ]
    })
    .toArray();

  // Filter to users who should receive messages at this hour
  return allEligibleUsers.filter(user => {
    const notifications = user.preferences?.notifications;
    if (!notifications) return false;

    // Get user's preferred time (default to 7am)
    const preferredTime = notifications.morningTime || '07:00';
    const [hour, minute] = preferredTime.split(':').map(Number);

    // Get user's timezone (default to America/New_York)
    const userTimezone = user.sobriety?.timezone || process.env.NEXT_PUBLIC_TIMEZONE || 'America/New_York';
    const tzOffset = getUserTimezoneOffset(userTimezone);

    // Calculate the UTC hour when it's the user's preferred hour in their timezone
    const userPreferredHourInUTC = (hour - tzOffset + 24) % 24;

    // Return true if it's the right hour to send
    return userPreferredHourInUTC === currentHour;
  });
}

/**
 * Send messages to eligible users
 */
async function sendMessagesToEligibleUsers(eligibleUsers) {
  // Results tracking
  const results = {
    total: eligibleUsers.length,
    sent: 0,
    failed: 0,
    skipped: 0,
    quietHours: 0,
    errors: []
  };

  // Import the service on demand to avoid circular dependencies
  const { sendDailyReflectionToUser } = require('../src/services/emailDeliveryService');

  // Send to each eligible user
  for (const user of eligibleUsers) {
    try {
      const result = await sendDailyReflectionToUser(user._id.toString());

      if (result.success) {
        results.sent++;
      } else {
        if (result.quietHours) {
          results.quietHours++;
          results.skipped++;
        } else {
          results.failed++;
          results.errors.push({
            userId: user._id.toString(),
            error: result.error
          });
        }
      }

      // Add a small delay between sends to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Error sending to user ${user._id}:`, error);
      results.failed++;
      results.errors.push({
        userId: user._id.toString(),
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Get timezone offset in hours
 * This is a simplified version - in production, use a proper timezone library
 */
function getUserTimezoneOffset(timezone) {
  // Default to Eastern Time (UTC-5)
  const defaultOffset = -5;

  // Very simple mapping of common timezones
  const timezoneOffsets = {
    'America/New_York': -5,
    'America/Chicago': -6,
    'America/Denver': -7,
    'America/Los_Angeles': -8,
    'America/Anchorage': -9,
    'America/Honolulu': -10,
    'America/Phoenix': -7,
    'Europe/London': 0,
    'Europe/Paris': 1,
    'Asia/Tokyo': 9,
    'Australia/Sydney': 10
  };

  return timezoneOffsets[timezone] || defaultOffset;
}

// Run the script
main()
  .then(() => {
    console.log('Daily reflections email sender completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error in daily reflections email sender:', error);
    process.exit(1);
  });

