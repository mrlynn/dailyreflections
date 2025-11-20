# SMS Integration Setup Guide

This guide explains how to set up and configure the SMS integration features for the AA Companion application.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Twilio Account Setup](#twilio-account-setup)
4. [Environment Configuration](#environment-configuration)
5. [Feature Flags](#feature-flags)
6. [Webhook Configuration](#webhook-configuration)
7. [Database Schema](#database-schema)
8. [Scheduled Jobs](#scheduled-jobs)
9. [Testing](#testing)
10. [Monitoring](#monitoring)
11. [Troubleshooting](#troubleshooting)

## Overview

The SMS integration allows users to:

- Receive daily reflections via SMS at their preferred time
- Get Step 10 evening reminders for daily inventory
- Get weekly Step 4 check-in reminders
- Interact with the app via two-way SMS (reply "TODAY" to get today's reflection, "DONE" to log completion, etc.)
- Opt in/out of messages with standard commands (STOP, START, HELP)

## Prerequisites

- Twilio account with SMS capabilities
- Twilio phone number with SMS support
- Server with cron job capabilities
- MongoDB database
- Node.js 16+ environment

## Twilio Account Setup

1. **Create a Twilio account**:
   - Sign up at [twilio.com](https://www.twilio.com)
   - Verify your email and phone number

2. **Purchase a phone number**:
   - Navigate to "Phone Numbers" > "Buy a Number"
   - Ensure the number has SMS capabilities
   - Complete the purchase

3. **Get your credentials**:
   - From your Twilio dashboard, note your:
     - Account SID
     - Auth Token
     - Twilio Phone Number

## A2P Campaign Registration & Compliance

Carriers now require detailed registration for all application-to-person (A2P) messaging. Use this checklist when submitting or updating the Daily Reflections campaign in the Twilio Trust Hub so reviewers can validate our opt-in flow and consent language.

### Message Flow / Call-to-Action (CTA)

- Document **every** opt-in path (web form, keyword, QR code, in-person, etc.).
- Include the exact consent language users see at each opt-in point.
- State the brand name prominently: “Daily Reflections”.
- Disclose frequency: e.g., “Users receive up to 1 message daily plus optional reminders.”
- Link publicly accessible Terms of Service and Privacy Policy pages.
- Include the exact phrase: “Message and data rates may apply.”
- Provide clear opt-out instructions: “Reply STOP to unsubscribe.”
- Mention how to request help: “Reply HELP for help.”

### Verification Evidence

- If the opt-in flow requires authentication, capture and attach annotated screenshots that show the entire process.
- Provide a public demo URL if possible, or describe step-by-step how reviewers can access the flow.
- For offline consent, attach the full script or physical form used to collect permission.

### Alignment & Sample Messages

- Ensure the campaign description, message flow, and sample messages describe the **same use case** (daily reflections and recovery reminders, not marketing).
- Provide at least two confirmation/ongoing message samples in the submission:
  - Opt-in confirmation:  
    “Welcome to Daily Reflections! You’ll receive your daily reflection at 7am. Msg&data rates may apply. Text HELP for help, STOP to cancel.”
  - Routine notification:  
    “Daily Reflections: Here’s today’s reading [short description]. Reply STOP to cancel, HELP for help.”
- Update any automation scripts to match the approved messaging language before going live.

After completing the checklist, resubmit the campaign in the Twilio Console’s Trust Hub. If rejected again, review the returned feedback, adjust the Message Flow section, and provide any requested artifacts before resubmitting.

## Environment Configuration

Add the following variables to your `.env.local` file:

```
# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
TWILIO_WEBHOOK_URL=https://your-domain.com/api/sms/webhook

# SMS Feature Flags
NEXT_PUBLIC_FEATURE_SMS=true
NEXT_PUBLIC_FEATURE_SMS_DAILY_REFLECTION=true
NEXT_PUBLIC_FEATURE_SMS_STEP10_REMINDER=true
NEXT_PUBLIC_FEATURE_SMS_STEP4_CHECKIN=true
NEXT_PUBLIC_FEATURE_SMS_TWOWAY=true
```

## Feature Flags

The SMS features are controlled by environment variables:

- `NEXT_PUBLIC_FEATURE_SMS` - Master toggle for all SMS features
- `NEXT_PUBLIC_FEATURE_SMS_DAILY_REFLECTION` - Enable daily reflection SMS
- `NEXT_PUBLIC_FEATURE_SMS_STEP10_REMINDER` - Enable Step 10 reminder SMS
- `NEXT_PUBLIC_FEATURE_SMS_STEP4_CHECKIN` - Enable Step 4 check-in SMS
- `NEXT_PUBLIC_FEATURE_SMS_TWOWAY` - Enable two-way SMS communication

Set these to `true` to enable each feature independently.

## Webhook Configuration

Configure your Twilio phone number to use webhooks for incoming SMS:

1. Go to "Phone Numbers" > "Manage Numbers"
2. Click on your SMS-enabled phone number
3. Under "Messaging", set the webhook URL:
   - When a message comes in: `https://your-domain.com/api/sms/webhook`
   - Method: HTTP POST

## Database Schema

The SMS integration uses the following collections:

### userSMSPreferences

```javascript
{
  userId: ObjectId,
  phoneNumber: String, // 10-digit number
  preferences: {
    enabled: Boolean,
    dailyReflection: Boolean,
    step10Reminder: Boolean,
    step4CheckIn: Boolean,
    meetingReminders: Boolean,
    quietHoursStart: String, // "21:00"
    quietHoursEnd: String,   // "07:00"
    dailyReflectionTime: String, // "07:00"
    step10ReminderTime: String,  // "21:00"
  },
  optInDate: Date,
  optOutDate: Date,
  timezone: String // e.g., "America/New_York"
}
```

### smsLogs

```javascript
{
  userId: ObjectId,
  phoneNumber: String,
  messageType: String, // 'daily_reflection', 'step10_reminder', etc.
  messageId: String,   // Twilio SID
  body: String,
  status: String,      // 'queued', 'sent', 'delivered', 'failed'
  error: String,
  timestamp: Date,
  sentAt: Date
}
```

### smsInbound

```javascript
{
  phoneNumber: String,
  body: String,        // The message content
  messageSid: String,  // Twilio message ID
  userId: ObjectId,    // User who sent the message (if known)
  timestamp: Date,
  processed: Boolean
}
```

### smsOptEvents

```javascript
{
  userId: ObjectId,
  phoneNumber: String,
  type: String,        // 'opt_in' or 'opt_out'
  timestamp: Date
}
```

### smsDeliveryLogs

```javascript
{
  type: String,        // 'daily_reflection', 'step10_reminder', etc.
  timestamp: Date,
  results: {
    total: Number,
    sent: Number,
    failed: Number,
    skipped: Number,
    quietHours: Number,
    errors: Array
  }
}
```

## Scheduled Jobs

Set up cron jobs to send SMS messages at appropriate intervals:

### Daily Reflections (Every Hour)

```
0 * * * * cd /path/to/project && npm run sms:send-reflections >> /var/log/aa-companion/daily-reflection-sms.log 2>&1
```

This runs every hour and sends daily reflections to users based on their timezone and preferred time.

### Step 10 Reminders (Every Hour)

```
0 * * * * cd /path/to/project && npm run sms:send-step10 >> /var/log/aa-companion/step10-reminder-sms.log 2>&1
```

This runs every hour and sends Step 10 reminders to users based on their timezone and preferred time.

### Weekly Step 4 Check-ins (Every Sunday)

```
0 10 * * 0 cd /path/to/project && NODE_ENV=production node scripts/send-step4-checkins.js >> /var/log/aa-companion/step4-checkin-sms.log 2>&1
```

This runs every Sunday at 10 AM to send Step 4 check-in reminders.

## Testing

To verify your Twilio setup:

```bash
npm run sms:verify-setup
```

This will check your environment variables and test the Twilio connection.

To test sending a single message:

```bash
# Send a test daily reflection to a specific user
curl -X POST http://localhost:3000/api/sms/send/reflection \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-id-here"}'

# Send a test Step 10 reminder to a specific user
curl -X POST http://localhost:3000/api/sms/send/step10 \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-id-here"}'
```

## Monitoring

Monitor SMS sending with:

1. **Logs** - Check the log files for scheduled jobs
2. **Database** - Query the smsLogs and smsDeliveryLogs collections
3. **Twilio Console** - View message logs in the Twilio console

## Troubleshooting

### Common Issues

1. **Messages not sending**
   - Check if user's preferences have SMS enabled
   - Verify the user's phone number format
   - Check for quiet hours conflicts
   - Verify Twilio credentials

2. **Rate limiting issues**
   - Twilio has rate limits for message sending
   - Add delay between messages (implemented in scripts)

3. **Webhook not receiving messages**
   - Verify the webhook URL in Twilio console
   - Ensure server is publicly accessible
   - Check server logs for incoming requests
   - Validate the webhook URL format

4. **Messages formatted incorrectly**
   - Check the formatting functions in `smsService.js`
   - Ensure message lengths are within SMS limits

5. **Wrong timezone issues**
   - Verify user's timezone setting
   - Check server timezone configuration