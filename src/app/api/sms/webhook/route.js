import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import twilio from 'twilio';

/**
 * Process inbound SMS via Twilio webhook
 *
 * Handles:
 * - YES command for verification (double opt-in)
 * - STOP/START commands for opt-out/opt-in
 * - HELP command for help info
 * - TODAY command to get today's reflection
 * - DONE command to log journal completion
 */
export async function POST(request) {
  try {
    // Get form data from Twilio webhook
    const formData = await request.formData();

    // Extract SMS data
    const from = formData.get('From');
    const body = formData.get('Body') || '';
    const messageSid = formData.get('MessageSid');

    // Validate Twilio webhook signature
    // In production, uncomment this validation
    // const signature = request.headers.get('X-Twilio-Signature');
    // const url = process.env.TWILIO_WEBHOOK_URL;
    // const authToken = process.env.TWILIO_AUTH_TOKEN;
    // const validRequest = twilio.validateRequest(authToken, signature, url, Object.fromEntries(formData));
    // if (!validRequest) {
    //   return NextResponse.json({ error: 'Invalid Twilio signature' }, { status: 401 });
    // }

    // Normalize phone number
    const phoneNumber = normalizePhoneNumber(from);

    if (!phoneNumber) {
      return createTwilioResponse('Sorry, we could not process your request.');
    }

    // Log the incoming message
    await logIncomingSMS(phoneNumber, body, messageSid);

    // Find user by phone number
    const client = await clientPromise;
    const db = client.db();
    const userPreferences = await db.collection('userSMSPreferences').findOne({
      phoneNumber: phoneNumber
    });

    if (!userPreferences) {
      return createTwilioResponse(
        'Sorry, your phone number is not registered with our system. ' +
        'Visit the app to set up SMS notifications.'
      );
    }

    // Process command
    const command = body.trim().toUpperCase();

    // Handle STOP command (opt-out)
    if (command === 'STOP' || command === 'UNSUBSCRIBE' || command === 'CANCEL' || command === 'END') {
      await handleOptOut(userPreferences, db);
      return createTwilioResponse(
        'You have been unsubscribed from all SMS notifications. ' +
        'You can re-enable notifications at any time in the app.'
      );
    }

    // Handle START command (opt-in)
    if (command === 'START' || command === 'UNSTOP') {
      await handleOptIn(userPreferences, db);
      return createTwilioResponse(
        'Welcome back! You have been re-subscribed to SMS notifications. ' +
        'Visit the app to manage your notification preferences.'
      );
    }

    // Handle HELP command
    if (command === 'HELP') {
      return createTwilioResponse(
        'AA Companion SMS Commands:\n' +
        'YES - Confirm subscription to messages\n' +
        'TODAY - Get today\'s reflection\n' +
        'DONE - Log completion of your daily inventory\n' +
        'STOP - Unsubscribe from all messages\n' +
        'START - Re-enable messages\n' +
        'HELP - Show this help message\n\n' +
        'Visit the app for more options.'
      );
    }

    // Handle YES command for opt-in verification
    if (command === 'YES') {
      // Check if user needs verification
      if (!userPreferences.verified) {
        // Mark user as verified
        await db.collection('userSMSPreferences').updateOne(
          { _id: userPreferences._id },
          {
            $set: {
              verified: true,
              verifiedAt: new Date()
            }
          }
        );

        // If preferences are enabled, update user record
        if (userPreferences.preferences?.enabled) {
          await db.collection('users').updateOne(
            { _id: userPreferences.userId },
            { $set: { hasSmsEnabled: true } }
          );
        }

        // Log the verification
        await db.collection('smsOptEvents').insertOne({
          userId: userPreferences.userId,
          phoneNumber: userPreferences.phoneNumber,
          type: 'verification',
          timestamp: new Date()
        });

        return createTwilioResponse(
          'Thank you! Your phone number has been verified. You will now receive messages according to your preferences. ' +
          'Reply STOP anytime to unsubscribe.'
        );
      } else {
        return createTwilioResponse(
          'Your phone number is already verified. You will continue to receive messages according to your preferences. ' +
          'Reply STOP anytime to unsubscribe.'
        );
      }
    }

    // If user has opted out, don't process further commands
    if (userPreferences.preferences && userPreferences.preferences.enabled === false) {
      return createTwilioResponse(
        'You are currently unsubscribed from SMS notifications. ' +
        'Text START to re-enable messages or visit the app to update your preferences.'
      );
    }

    // If user is not verified, don't process other commands except STOP, START, HELP, YES
    if (!userPreferences.verified) {
      return createTwilioResponse(
        'Your phone number is not yet verified. Please reply YES to verify your number and activate SMS notifications. ' +
        'Reply STOP if you don\'t want to receive any messages.'
      );
    }

    // Handle TODAY command (get reflection)
    if (command === 'TODAY') {
      const response = await handleTodayCommand(userPreferences.userId, db);
      return createTwilioResponse(response);
    }

    // Handle DONE command (log journal completion)
    if (command === 'DONE') {
      const response = await handleDoneCommand(userPreferences.userId, db);
      return createTwilioResponse(response);
    }

    // Default response for unrecognized commands
    return createTwilioResponse(
      'Sorry, I didn\'t understand that command. Text HELP for a list of valid commands.'
    );
  } catch (error) {
    console.error('Error processing SMS webhook:', error);
    return createTwilioResponse(
      'Sorry, we encountered an error processing your request. Please try again later.'
    );
  }
}

/**
 * Creates a TwiML response for Twilio
 *
 * @param {string} message - Message to send back via SMS
 * @returns {NextResponse} - Response with TwiML
 */
function createTwilioResponse(message) {
  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(message);

  return new NextResponse(twiml.toString(), {
    status: 200,
    headers: {
      'Content-Type': 'text/xml'
    }
  });
}

/**
 * Normalize phone number to standard format
 *
 * @param {string} phone - Phone number from Twilio
 * @returns {string|null} - Normalized phone number or null
 */
function normalizePhoneNumber(phone) {
  if (!phone) return null;

  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');

  // For US numbers (currently only supporting US)
  if (digitsOnly.length === 10) {
    return digitsOnly;
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return digitsOnly.substring(1);
  } else if (digitsOnly.length === 12 && digitsOnly.startsWith('+1')) {
    return digitsOnly.substring(2);
  }

  return null;
}

/**
 * Log incoming SMS message
 *
 * @param {string} phoneNumber - Sender phone number
 * @param {string} body - Message content
 * @param {string} messageSid - Twilio message ID
 */
async function logIncomingSMS(phoneNumber, body, messageSid) {
  try {
    const client = await clientPromise;
    const db = client.db();

    // Find user by phone number to get userId
    const userPreferences = await db.collection('userSMSPreferences').findOne({
      phoneNumber: phoneNumber
    });

    const userId = userPreferences?.userId || null;

    await db.collection('smsInbound').insertOne({
      phoneNumber,
      body,
      messageSid,
      userId,
      timestamp: new Date(),
      processed: false
    });
  } catch (error) {
    console.error('Error logging inbound SMS:', error);
  }
}

/**
 * Handle opt-out (STOP) command
 *
 * @param {Object} userPreferences - User's SMS preferences
 * @param {Object} db - MongoDB database
 */
async function handleOptOut(userPreferences, db) {
  try {
    // Update user preferences to disable SMS
    await db.collection('userSMSPreferences').updateOne(
      { _id: userPreferences._id },
      {
        $set: {
          'preferences.enabled': false,
          'optOutDate': new Date()
        }
      }
    );

    // Update user record
    await db.collection('users').updateOne(
      { _id: userPreferences.userId },
      { $set: { hasSmsEnabled: false } }
    );

    // Log the opt-out
    await db.collection('smsOptEvents').insertOne({
      userId: userPreferences.userId,
      phoneNumber: userPreferences.phoneNumber,
      type: 'opt_out',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error handling opt-out:', error);
  }
}

/**
 * Handle opt-in (START) command
 *
 * @param {Object} userPreferences - User's SMS preferences
 * @param {Object} db - MongoDB database
 */
async function handleOptIn(userPreferences, db) {
  try {
    // Update user preferences to enable SMS
    await db.collection('userSMSPreferences').updateOne(
      { _id: userPreferences._id },
      {
        $set: {
          'preferences.enabled': true,
          'optInDate': new Date()
        },
        $unset: { 'optOutDate': "" }
      }
    );

    // Update user record
    await db.collection('users').updateOne(
      { _id: userPreferences.userId },
      { $set: { hasSmsEnabled: true } }
    );

    // Log the opt-in
    await db.collection('smsOptEvents').insertOne({
      userId: userPreferences.userId,
      phoneNumber: userPreferences.phoneNumber,
      type: 'opt_in',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error handling opt-in:', error);
  }
}

/**
 * Handle TODAY command to get today's reflection
 *
 * @param {ObjectId} userId - User's ID
 * @param {Object} db - MongoDB database
 * @returns {string} - Response message
 */
async function handleTodayCommand(userId, db) {
  try {
    // Get today's date in MM-DD format
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    // Get today's reflection
    const reflection = await db.collection('reflections').findOne({
      month: month,
      day: day
    });

    if (!reflection) {
      return 'Sorry, we couldn\'t find today\'s reflection. Please check the app.';
    }

    // Format a concise version for SMS
    let message = `${reflection.title}\n\n`;

    if (reflection.quote) {
      // Truncate quote if it's too long
      const quote = reflection.quote.length > 100
        ? reflection.quote.substring(0, 97) + '...'
        : reflection.quote;

      message += `"${quote}"\n\n`;
    }

    if (reflection.reference) {
      message += `— ${reflection.reference}\n\n`;
    }

    // Add app link
    const dateKey = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    message += `View full reflection: ${process.env.NEXT_PUBLIC_APP_URL || 'https://aa-companion.app'}/${dateKey}`;

    // Log this interaction
    await db.collection('smsInteractions').insertOne({
      userId,
      command: 'TODAY',
      dateKey,
      timestamp: new Date()
    });

    return message;
  } catch (error) {
    console.error('Error handling TODAY command:', error);
    return 'Sorry, we encountered an error retrieving today\'s reflection. Please try again later.';
  }
}

/**
 * Handle DONE command to log journal completion
 *
 * @param {ObjectId} userId - User's ID
 * @param {Object} db - MongoDB database
 * @returns {string} - Response message
 */
async function handleDoneCommand(userId, db) {
  try {
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Log journal completion for today
    await db.collection('journalCompletions').updateOne(
      {
        userId: userId,
        date: today,
        journalType: 'step10'
      },
      {
        $set: {
          userId: userId,
          date: today,
          journalType: 'step10',
          completedVia: 'sms',
          timestamp: new Date()
        }
      },
      { upsert: true }
    );

    // Update streak data
    // This would typically call a service function to update the streak

    // Log this interaction
    await db.collection('smsInteractions').insertOne({
      userId,
      command: 'DONE',
      timestamp: new Date()
    });

    return 'Thank you! Your Step 10 journal completion has been recorded. Keep up the good work!';
  } catch (error) {
    console.error('Error handling DONE command:', error);
    return 'Sorry, we encountered an error recording your completion. Please try again later.';
  }
}