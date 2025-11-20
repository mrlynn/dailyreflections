/**
 * Twilio SMS Service
 *
 * A utility service for sending SMS messages using Twilio
 * Handles common SMS functionality, rate limiting, error handling,
 * and provides consistent logging.
 */

import twilio from 'twilio';

// Initialize Twilio client
const initTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    console.error('Missing required Twilio credentials');
    return null;
  }

  try {
    return twilio(accountSid, authToken);
  } catch (error) {
    console.error('Failed to initialize Twilio client:', error);
    return null;
  }
};

/**
 * Send an SMS message using Twilio
 *
 * @param {string} to - Recipient phone number (E.164 format: +1XXXXXXXXXX)
 * @param {string} body - Message content (max 1600 characters)
 * @param {Object} options - Additional options
 * @param {string} options.from - Sender phone number (defaults to env variable)
 * @param {boolean} options.priority - Whether this is a high priority message
 * @returns {Promise} - Resolves with message details or rejects with error
 */
export const sendSMS = async (to, body, options = {}) => {
  // Make sure the phone number is in E.164 format (+1XXXXXXXXXX)
  const formattedTo = formatPhoneNumber(to);
  const client = initTwilioClient();

  if (!client) {
    throw new Error('SMS service unavailable');
  }

  if (!formattedTo) {
    throw new Error('Invalid recipient phone number');
  }

  if (!body || body.length > 1600) {
    throw new Error('Message body must be between 1-1600 characters');
  }

  try {
    // Add standard footer for compliance
    const messageBody = addComplianceFooter(body);

    // Send the message
    const message = await client.messages.create({
      to: formattedTo,
      from: options.from || process.env.TWILIO_PHONE_NUMBER,
      body: messageBody,
      // Additional options can be added here as needed
    });

    // Log the message for tracking
    await logSMSMessage({
      to: formattedTo,
      body: messageBody,
      messageId: message.sid,
      status: message.status,
      timestamp: new Date(),
      priority: options.priority || false
    });

    return {
      success: true,
      messageId: message.sid,
      status: message.status
    };
  } catch (error) {
    console.error('SMS sending error:', error);

    // Log the failed attempt
    await logSMSMessage({
      to: formattedTo,
      body,
      error: error.message,
      status: 'failed',
      timestamp: new Date(),
      priority: options.priority || false
    });

    throw new Error(`Failed to send SMS: ${error.message}`);
  }
};

/**
 * Format phone number to E.164 format (+1XXXXXXXXXX)
 *
 * @param {string} phoneNumber - Input phone number
 * @returns {string|null} - Formatted phone number or null if invalid
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return null;

  // Strip all non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');

  // For US numbers (currently only supporting US)
  if (digitsOnly.length === 10) {
    return `+1${digitsOnly}`;
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return `+${digitsOnly}`;
  }

  return null;
};

/**
 * Add compliance footer to message
 *
 * @param {string} body - Original message
 * @returns {string} - Message with compliance footer
 */
const addComplianceFooter = (body) => {
  // Keep original message if it already contains our compliance text
  if (body.includes('Reply STOP to unsubscribe')) {
    return body;
  }

  return `${body}\n\nReply STOP to unsubscribe. Reply HELP for help.`;
};

/**
 * Log SMS message to database for tracking and analytics
 *
 * @param {Object} messageData - Message data to log
 */
const logSMSMessage = async (messageData) => {
  try {
    // This would typically write to the database
    // For now, we'll just log to console
    console.log('SMS Message Log:', messageData);

    // In a real implementation, we would do something like:
    // await db.collection('smsLogs').insertOne(messageData);

    return true;
  } catch (error) {
    console.error('Failed to log SMS message:', error);
    return false;
  }
};

/**
 * Check if a user can receive SMS at the current time
 * based on their quiet hours preferences
 *
 * @param {Object} preferences - User's SMS preferences
 * @param {Date} currentTime - Current time to check against
 * @returns {boolean} - Whether message can be sent now
 */
export const canSendDuringQuietHours = (preferences, currentTime = new Date()) => {
  if (!preferences || !preferences.quietHoursStart || !preferences.quietHoursEnd) {
    // Default quiet hours: 9PM - 7AM
    return !(currentTime.getHours() >= 21 || currentTime.getHours() < 7);
  }

  // Parse the quiet hours settings
  const startParts = preferences.quietHoursStart.split(':').map(Number);
  const endParts = preferences.quietHoursEnd.split(':').map(Number);

  const quietStartHour = startParts[0];
  const quietEndHour = endParts[0];

  const currentHour = currentTime.getHours();

  // Check if current time is within quiet hours
  if (quietStartHour > quietEndHour) {
    // Quiet hours span midnight (e.g., 9PM - 7AM)
    return !(currentHour >= quietStartHour || currentHour < quietEndHour);
  } else {
    // Quiet hours within same day (e.g., 11PM - 6AM)
    return !(currentHour >= quietStartHour && currentHour < quietEndHour);
  }
};

/**
 * Format a reflection for SMS delivery
 *
 * @param {Object} reflection - Reflection object
 * @returns {string} - Formatted SMS message
 */
export const formatReflectionForSMS = (reflection) => {
  if (!reflection) return null;

  const title = reflection.title || '';
  const quote = reflection.quote || '';
  const reference = reflection.reference || '';

  let message = '';

  if (title) {
    message += `${title}\n\n`;
  }

  if (quote) {
    message += `"${quote}"\n\n`;
  }

  if (reference) {
    message += `— ${reference}\n\n`;
  }

  // Add link to the full reflection
  const dateKey = `${String(reflection.month).padStart(2, '0')}-${String(reflection.day).padStart(2, '0')}`;
  message += `View today's full reflection: ${process.env.NEXT_PUBLIC_APP_URL || 'https://aa-companion.app'}/${dateKey}`;

  return message;
};

/**
 * Format a Step 10 reminder for SMS delivery
 *
 * @returns {string} - Formatted SMS message
 */
export const formatStep10ReminderForSMS = () => {
  const prompts = [
    "Time for your nightly inventory. How did you practice these principles today?",
    "Step 10 reminder: Have you taken personal inventory today?",
    "Daily inventory time: What went well today? What could have gone better?",
    "Remember your Step 10: Continue to take personal inventory and promptly admit when you're wrong."
  ];

  // Randomly select a prompt for variety
  const prompt = prompts[Math.floor(Math.random() * prompts.length)];

  return `${prompt}\n\nReflect in your journal: ${process.env.NEXT_PUBLIC_APP_URL || 'https://aa-companion.app'}/journal`;
};

/**
 * Format a Step 4 check-in reminder for SMS delivery
 *
 * @returns {string} - Formatted SMS message
 */
export const formatStep4CheckInForSMS = () => {
  return "Weekly reminder: It's a good time to check in with your Step 4 inventory.\n\nUpdate your inventory: " +
    `${process.env.NEXT_PUBLIC_APP_URL || 'https://aa-companion.app'}/step4`;
};

/**
 * Send verification SMS for double opt-in
 *
 * @param {string} to - Recipient phone number
 * @returns {Promise} - Resolves with message details or rejects with error
 */
export const sendVerificationSMS = async (to) => {
  const message =
    "Welcome to AA Companion! Reply YES to receive daily reflections and reminders. " +
    "Your privacy is important to us. Reply STOP anytime to unsubscribe.";

  return await sendSMS(to, message, { priority: true });
};

export default {
  sendSMS,
  sendVerificationSMS,
  formatPhoneNumber,
  canSendDuringQuietHours,
  formatReflectionForSMS,
  formatStep10ReminderForSMS,
  formatStep4CheckInForSMS
};