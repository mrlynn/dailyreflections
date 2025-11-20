/**
 * Meeting Attendance model for 90 in 90 tracking
 *
 * This file defines schemas and functions for meeting attendance tracking,
 * particularly for the 90 in 90 feature.
 */

import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

/**
 * Meeting Attendance schema definition
 *
 * {
 *   _id: ObjectId,
 *   userId: ObjectId,                   // Reference to user
 *   date: Date,                         // Date of meeting attendance
 *   type: String,                       // Meeting type (in-person, online, phone, etc.)
 *   name: String,                       // Name of the meeting (optional)
 *   notes: String,                      // User's personal notes about the meeting
 *   format: String,                     // Format of meeting (speaker, discussion, etc.)
 *   location: {                         // For in-person meetings (optional)
 *     name: String,                     // Location name
 *     address: String,                  // Address
 *     coordinates: {                    // For map integration (optional)
 *       lat: Number,
 *       lng: Number
 *     }
 *   },
 *   partOf90in90: Boolean,              // Whether this meeting counts toward 90-in-90
 *   createdAt: Date,                    // When this record was created
 *   updatedAt: Date,                    // When this record was last updated
 * }
 *
 * User Schema Addition for 90-in-90 Meeting Tracker
 *
 * meetingTracker: {
 *   ninetyInNinety: {
 *     active: Boolean,                  // Whether user is actively doing 90-in-90
 *     startDate: Date,                  // When they started their 90-in-90 journey
 *     lastActiveDate: Date,             // Last time they interacted with the tracker
 *     goalCompletedDate: Date | null,   // When they finished their 90-in-90 (if completed)
 *     streakEnd90in90: Date | null,     // When their 90-in-90 should end (startDate + 90 days)
 *     progress: Number,                 // Days logged toward 90 in 90
 *   },
 *   streaks: {
 *     current: Number,                  // Current streak (consecutive days)
 *     longest: Number,                  // Longest streak ever achieved
 *     lastMeetingDate: Date | null,     // Date of the last recorded meeting
 *   },
 *   totalMeetings: Number,              // Total lifetime meetings logged
 *   meetingsThisMonth: Number,          // Meetings logged in current month
 * }
 */

/**
 * Create a new meeting attendance record
 * @param {Object} meetingData Meeting data to be saved
 * @param {string} userId User ID
 * @returns {Promise<Object>} Created meeting record
 */
export async function createMeetingAttendance(meetingData, userId) {
  if (!userId) throw new Error('User ID is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const now = new Date();

  // Prepare meeting record
  const meetingRecord = {
    userId: new ObjectId(userId),
    date: new Date(meetingData.date || now),
    type: meetingData.type || 'in-person',
    name: meetingData.name || '',
    notes: meetingData.notes || '',
    format: meetingData.format || '',
    location: meetingData.location || null,
    partOf90in90: meetingData.partOf90in90 !== false, // Default to true
    createdAt: now,
    updatedAt: now
  };

  // Insert the meeting record
  const result = await db.collection('meeting_attendances').insertOne(meetingRecord);

  // Update user's meeting tracker stats
  await updateUserMeetingStats(userId, meetingRecord.date);

  return {
    ...meetingRecord,
    _id: result.insertedId
  };
}

/**
 * Update an existing meeting attendance record
 * @param {string} meetingId Meeting ID to update
 * @param {Object} meetingData Updated meeting data
 * @param {string} userId User ID for verification
 * @returns {Promise<boolean>} Success status
 */
export async function updateMeetingAttendance(meetingId, meetingData, userId) {
  if (!meetingId || !userId) throw new Error('Meeting ID and User ID are required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  // Prepare update data
  const updateData = {
    updatedAt: new Date()
  };

  // Only include fields that are provided
  if (meetingData.date) updateData.date = new Date(meetingData.date);
  if (meetingData.type) updateData.type = meetingData.type;
  if (meetingData.name !== undefined) updateData.name = meetingData.name;
  if (meetingData.notes !== undefined) updateData.notes = meetingData.notes;
  if (meetingData.format !== undefined) updateData.format = meetingData.format;
  if (meetingData.location !== undefined) updateData.location = meetingData.location;
  if (meetingData.partOf90in90 !== undefined) updateData.partOf90in90 = meetingData.partOf90in90;

  // Update the meeting record
  const result = await db.collection('meeting_attendances').updateOne(
    {
      _id: new ObjectId(meetingId),
      userId: new ObjectId(userId)
    },
    { $set: updateData }
  );

  // If date changed, we need to update user stats
  if (meetingData.date || meetingData.partOf90in90 !== undefined) {
    await refreshUserMeetingStats(userId);
  }

  return result.matchedCount > 0;
}

/**
 * Delete a meeting attendance record
 * @param {string} meetingId Meeting ID to delete
 * @param {string} userId User ID for verification
 * @returns {Promise<boolean>} Success status
 */
export async function deleteMeetingAttendance(meetingId, userId) {
  if (!meetingId || !userId) throw new Error('Meeting ID and User ID are required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  // Delete the meeting record
  const result = await db.collection('meeting_attendances').deleteOne({
    _id: new ObjectId(meetingId),
    userId: new ObjectId(userId)
  });

  // Update user's stats after deletion
  if (result.deletedCount > 0) {
    await refreshUserMeetingStats(userId);
  }

  return result.deletedCount > 0;
}

/**
 * Get meeting attendance records for a user
 * @param {string} userId User ID
 * @param {Object} options Query options
 * @param {number} options.limit Max number of records to return
 * @param {number} options.skip Number of records to skip
 * @param {Object} options.filter Additional filters
 * @returns {Promise<Array>} Meeting attendance records
 */
export async function getUserMeetingAttendance(userId, options = {}) {
  if (!userId) throw new Error('User ID is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const filter = {
    userId: new ObjectId(userId),
    ...(options.filter || {})
  };

  const limit = options.limit || 50;
  const skip = options.skip || 0;

  const meetings = await db.collection('meeting_attendances')
    .find(filter)
    .sort({ date: -1 }) // Most recent first
    .skip(skip)
    .limit(limit)
    .toArray();

  return meetings;
}

/**
 * Update user's meeting tracker statistics
 * @param {string} userId User ID
 * @param {Date} meetingDate Date of the meeting
 */
async function updateUserMeetingStats(userId, meetingDate) {
  const client = await clientPromise;
  const db = client.db('dailyreflections');

  // Get user's current meeting tracker data
  const user = await db.collection('users').findOne(
    { _id: new ObjectId(userId) },
    { projection: { meetingTracker: 1 } }
  );

  const meetingTracker = user?.meetingTracker || {};
  const streaks = meetingTracker.streaks || { current: 0, longest: 0, lastMeetingDate: null };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const meetingDay = new Date(meetingDate);
  meetingDay.setHours(0, 0, 0, 0);

  const lastMeetingDate = streaks.lastMeetingDate ? new Date(streaks.lastMeetingDate) : null;

  if (lastMeetingDate) {
    lastMeetingDate.setHours(0, 0, 0, 0);

    // Check if this is a consecutive day (for streak)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isConsecutiveDay =
      (meetingDay.getTime() === today.getTime() && lastMeetingDate.getTime() === yesterday.getTime()) ||
      (meetingDay.getTime() === yesterday.getTime() && lastMeetingDate.getTime() === yesterday.getTime() - 86400000);

    if (isConsecutiveDay) {
      // Increment streak
      streaks.current += 1;
      // Update longest streak if current is longer
      if (streaks.current > streaks.longest) {
        streaks.longest = streaks.current;
      }
    } else if (meetingDay.getTime() > lastMeetingDate.getTime()) {
      // Non-consecutive meeting, but more recent than last one
      // Reset streak to 1
      streaks.current = 1;
    }
    // If meeting is for an earlier date, don't change streak
  } else {
    // First meeting ever
    streaks.current = 1;
    streaks.longest = 1;
  }

  // Update last meeting date if this meeting is more recent
  if (!lastMeetingDate || meetingDay.getTime() > lastMeetingDate.getTime()) {
    streaks.lastMeetingDate = meetingDay;
  }

  // Check if user is in 90-in-90 and update accordingly
  const ninetyInNinety = meetingTracker.ninetyInNinety || { active: false };

  // Calculate updated stats
  const updateData = {
    'meetingTracker.streaks': streaks,
    'meetingTracker.totalMeetings': (meetingTracker.totalMeetings || 0) + 1,
  };

  // Update meetings this month
  const now = new Date();
  if (meetingDay.getMonth() === now.getMonth() && meetingDay.getFullYear() === now.getFullYear()) {
    updateData['meetingTracker.meetingsThisMonth'] = (meetingTracker.meetingsThisMonth || 0) + 1;
  }

  // If 90-in-90 is active and this meeting falls within the timeframe
  if (ninetyInNinety.active && ninetyInNinety.startDate) {
    const startDate = new Date(ninetyInNinety.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 90);

    if (meetingDay >= startDate && meetingDay <= endDate) {
      // Count meetings within 90-day window for each day (avoid double-counting)
      // Get all meetings within the 90-in-90 period
      const meetingsInPeriod = await db.collection('meeting_attendances').aggregate([
        {
          $match: {
            userId: new ObjectId(userId),
            date: { $gte: startDate, $lte: endDate },
            partOf90in90: true
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              month: { $month: "$date" },
              day: { $dayOfMonth: "$date" }
            },
            count: { $sum: 1 }
          }
        },
        {
          $count: "uniqueDays"
        }
      ]).toArray();

      const uniqueMeetingDays = meetingsInPeriod[0]?.uniqueDays || 0;

      // Update 90-in-90 progress
      updateData['meetingTracker.ninetyInNinety.progress'] = uniqueMeetingDays;

      // Check if 90-in-90 is now complete
      if (uniqueMeetingDays >= 90 && !ninetyInNinety.goalCompletedDate) {
        updateData['meetingTracker.ninetyInNinety.goalCompletedDate'] = new Date();
      }
    }

    // Always update the lastActiveDate
    updateData['meetingTracker.ninetyInNinety.lastActiveDate'] = new Date();
  }

  // Update user record
  await db.collection('users').updateOne(
    { _id: new ObjectId(userId) },
    { $set: updateData }
  );
}

/**
 * Refresh a user's meeting tracker stats from scratch
 * @param {string} userId User ID
 */
export async function refreshUserMeetingStats(userId) {
  if (!userId) throw new Error('User ID is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  // Get all user's meetings
  const meetings = await db.collection('meeting_attendances')
    .find({ userId: new ObjectId(userId) })
    .sort({ date: 1 }) // Oldest first for streak calculation
    .toArray();

  // Get user's 90-in-90 status
  const user = await db.collection('users').findOne(
    { _id: new ObjectId(userId) },
    { projection: { 'meetingTracker.ninetyInNinety': 1 } }
  );

  const ninetyInNinety = user?.meetingTracker?.ninetyInNinety || { active: false };

  // Initialize stats
  let streaks = { current: 0, longest: 0, lastMeetingDate: null };
  let totalMeetings = meetings.length;

  // Calculate streak
  let currentStreak = 0;
  let lastDate = null;

  // Calculate current month meetings
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const meetingsThisMonth = meetings.filter(meeting => {
    const meetingDate = new Date(meeting.date);
    return meetingDate.getMonth() === thisMonth && meetingDate.getFullYear() === thisYear;
  }).length;

  // Process meetings for streak calculation
  meetings.forEach((meeting, index) => {
    const meetingDate = new Date(meeting.date);
    meetingDate.setHours(0, 0, 0, 0);

    if (!lastDate) {
      // First meeting
      currentStreak = 1;
      lastDate = meetingDate;
    } else {
      // Check if this meeting is consecutive to the last one
      const nextDay = new Date(lastDate);
      nextDay.setDate(nextDay.getDate() + 1);

      if (meetingDate.getTime() === nextDay.getTime()) {
        // Consecutive day
        currentStreak += 1;
      } else if (meetingDate.getTime() > nextDay.getTime()) {
        // Gap in meetings, reset streak
        currentStreak = 1;
      }

      // Don't increment for same-day meetings
      if (meetingDate.getTime() > lastDate.getTime()) {
        lastDate = meetingDate;
      }
    }

    // Update longest streak
    if (currentStreak > streaks.longest) {
      streaks.longest = currentStreak;
    }
  });

  // Set final streak values
  streaks.current = currentStreak;
  streaks.lastMeetingDate = lastDate;

  // Calculate 90-in-90 progress
  let ninetyInNinetyUpdates = {};

  if (ninetyInNinety.active && ninetyInNinety.startDate) {
    const startDate = new Date(ninetyInNinety.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 90);

    // Count unique days with meetings in the 90-in-90 period
    const uniqueDays = new Set();

    meetings.forEach(meeting => {
      if (!meeting.partOf90in90) return;

      const meetingDate = new Date(meeting.date);
      if (meetingDate >= startDate && meetingDate <= endDate) {
        const dateString = meetingDate.toISOString().split('T')[0];
        uniqueDays.add(dateString);
      }
    });

    const progress = uniqueDays.size;

    ninetyInNinetyUpdates = {
      'meetingTracker.ninetyInNinety.progress': progress,
      'meetingTracker.ninetyInNinety.lastActiveDate': new Date()
    };

    // Check if 90-in-90 is now complete
    if (progress >= 90 && !ninetyInNinety.goalCompletedDate) {
      ninetyInNinetyUpdates['meetingTracker.ninetyInNinety.goalCompletedDate'] = new Date();
    }
  }

  // Update user record with calculated stats
  await db.collection('users').updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        'meetingTracker.streaks': streaks,
        'meetingTracker.totalMeetings': totalMeetings,
        'meetingTracker.meetingsThisMonth': meetingsThisMonth,
        ...ninetyInNinetyUpdates
      }
    }
  );

  return {
    streaks,
    totalMeetings,
    meetingsThisMonth,
    ninetyInNinety: {
      ...ninetyInNinety,
      ...ninetyInNinetyUpdates
    }
  };
}

/**
 * Start a new 90-in-90 challenge for a user
 * @param {string} userId User ID
 * @returns {Promise<Object>} Updated 90-in-90 tracker data
 */
export async function startNinetyInNinetyChallenge(userId) {
  if (!userId) throw new Error('User ID is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + 90);

  const ninetyInNinety = {
    active: true,
    startDate: now,
    lastActiveDate: now,
    goalCompletedDate: null,
    streakEnd90in90: endDate,
    progress: 0
  };

  // Initialize meeting tracker if it doesn't exist
  const result = await db.collection('users').updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        'meetingTracker.ninetyInNinety': ninetyInNinety,
      },
      $setOnInsert: {
        'meetingTracker.totalMeetings': 0,
        'meetingTracker.meetingsThisMonth': 0,
        'meetingTracker.streaks': {
          current: 0,
          longest: 0,
          lastMeetingDate: null
        }
      }
    },
    { upsert: true }
  );

  // Calculate initial progress based on existing meetings
  if (result.matchedCount > 0 || result.upsertedCount > 0) {
    await refreshUserMeetingStats(userId);
  }

  // Get the updated tracker data
  const user = await db.collection('users').findOne(
    { _id: new ObjectId(userId) },
    { projection: { meetingTracker: 1 } }
  );

  return user?.meetingTracker?.ninetyInNinety || ninetyInNinety;
}

/**
 * Get user's meeting tracker stats
 * @param {string} userId User ID
 * @returns {Promise<Object>} Meeting tracker stats
 */
export async function getUserMeetingTrackerStats(userId) {
  if (!userId) throw new Error('User ID is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const user = await db.collection('users').findOne(
    { _id: new ObjectId(userId) },
    { projection: { meetingTracker: 1 } }
  );

  return user?.meetingTracker || {
    ninetyInNinety: { active: false },
    streaks: { current: 0, longest: 0, lastMeetingDate: null },
    totalMeetings: 0,
    meetingsThisMonth: 0
  };
}

/**
 * Get meetings by date range
 * @param {string} userId User ID
 * @param {Date} startDate Start date
 * @param {Date} endDate End date
 * @returns {Promise<Array>} Meeting records in date range
 */
export async function getMeetingsByDateRange(userId, startDate, endDate) {
  if (!userId) throw new Error('User ID is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const meetings = await db.collection('meeting_attendances').find({
    userId: new ObjectId(userId),
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).toArray();

  return meetings;
}

/**
 * Reset a 90-in-90 challenge
 * @param {string} userId User ID
 * @returns {Promise<Object>} Updated 90-in-90 tracker data
 */
export async function resetNinetyInNinetyChallenge(userId) {
  if (!userId) throw new Error('User ID is required');

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + 90);

  const ninetyInNinety = {
    active: true,
    startDate: now,
    lastActiveDate: now,
    goalCompletedDate: null,
    streakEnd90in90: endDate,
    progress: 0
  };

  // Reset the 90-in-90 challenge
  await db.collection('users').updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        'meetingTracker.ninetyInNinety': ninetyInNinety
      }
    }
  );

  // Recalculate progress
  await refreshUserMeetingStats(userId);

  // Get updated data
  const user = await db.collection('users').findOne(
    { _id: new ObjectId(userId) },
    { projection: { meetingTracker: 1 } }
  );

  return user?.meetingTracker?.ninetyInNinety || ninetyInNinety;
}