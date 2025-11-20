/**
 * Step 10 Reminders SMS Sender Script
 *
 * This script is designed to be run as a cron job to send Step 10 reminder SMS messages
 * to all eligible users. It respects each user's time zone and quiet hours preferences.
 *
 * Recommended cron schedule: Every hour
 *
 * The script will:
 * 1. Find all users with SMS enabled for Step 10 reminders
 * 2. Check if it's the right time to send based on their preferences
 * 3. Send the reminder only to users in appropriate time zones
 * 4. Log results
 *
 * Usage:
 * node scripts/send-step10-reminders.js
 */

// Load environment variables
require('dotenv').config();

const { MongoClient, ObjectId } = require('mongodb');
const smsService = require('../src/lib/smsService').default;

// Check if SMS feature is enabled
if (process.env.NEXT_PUBLIC_FEATURE_SMS !== 'true' || process.env.NEXT_PUBLIC_FEATURE_SMS_STEP10_REMINDER !== 'true') {
  console.log('SMS feature or Step 10 reminder SMS feature is not enabled. Exiting.');
  process.exit(0);
}

async function main() {
  console.log('Starting Step 10 reminder SMS sender...');

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
    console.log(`Found ${eligibleUsers.length} eligible users for Step 10 reminder SMS at this hour`);

    // No eligible users, exit early
    if (eligibleUsers.length === 0) {
      console.log('No eligible users found for this hour. Exiting.');
      return;
    }

    // Send messages
    const results = await sendMessagesToEligibleUsers(eligibleUsers);

    // Log the results
    console.log('Completed sending Step 10 reminder SMS:');
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
    await db.collection('smsDeliveryLogs').insertOne({
      type: 'step10_reminder',
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
    console.error('Error in Step 10 reminder SMS sender:', error);
  } finally {
    await mongoClient.close();
    console.log('MongoDB connection closed');
  }
}

/**
 * Find users who should receive Step 10 reminders at the current hour
 */
async function findEligibleUsers(db, currentHour) {
  // Find all users with SMS enabled for Step 10 reminders
  const allEligibleUsers = await db.collection('userSMSPreferences')
    .find({
      'phoneNumber': { $exists: true, $ne: null },
      'preferences.enabled': true,
      'preferences.step10Reminder': true
    })
    .toArray();

  // Filter to users who should receive messages at this hour
  return allEligibleUsers.filter(user => {
    // Get user's preferred time (default to 9pm)
    const preferredTime = user.preferences?.step10ReminderTime || '21:00';
    const [hour, minute] = preferredTime.split(':').map(Number);

    // Get user's timezone offset (default to America/New_York)
    const tzOffset = getUserTimezoneOffset(user.timezone || process.env.NEXT_PUBLIC_TIMEZONE);

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
  // Import the service on demand
  const { sendStep10ReminderToUser } = require('../src/services/smsDeliveryService');

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
    try {
      const result = await sendStep10ReminderToUser(user.userId.toString());

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
    } catch (error) {
      console.error(`Error sending to user ${user.userId}:`, error);
      results.failed++;
      results.errors.push({
        userId: user.userId.toString(),
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
    console.log('Step 10 reminder SMS sender completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error in Step 10 reminder SMS sender:', error);
    process.exit(1);
  });