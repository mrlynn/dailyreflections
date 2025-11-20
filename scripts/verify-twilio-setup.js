/**
 * Twilio Setup Verification Script
 *
 * This script verifies that Twilio is properly configured by checking:
 * 1. Environment variables are set
 * 2. Twilio authentication is working
 * 3. The configured phone number belongs to the account
 * 4. The webhook URL is configured
 *
 * Usage: node scripts/verify-twilio-setup.js
 */

// Load environment variables
require('dotenv').config();

// Import Twilio client
const twilio = require('twilio');

// ANSI color codes for formatting output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

// Check if SMS feature is enabled in feature flags
console.log(`${colors.blue}${colors.bold}Verifying SMS feature flags...${colors.reset}`);

const smsEnabled = process.env.NEXT_PUBLIC_FEATURE_SMS === 'true';
if (!smsEnabled) {
  console.log(`${colors.yellow}SMS feature is not enabled. Enable it by setting NEXT_PUBLIC_FEATURE_SMS=true${colors.reset}`);
} else {
  console.log(`${colors.green}✓ SMS feature is enabled${colors.reset}`);
}

// Verify specific SMS feature flags
const dailyReflectionEnabled = process.env.NEXT_PUBLIC_FEATURE_SMS_DAILY_REFLECTION === 'true';
const step10ReminderEnabled = process.env.NEXT_PUBLIC_FEATURE_SMS_STEP10_REMINDER === 'true';
const step4CheckinEnabled = process.env.NEXT_PUBLIC_FEATURE_SMS_STEP4_CHECKIN === 'true';
const twoWaySmsEnabled = process.env.NEXT_PUBLIC_FEATURE_SMS_TWOWAY === 'true';

console.log(`${colors.blue}SMS Feature Status:${colors.reset}`);
console.log(`  ${dailyReflectionEnabled ? colors.green + '✓' : colors.yellow + '○'} Daily Reflection SMS: ${dailyReflectionEnabled ? 'Enabled' : 'Disabled'}${colors.reset}`);
console.log(`  ${step10ReminderEnabled ? colors.green + '✓' : colors.yellow + '○'} Step 10 Reminder SMS: ${step10ReminderEnabled ? 'Enabled' : 'Disabled'}${colors.reset}`);
console.log(`  ${step4CheckinEnabled ? colors.green + '✓' : colors.yellow + '○'} Step 4 Check-in SMS: ${step4CheckinEnabled ? 'Enabled' : 'Disabled'}${colors.reset}`);
console.log(`  ${twoWaySmsEnabled ? colors.green + '✓' : colors.yellow + '○'} Two-way SMS: ${twoWaySmsEnabled ? 'Enabled' : 'Disabled'}${colors.reset}`);

// Check for required environment variables
console.log(`\n${colors.blue}${colors.bold}Checking required environment variables...${colors.reset}`);

const requiredVars = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
  'TWILIO_WEBHOOK_URL'
];

let missingVars = false;

requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    console.log(`${colors.red}✗ Missing ${varName}${colors.reset}`);
    missingVars = true;
  } else {
    // Mask sensitive values
    const value = varName.includes('TOKEN')
      ? `${process.env[varName].substring(0, 4)}...${process.env[varName].substring(process.env[varName].length - 4)}`
      : process.env[varName];
    console.log(`${colors.green}✓ ${varName}: ${value}${colors.reset}`);
  }
});

if (missingVars) {
  console.log(`\n${colors.red}${colors.bold}Error: Missing required environment variables. Please update your .env.local file.${colors.reset}`);
  process.exit(1);
}

// Verify Twilio configuration
async function verifyTwilioSetup() {
  console.log(`\n${colors.blue}${colors.bold}Verifying Twilio configuration...${colors.reset}`);

  try {
    // Initialize Twilio client
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const client = twilio(accountSid, authToken);

    // Test authentication by fetching account info
    console.log('Testing Twilio authentication...');
    const account = await client.api.accounts(accountSid).fetch();
    console.log(`${colors.green}✓ Authentication successful. Account name: ${account.friendlyName}${colors.reset}`);

    // Verify phone number belongs to account
    console.log('\nVerifying phone number...');
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

    // Normalize phone number format
    const normalizedPhoneNumber = phoneNumber.startsWith('+')
      ? phoneNumber
      : `+${phoneNumber.startsWith('1') ? phoneNumber : '1' + phoneNumber}`;

    const incomingPhoneNumbers = await client.incomingPhoneNumbers.list({
      phoneNumber: normalizedPhoneNumber,
    });

    if (incomingPhoneNumbers.length === 0) {
      console.log(`${colors.red}✗ Phone number ${normalizedPhoneNumber} not found in your account${colors.reset}`);
      console.log('Available phone numbers in your account:');

      const allNumbers = await client.incomingPhoneNumbers.list();
      if (allNumbers.length === 0) {
        console.log('  No phone numbers found in your account');
      } else {
        allNumbers.forEach(num => {
          console.log(`  ${num.phoneNumber} (${num.friendlyName})`);
        });
      }
    } else {
      console.log(`${colors.green}✓ Phone number ${normalizedPhoneNumber} verified in your account${colors.reset}`);

      // Check if webhook URL is configured
      console.log('\nVerifying webhook URL configuration...');
      const number = incomingPhoneNumbers[0];
      const configuredWebhook = number.smsUrl;
      const expectedWebhook = process.env.TWILIO_WEBHOOK_URL;

      if (configuredWebhook === expectedWebhook) {
        console.log(`${colors.green}✓ Webhook URL is properly configured: ${configuredWebhook}${colors.reset}`);
      } else {
        console.log(`${colors.yellow}○ Current webhook URL: ${configuredWebhook || 'Not set'}${colors.reset}`);
        console.log(`${colors.yellow}○ Expected webhook URL: ${expectedWebhook}${colors.reset}`);
        console.log(`${colors.yellow}To update the webhook URL, visit the Twilio Console or use the Twilio API.${colors.reset}`);
      }
    }

    console.log(`\n${colors.green}${colors.bold}Twilio verification completed.${colors.reset}`);
  } catch (error) {
    console.error(`\n${colors.red}${colors.bold}Error during Twilio verification:${colors.reset}`);
    console.error(`${colors.red}${error.message}${colors.reset}`);

    if (error.code === 20003) {
      console.error(`${colors.red}Authentication Error: Invalid Account SID or Auth Token${colors.reset}`);
    }

    process.exit(1);
  }
}

// Only verify Twilio if SMS is enabled
if (smsEnabled) {
  verifyTwilioSetup();
} else {
  console.log(`\n${colors.yellow}Skipping Twilio verification because SMS feature is not enabled.${colors.reset}`);
  console.log(`${colors.yellow}To enable SMS features, set NEXT_PUBLIC_FEATURE_SMS=true in your .env.local file.${colors.reset}`);
}