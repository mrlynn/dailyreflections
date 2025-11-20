# Email Notifications Debug Guide

## Quick Debug Steps

### 1. Run the Debug Script

```bash
npm run email:debug
```

This will check:
- ✅ Email service configuration (EMAIL_USER, EMAIL_APP_PASSWORD)
- ✅ Total users in database
- ✅ Users with notification preferences
- ✅ Users with email notifications enabled
- ✅ Users with valid email addresses
- ✅ Quiet hours status for each user
- ✅ Reflection availability for today
- ✅ Exact query used by the service

### 2. Check Common Issues

#### Issue: No Eligible Users Found

**Symptoms:**
- `total: 0` in results
- Debug script shows "No eligible users found"

**Possible Causes:**
1. **User preferences not saved correctly**
   - Check if users completed onboarding
   - Verify preferences structure in MongoDB:
     ```javascript
     db.users.findOne({ email: "user@example.com" })
     // Look for: preferences.notifications.enabled = true
     // Look for: preferences.notifications.channels.email = true
     ```

2. **Preferences structure mismatch**
   - The query expects: `preferences.notifications.enabled` and `preferences.notifications.channels.email`
   - Check if your users have this exact structure

3. **No email addresses**
   - Users must have either:
     - `preferences.notifications.email` set, OR
     - `email` field in user document

**Fix:**
```javascript
// Manually enable email for a test user in MongoDB
db.users.updateOne(
  { email: "test@example.com" },
  { 
    $set: {
      "preferences.notifications.enabled": true,
      "preferences.notifications.channels.email": true,
      "preferences.notifications.morningTime": "07:00"
    }
  }
)
```

#### Issue: Eligible Users Found But No Emails Sent

**Symptoms:**
- `total: X` but `sent: 0`
- `failed: X` or `quietHours: X` in results

**Possible Causes:**

1. **Quiet Hours Blocking**
   - All users are in quiet hours
   - Check current time vs quiet hours settings
   - Default quiet hours: 9 PM - 7 AM

2. **Email Transporter Not Initialized**
   - Missing `EMAIL_USER` or `EMAIL_APP_PASSWORD`
   - Check environment variables

3. **Email Service Error**
   - Gmail authentication failed
   - Check error messages in logs

**Fix:**
```javascript
// Temporarily disable quiet hours check for testing
// Or test during non-quiet hours (7 AM - 9 PM)
```

#### Issue: Email Transporter Not Initialized

**Symptoms:**
- Error: "Email transporter not initialized"
- No emails sent

**Fix:**
1. Set `EMAIL_USER` environment variable (Gmail address)
2. Set `EMAIL_APP_PASSWORD` environment variable (Gmail app password, not regular password)
3. Verify in Vercel dashboard: Settings → Environment Variables

### 3. Test Individual User

Test sending to a specific user:

```bash
# Via API (requires authentication)
curl -X POST https://your-domain.com/api/email/send/reflection \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{"userId": "USER_ID_HERE"}'
```

### 4. Check Vercel Cron Logs

1. Go to Vercel Dashboard → Your Project
2. Click on "Functions" tab
3. Find `/api/cron/send-daily-emails`
4. Check execution logs for errors

### 5. Verify User Structure

Run this in MongoDB to see actual user structure:

```javascript
// Find a user with email
db.users.findOne({ email: { $exists: true } })

// Check notification preferences
db.users.find({
  "preferences.notifications.enabled": true
}).limit(5).pretty()

// Count users with email notifications
db.users.countDocuments({
  "preferences.notifications.enabled": true,
  "preferences.notifications.channels.email": true
})
```

### 6. Common MongoDB Queries

```javascript
// Find all users with email notifications enabled
db.users.find({
  "preferences.notifications.enabled": true,
  "preferences.notifications.channels.email": true
})

// Check if a specific user has correct structure
db.users.findOne(
  { email: "user@example.com" },
  { 
    email: 1,
    "preferences.notifications": 1
  }
)

// Enable email for a user (for testing)
db.users.updateOne(
  { email: "user@example.com" },
  {
    $set: {
      "preferences.notifications.enabled": true,
      "preferences.notifications.channels.email": true,
      "preferences.notifications.morningTime": "07:00",
      "preferences.notifications.quietHoursStart": "22:00",
      "preferences.notifications.quietHoursEnd": "08:00"
    }
  }
)
```

## Expected User Structure

```javascript
{
  _id: ObjectId("..."),
  email: "user@example.com",
  name: "User Name",
  preferences: {
    notifications: {
      enabled: true,
      morningTime: "07:00",
      eveningTime: "21:00",
      quietHoursStart: "22:00",
      quietHoursEnd: "08:00",
      channels: {
        email: true,  // ← Must be true
        sms: false,
        app: true
      },
      email: "user@example.com"  // Optional: specific email for notifications
    }
  }
}
```

## Debug Checklist

- [ ] Run `npm run email:debug`
- [ ] Check EMAIL_USER is set
- [ ] Check EMAIL_APP_PASSWORD is set
- [ ] Verify users have `preferences.notifications.enabled = true`
- [ ] Verify users have `preferences.notifications.channels.email = true`
- [ ] Check users have valid email addresses
- [ ] Verify current time is not in quiet hours
- [ ] Check reflection exists for today
- [ ] Review Vercel cron logs
- [ ] Test sending to individual user

## Still Not Working?

1. **Check Vercel Function Logs**
   - Look for detailed error messages
   - Check execution duration (might be timing out)

2. **Test Email Service Directly**
   ```javascript
   // In a test script
   import { sendDailyReflectionEmail } from '@/lib/emailService';
   // Test with a known good reflection
   ```

3. **Verify Gmail App Password**
   - Must be an app password, not regular password
   - Generate new one if needed: Google Account → Security → App passwords

4. **Check Rate Limits**
   - Gmail has sending limits
   - Check if you're hitting limits

