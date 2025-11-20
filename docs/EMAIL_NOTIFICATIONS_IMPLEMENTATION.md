# Email Notifications Implementation

## Overview

Email notifications for daily reflections have been fully implemented. Users can opt-in during onboarding or via their profile settings to receive daily reflection emails at their preferred time.

## Architecture

### Components

1. **Email Service** (`src/lib/emailService.js`)
   - `sendDailyReflectionEmail()` - Sends formatted daily reflection emails
   - `formatReflectionForEmail()` - Formats reflection content for email (HTML + text)
   - `canSendEmailDuringQuietHours()` - Checks if email can be sent based on quiet hours

2. **Email Delivery Service** (`src/services/emailDeliveryService.js`)
   - `sendDailyReflectionToUser()` - Sends reflection to a specific user
   - `sendDailyReflectionToAllUsers()` - Sends reflections to all eligible users
   - Handles user preferences, quiet hours, and logging

3. **Email Log Model** (`src/lib/models/emailLog.js`)
   - Tracks all sent emails for analytics
   - Similar structure to SMS logs

4. **API Endpoint** (`src/app/api/email/send/reflection/route.js`)
   - POST endpoint for sending reflection emails
   - Supports sending to individual users or all users (admin only)

5. **Cron Script** (`scripts/send-daily-reflection-emails.js`)
   - Automated script to send daily reflection emails
   - Respects timezone and quiet hours preferences

## User Preferences

Email notification preferences are stored in the user document:

```javascript
{
  preferences: {
    notifications: {
      enabled: true,
      morningTime: "07:00",  // Preferred send time
      eveningTime: "21:00",
      quietHoursStart: "22:00",
      quietHoursEnd: "08:00",
      channels: {
        email: true,  // Email notifications enabled
        sms: false,
        app: true
      },
      email: "user@example.com"  // Optional: specific email for notifications
    }
  }
}
```

**Note:** If `preferences.notifications.email` is not set, the system uses the user's account email address.

## Email Format

Emails include:
- **Header:** Branded header with date
- **Title:** Reflection title
- **Quote:** Highlighted quote section
- **Comment:** Full reflection text
- **Reference:** Source reference
- **CTA Button:** Link to view full reflection on the website
- **Footer:** Unsubscribe/manage preferences link

Both HTML and plain text versions are included for maximum compatibility.

## Triggering Email Sends

### Option 1: Cron Job (Recommended)

Set up a cron job to run the script hourly:

```bash
# Run every hour
0 * * * * cd /path/to/daily-reflections && node scripts/send-daily-reflection-emails.js
```

The script will:
1. Find all users with email notifications enabled
2. Check if it's the right time based on their timezone and preferred time
3. Respect quiet hours settings
4. Send emails to eligible users
5. Log results to database

**Example cron setup:**
```bash
# Add to crontab (crontab -e)
0 * * * * cd /Users/michael.lynn/code/dailyreflection/daily-reflections && /usr/local/bin/node scripts/send-daily-reflection-emails.js >> /var/log/daily-reflections-email.log 2>&1
```

### Option 2: Vercel Cron Jobs (Recommended for Vercel Deployments)

If deployed on Vercel, the cron job is already configured:

1. **Configuration** (`vercel.json`):
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/send-daily-emails",
         "schedule": "0 * * * *"
       }
     ]
   }
   ```

2. **API Route** (`src/app/api/cron/send-daily-emails/route.js`):
   - Automatically verifies Vercel cron user agent
   - Sends emails to all eligible users
   - Returns results with timing information

**How it works:**
- Vercel makes a GET request to `/api/cron/send-daily-emails` every hour (at minute 0)
- The endpoint verifies the request is from Vercel (user-agent: `vercel-cron/1.0`)
- Emails are sent to all eligible users
- Results are logged and returned

**Testing the cron job:**
```bash
# Test locally (bypasses user-agent check in development)
curl http://localhost:3000/api/cron/send-daily-emails

# Test in production (must be from Vercel or with proper user-agent)
curl -H "User-Agent: vercel-cron/1.0" https://your-domain.com/api/cron/send-daily-emails
```

**Note:** Vercel cron jobs run in UTC timezone. The script handles timezone conversion for users.

### Option 3: Manual API Call

For testing or manual sends:

```bash
# Send to current user
curl -X POST https://your-domain.com/api/email/send/reflection \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{}'

# Send to all users (admin only)
curl -X POST https://your-domain.com/api/email/send/reflection \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{"sendToAll": true}'

# Send specific date
curl -X POST https://your-domain.com/api/email/send/reflection \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{"dateKey": "01-08"}'
```

### Option 4: Node.js Script

Run directly:

```bash
node scripts/send-daily-reflection-emails.js
```

## Environment Variables

Required:
- `EMAIL_USER` - Gmail address for sending emails
- `EMAIL_APP_PASSWORD` - Gmail app password (not regular password)

Optional:
- `NEXT_PUBLIC_FEATURE_EMAIL_NOTIFICATIONS` - Set to `false` to disable feature
- `NEXT_PUBLIC_BASE_URL` - Base URL for email links (defaults to NEXTAUTH_URL)
- `MONGODB_URI` - MongoDB connection string
- `MONGODB_DB` - Database name (defaults to 'dailyreflections')

## Timezone Handling

The cron script uses a simplified timezone offset calculation. For production, consider using a proper timezone library like `date-fns-tz` or `luxon` for accurate timezone conversions.

Current implementation supports:
- America/New_York (UTC-5)
- America/Chicago (UTC-6)
- America/Denver (UTC-7)
- America/Los_Angeles (UTC-8)
- And other common timezones

## Quiet Hours

Emails respect user quiet hours settings:
- Default: 9 PM - 7 AM
- Customizable per user
- Emails are skipped during quiet hours (not queued)

## Logging

All email sends are logged to the `emailLogs` collection:
- User ID
- Email address
- Message type
- Status (sent/failed)
- Timestamp
- Error messages (if failed)

Delivery summaries are logged to `emailDeliveryLogs` collection for batch operations.

## Testing

1. **Test individual send:**
   ```bash
   # Use the API endpoint with your session
   curl -X POST http://localhost:3000/api/email/send/reflection \
     -H "Content-Type: application/json" \
     -H "Cookie: next-auth.session-token=YOUR_TOKEN"
   ```

2. **Test cron script:**
   ```bash
   node scripts/send-daily-reflection-emails.js
   ```

3. **Check logs:**
   ```javascript
   // Query emailLogs collection
   db.emailLogs.find().sort({ sentAt: -1 }).limit(10)
   ```

## Future Enhancements

- [ ] Email verification for notification email addresses
- [ ] Unsubscribe links in emails
- [ ] Email templates for Step 10 reminders
- [ ] Better timezone handling with proper library
- [ ] Email delivery status tracking (bounces, opens)
- [ ] Batch sending with rate limiting
- [ ] Retry logic for failed sends

## Troubleshooting

**Emails not sending:**
1. Check `EMAIL_USER` and `EMAIL_APP_PASSWORD` are set
2. Verify Gmail app password is correct (not regular password)
3. Check email logs: `db.emailLogs.find().sort({ sentAt: -1 })`
4. Verify user has email notifications enabled in preferences

**Cron not running:**
1. Check cron logs: `/var/log/cron` or `journalctl -u cron`
2. Verify script has execute permissions
3. Check Node.js path in cron is correct
4. Test script manually first

**Timezone issues:**
1. Verify user's timezone is set in `sobriety.timezone`
2. Check timezone offset calculation
3. Consider using proper timezone library

