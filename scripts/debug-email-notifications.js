/**
 * Debug Email Notifications Script
 * 
 * This script helps debug why emails aren't being sent by checking:
 * 1. Email service configuration
 * 2. User preferences structure
 * 3. Eligible users count
 * 4. Quiet hours status
 * 5. Reflection availability
 */

import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import { existsSync } from 'fs';

// Load environment variables - try .env.local first (common in Next.js), then .env
const envLocalPath = '.env.local';
const envPath = '.env';

if (existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
  console.log(`📁 Loaded environment from ${envLocalPath}\n`);
} else if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`📁 Loaded environment from ${envPath}\n`);
} else {
  console.warn('⚠️  No .env.local or .env file found. Using system environment variables.\n');
  dotenv.config(); // Still try default, might load from system env
}

async function main() {
  console.log('🔍 Starting email notifications debug...\n');

  // Check for required environment variables
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set in environment variables');
    console.error('Please ensure you have a .env file with MONGODB_URI set');
    console.error('Or set it as an environment variable before running the script');
    process.exit(1);
  }

  const mongoClient = new MongoClient(process.env.MONGODB_URI);

  try {
    await mongoClient.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = mongoClient.db(process.env.MONGODB_DB || 'dailyreflections');

    // 1. Check email service configuration
    console.log('1️⃣ Checking email service configuration...');
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_APP_PASSWORD;
    
    if (!emailUser) {
      console.log('❌ EMAIL_USER is not set');
    } else {
      console.log(`✅ EMAIL_USER is set: ${emailUser}`);
    }
    
    if (!emailPassword) {
      console.log('❌ EMAIL_APP_PASSWORD is not set');
    } else {
      console.log(`✅ EMAIL_APP_PASSWORD is set: ${emailPassword.substring(0, 4)}...`);
    }
    console.log('');

    // 2. Check total users
    console.log('2️⃣ Checking users in database...');
    const totalUsers = await db.collection('users').countDocuments();
    console.log(`Total users: ${totalUsers}\n`);

    // 3. Check users with notification preferences
    console.log('3️⃣ Checking users with notification preferences...');
    const usersWithPrefs = await db.collection('users')
      .find({ 'preferences.notifications': { $exists: true } })
      .toArray();
    console.log(`Users with notification preferences: ${usersWithPrefs.length}`);
    
    if (usersWithPrefs.length > 0) {
      console.log('\nSample user preferences structure:');
      const sampleUser = usersWithPrefs[0];
      console.log(JSON.stringify({
        _id: sampleUser._id.toString(),
        email: sampleUser.email,
        preferences: sampleUser.preferences?.notifications
      }, null, 2));
    }
    console.log('');

    // 4. Check users with email notifications enabled
    console.log('4️⃣ Checking users with email notifications enabled...');
    const emailEnabledQuery = {
      'preferences.notifications.enabled': true,
      'preferences.notifications.channels.email': true
    };
    
    const emailEnabledUsers = await db.collection('users')
      .find(emailEnabledQuery)
      .toArray();
    
    console.log(`Users with email notifications enabled: ${emailEnabledUsers.length}`);
    
    if (emailEnabledUsers.length > 0) {
      console.log('\nEmail-enabled users:');
      emailEnabledUsers.forEach(user => {
        const notifications = user.preferences?.notifications;
        const email = notifications?.email || user.email;
        console.log(`  - ${user.name || user.displayName || 'Unknown'} (${email})`);
        console.log(`    Enabled: ${notifications?.enabled}`);
        console.log(`    Email channel: ${notifications?.channels?.email}`);
        console.log(`    Notification email: ${notifications?.email || 'using account email'}`);
        console.log(`    Morning time: ${notifications?.morningTime || 'not set'}`);
        console.log(`    Quiet hours: ${notifications?.quietHoursStart || '22:00'} - ${notifications?.quietHoursEnd || '08:00'}`);
        console.log('');
      });
    }
    console.log('');

    // 5. Check users with valid email addresses
    console.log('5️⃣ Checking users with valid email addresses...');
    const usersWithEmail = await db.collection('users')
      .find({
        'preferences.notifications.enabled': true,
        'preferences.notifications.channels.email': true,
        $or: [
          { 'preferences.notifications.email': { $exists: true, $ne: null, $ne: '' } },
          { email: { $exists: true, $ne: null, $ne: '' } }
        ]
      })
      .toArray();
    
    console.log(`Users with valid email addresses: ${usersWithEmail.length}\n`);

    // 6. Check quiet hours status
    console.log('6️⃣ Checking quiet hours status...');
    const now = new Date();
    const currentHour = now.getHours();
    const currentTime = now.toLocaleTimeString();
    console.log(`Current time: ${currentTime} (hour: ${currentHour})`);
    
    if (usersWithEmail.length > 0) {
      console.log('\nQuiet hours check for each user:');
      usersWithEmail.forEach(user => {
        const notifications = user.preferences?.notifications;
        const quietStart = notifications?.quietHoursStart || '22:00';
        const quietEnd = notifications?.quietHoursEnd || '08:00';
        const [startHour] = quietStart.split(':').map(Number);
        const [endHour] = quietEnd.split(':').map(Number);
        
        let inQuietHours = false;
        if (startHour > endHour) {
          // Spans midnight
          inQuietHours = currentHour >= startHour || currentHour < endHour;
        } else {
          // Same day
          inQuietHours = currentHour >= startHour && currentHour < endHour;
        }
        
        console.log(`  - ${user.name || 'Unknown'}: ${inQuietHours ? '❌ IN QUIET HOURS' : '✅ Can send'}`);
        console.log(`    Quiet hours: ${quietStart} - ${quietEnd}`);
      });
    }
    console.log('');

    // 7. Check reflection availability
    console.log('7️⃣ Checking reflection availability...');
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    
    const reflection = await db.collection('reflections').findOne({
      month: month,
      day: day
    });
    
    if (reflection) {
      console.log(`✅ Reflection found for today (${month}/${day}): ${reflection.title || 'Untitled'}`);
    } else {
      console.log(`❌ No reflection found for today (${month}/${day})`);
    }
    console.log('');

    // 8. Test the actual query used by sendDailyReflectionToAllUsers
    console.log('8️⃣ Testing the exact query used by sendDailyReflectionToAllUsers...');
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
    
    console.log(`Eligible users found: ${eligibleUsers.length}`);
    
    if (eligibleUsers.length === 0) {
      console.log('\n❌ NO ELIGIBLE USERS FOUND!');
      console.log('\nPossible reasons:');
      console.log('  1. No users have email notifications enabled');
      console.log('  2. User preferences structure is different than expected');
      console.log('  3. Email addresses are missing or invalid');
      console.log('\nTry running this query in MongoDB to see actual user structure:');
      console.log('  db.users.find({ email: { $exists: true } }).limit(1).pretty()');
    } else {
      console.log('\n✅ Found eligible users!');
      eligibleUsers.forEach(user => {
        const notifications = user.preferences?.notifications;
        const email = notifications?.email || user.email;
        console.log(`  - ${user.name || 'Unknown'}: ${email}`);
      });
    }
    console.log('');

    // 9. Check if email transporter would initialize
    console.log('9️⃣ Testing email transporter initialization...');
    if (!emailUser || !emailPassword) {
      console.log('❌ Email transporter cannot initialize - missing credentials');
    } else {
      console.log('✅ Email credentials are present - transporter should initialize');
    }
    console.log('');

    console.log('✅ Debug complete!');
    console.log('\nNext steps:');
    console.log('  1. If no eligible users found, check user preferences structure');
    console.log('  2. If users found but emails not sending, check quiet hours');
    console.log('  3. If transporter not initializing, check EMAIL_USER and EMAIL_APP_PASSWORD');
    console.log('  4. Test sending to a specific user: POST /api/email/send/reflection with userId');

  } catch (error) {
    console.error('❌ Error during debug:', error);
  } finally {
    await mongoClient.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

