/**
 * User Streak Model
 * Enhanced tracking and gamification for 10th step journal entries
 */
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

// Collection name
const COLLECTION_NAME = 'user_streaks';

/**
 * User streak schema for MongoDB native driver:
 * {
 *   _id: ObjectId,
 *   userId: ObjectId,               // User ID
 *   currentStreak: Number,          // Current active streak count
 *   longestStreak: Number,          // Longest streak ever achieved
 *   totalEntries: Number,           // Total entries made
 *   lastEntryDate: Date,            // Date of the last entry
 *   streakFreezes: Number,          // Available streak freezes
 *   streakHealth: String,           // 'strong', 'recovering', 'broken'
 *   journalType: String,            // 'step10', 'journal', 'gratitude'
 *   visualProgress: {               // Visual representation data
 *     stage: Number,                // Current visual stage (1-5)
 *     pathPosition: Number,         // Position on path (0-100)
 *     unlockedElements: [String]    // Unlocked visual elements
 *   },
 *   milestones: [{                  // Achievement milestones
 *     type: String,                 // 'streak', 'consistency', 'honesty'
 *     threshold: Number,            // Value that triggered milestone
 *     achievedAt: Date,             // When it was achieved
 *     title: String,                // Milestone title
 *     description: String,          // Milestone description
 *     viewed: Boolean               // Whether user has viewed it
 *   }],
 *   streakHistory: [{               // Daily streak data
 *     date: Date,                   // Entry date
 *     completed: Boolean,           // Whether entry was made
 *     entryId: ObjectId,            // Reference to entry
 *     recoveryUsed: Boolean,        // Whether recovery was used
 *     recoveryReason: String        // If recovery used, reason why
 *   }],
 *   recoveryGrace: {                // Grace period settings
 *     availableRecoveries: Number,  // Number of recoveries available
 *     lastRecoveryUsed: Date,       // When last recovery was used
 *     nextRecoveryAt: Date          // When next recovery will be available
 *   },
 *   createdAt: Date,                // Creation timestamp
 *   updatedAt: Date                 // Last update timestamp
 * }
 */

/**
 * Get the user streaks collection
 */
export async function getStreaksCollection() {
  const client = await clientPromise;
  const db = client.db();
  return db.collection(COLLECTION_NAME);
}

/**
 * Create the necessary indexes for the user streaks collection
 */
export async function createStreakIndexes() {
  const collection = await getStreaksCollection();

  // Create index on userId for fast lookups
  await collection.createIndex({ userId: 1 });

  // Create index on userId + journalType for filtered queries
  await collection.createIndex({ userId: 1, journalType: 1 });

  // Create index on streakHistory.date for date-based queries
  await collection.createIndex({ 'streakHistory.date': 1 });

  console.log('User streak indexes created');
}

/**
 * Get a user's streak information
 * @param {string} userId - The user ID
 * @param {string} journalType - Type of journal ('step10', 'journal', 'gratitude')
 */
export async function getUserStreak(userId, journalType = 'step10') {
  if (!userId) throw new Error('User ID is required');

  const collection = await getStreaksCollection();

  // Find user streak for the specified journal type
  const streak = await collection.findOne({
    userId: new ObjectId(userId),
    journalType
  });

  if (!streak) {
    // No streak record exists yet, return default values
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalEntries: 0,
      streakHealth: 'strong',
      lastEntryDate: null,
      visualProgress: {
        stage: 1,
        pathPosition: 0,
        unlockedElements: []
      },
      streakFreezes: 1, // Start with one freeze
      recoveryGrace: {
        availableRecoveries: 1,
        nextRecoveryAt: null
      },
      milestones: [],
      streakHistory: []
    };
  }

  return streak;
}

/**
 * Update a user's streak based on a new journal entry
 *
 * @param {string} userId - The user ID
 * @param {string} entryId - The journal entry ID
 * @param {string} journalType - The journal type
 * @returns {Object} - Updated streak information
 */
export async function updateUserStreak(userId, entryId, journalType = 'step10') {
  if (!userId) throw new Error('User ID is required');
  if (!entryId) throw new Error('Entry ID is required');

  const collection = await getStreaksCollection();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the user's streak record
  let userStreak = await getUserStreak(userId, journalType);
  const isNewStreak = !userStreak._id;

  // Get the date of the last entry
  const lastEntryDate = userStreak.lastEntryDate ? new Date(userStreak.lastEntryDate) : null;
  if (lastEntryDate) {
    lastEntryDate.setHours(0, 0, 0, 0);
  }

  // Check if an entry was already made today
  const madeEntryToday = lastEntryDate &&
    lastEntryDate.getFullYear() === today.getFullYear() &&
    lastEntryDate.getMonth() === today.getMonth() &&
    lastEntryDate.getDate() === today.getDate();

  if (madeEntryToday) {
    // Already made an entry today, just update the entry ID and total entries
    if (!userStreak.streakHistory.some(history =>
      new Date(history.date).toDateString() === today.toDateString()
    )) {
      userStreak.streakHistory.push({
        date: today,
        completed: true,
        entryId: new ObjectId(entryId)
      });
    }

    // Update total entries if this is a new entry
    userStreak.totalEntries = (userStreak.totalEntries || 0) + 1;

    const updateData = {
      $set: {
        lastEntryDate: today,
        totalEntries: userStreak.totalEntries,
        updatedAt: new Date()
      },
      $push: {
        streakHistory: {
          date: today,
          completed: true,
          entryId: new ObjectId(entryId)
        }
      }
    };

    if (isNewStreak) {
      // If this is a new streak record, insert it
      const newStreak = {
        userId: new ObjectId(userId),
        journalType,
        currentStreak: 1,
        longestStreak: 1,
        totalEntries: 1,
        lastEntryDate: today,
        streakHealth: 'strong',
        streakFreezes: 1,
        visualProgress: {
          stage: 1,
          pathPosition: 0,
          unlockedElements: []
        },
        milestones: [],
        streakHistory: [{
          date: today,
          completed: true,
          entryId: new ObjectId(entryId)
        }],
        recoveryGrace: {
          availableRecoveries: 1,
          lastRecoveryUsed: null,
          nextRecoveryAt: null
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await collection.insertOne(newStreak);
      userStreak = { ...newStreak, _id: result.insertedId };
    } else {
      // Update the existing streak
      await collection.updateOne(
        { _id: userStreak._id },
        updateData
      );
    }

    return userStreak;
  }

  // Calculate new streak values
  let { currentStreak, longestStreak, streakHealth } = userStreak;

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (!lastEntryDate) {
    // First entry ever
    currentStreak = 1;
    longestStreak = 1;
    streakHealth = 'strong';
  } else if (
    lastEntryDate.getFullYear() === yesterday.getFullYear() &&
    lastEntryDate.getMonth() === yesterday.getMonth() &&
    lastEntryDate.getDate() === yesterday.getDate()
  ) {
    // Entry was made yesterday, streak continues
    currentStreak += 1;
    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }
    streakHealth = 'strong';
  } else if (
    lastEntryDate < yesterday
  ) {
    // Streak was broken
    // Check if user has a streak freeze available
    if (userStreak.streakFreezes > 0) {
      // Use a streak freeze automatically to maintain streak
      currentStreak += 1;
      streakHealth = 'recovering';

      // Add entry for the missed day using a freeze
      const missedDay = new Date(yesterday);
      userStreak.streakHistory.push({
        date: missedDay,
        completed: false,
        recoveryUsed: true,
        recoveryReason: 'automatic_freeze'
      });

      // Decrement available freezes
      userStreak.streakFreezes -= 1;
    } else {
      // Streak is broken
      currentStreak = 1;
      streakHealth = 'broken';
    }
  }

  // Check for milestones
  const newMilestones = calculateMilestones(userStreak, currentStreak);

  // Update visual progress
  const visualProgress = calculateVisualProgress(currentStreak, userStreak.visualProgress);

  // Update the streak record
  const updateData = {
    $set: {
      currentStreak,
      longestStreak,
      lastEntryDate: today,
      streakHealth,
      visualProgress,
      totalEntries: (userStreak.totalEntries || 0) + 1,
      streakFreezes: userStreak.streakFreezes,
      updatedAt: new Date()
    },
    $push: {
      streakHistory: {
        date: today,
        completed: true,
        entryId: new ObjectId(entryId)
      }
    }
  };

  // Add milestones if any new ones were achieved
  if (newMilestones.length > 0) {
    if (!updateData.$push) {
      updateData.$push = {};
    }
    updateData.$push.milestones = { $each: newMilestones };
  }

  if (isNewStreak) {
    // If this is a new streak record, insert it
    const newStreak = {
      userId: new ObjectId(userId),
      journalType,
      currentStreak,
      longestStreak,
      totalEntries: 1,
      lastEntryDate: today,
      streakHealth,
      streakFreezes: 1,
      visualProgress,
      milestones: newMilestones,
      streakHistory: [{
        date: today,
        completed: true,
        entryId: new ObjectId(entryId)
      }],
      recoveryGrace: {
        availableRecoveries: 1,
        lastRecoveryUsed: null,
        nextRecoveryAt: null
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(newStreak);
    userStreak = { ...newStreak, _id: result.insertedId };
  } else {
    // Update the existing streak
    await collection.updateOne(
      { _id: userStreak._id },
      updateData
    );

    // Update the local object with new values
    userStreak = {
      ...userStreak,
      currentStreak,
      longestStreak,
      lastEntryDate: today,
      streakHealth,
      visualProgress,
      totalEntries: (userStreak.totalEntries || 0) + 1,
      streakHistory: [
        ...userStreak.streakHistory,
        {
          date: today,
          completed: true,
          entryId: new ObjectId(entryId)
        }
      ]
    };

    if (newMilestones.length > 0) {
      userStreak.milestones = [
        ...(userStreak.milestones || []),
        ...newMilestones
      ];
    }
  }

  return userStreak;
}

/**
 * Calculate milestones based on streak data
 *
 * @param {Object} userStreak - User's streak data
 * @param {Number} currentStreak - Current streak count
 * @returns {Array} - New milestones achieved
 */
function calculateMilestones(userStreak, currentStreak) {
  const newMilestones = [];
  const existingMilestones = userStreak.milestones || [];

  // Define streak milestones thresholds
  const streakMilestones = [3, 7, 14, 30, 60, 90, 180, 365];

  // Check for streak milestones
  for (const threshold of streakMilestones) {
    // Check if current streak just reached or passed this threshold
    if (currentStreak >= threshold &&
        !existingMilestones.some(m => m.type === 'streak' && m.threshold === threshold)) {

      // Define milestone title and description based on threshold
      let title, description;

      switch(threshold) {
        case 3:
          title = 'First Steps';
          description = 'You\'ve reflected for 3 days in a row. The journey of recovery begins with consistent self-examination.';
          break;
        case 7:
          title = 'One Week Strong';
          description = 'A full week of daily inventory! Your commitment to honest self-reflection is growing.';
          break;
        case 14:
          title = 'Two Week Milestone';
          description = 'Two weeks of daily reflection shows your dedication to personal growth and continuous improvement.';
          break;
        case 30:
          title = 'Monthly Commitment';
          description = 'A month of daily inventory! You\'re developing a powerful habit of self-awareness.';
          break;
        case 60:
          title = 'Sixty Day Serenity';
          description = 'Two months of consistent reflection shows your commitment to living the principles.';
          break;
        case 90:
          title = 'Ninety Day Triumph';
          description = 'Three months of daily inventory - a significant achievement in recovery!';
          break;
        case 180:
          title = 'Half Year Harmony';
          description = 'Six months of consistent self-examination. Your commitment to personal growth is inspiring.';
          break;
        case 365:
          title = 'Full Year of Freedom';
          description = 'A full year of daily inventory! Your dedication to the principles of recovery is truly remarkable.';
          break;
        default:
          title = `${threshold} Day Milestone`;
          description = `You've maintained your daily inventory practice for ${threshold} consecutive days!`;
      }

      newMilestones.push({
        type: 'streak',
        threshold,
        achievedAt: new Date(),
        title,
        description,
        viewed: false
      });
    }
  }

  // Check for total entries milestones
  const entriesMilestones = [10, 25, 50, 100, 250, 500, 1000];
  const totalEntries = (userStreak.totalEntries || 0) + 1;

  for (const threshold of entriesMilestones) {
    if (totalEntries >= threshold &&
        !existingMilestones.some(m => m.type === 'entries' && m.threshold === threshold)) {

      newMilestones.push({
        type: 'entries',
        threshold,
        achievedAt: new Date(),
        title: `${threshold} Reflections`,
        description: `You've completed ${threshold} total inventory entries. Each one is a step toward greater self-awareness.`,
        viewed: false
      });
    }
  }

  return newMilestones;
}

/**
 * Calculate visual progress based on streak
 *
 * @param {Number} currentStreak - Current streak count
 * @param {Object} currentProgress - Current visual progress
 * @returns {Object} - Updated visual progress
 */
function calculateVisualProgress(currentStreak, currentProgress = { stage: 1, pathPosition: 0 }) {
  // Define thresholds for different visual stages
  const stageThresholds = [1, 7, 30, 90, 180, 365];

  // Calculate current stage
  let stage = 1;
  for (let i = stageThresholds.length - 1; i >= 0; i--) {
    if (currentStreak >= stageThresholds[i]) {
      stage = i + 1;
      break;
    }
  }

  // Calculate position within current stage
  let pathPosition = 0;
  if (stage < stageThresholds.length) {
    const currentThreshold = stageThresholds[stage - 1];
    const nextThreshold = stageThresholds[stage];
    const progress = currentStreak - currentThreshold;
    const range = nextThreshold - currentThreshold;
    pathPosition = Math.min(100, Math.floor((progress / range) * 100));
  } else {
    // Max stage reached
    pathPosition = 100;
  }

  // Calculate unlocked elements
  const unlockedElements = [];

  // Add basic elements based on streak milestones
  if (currentStreak >= 3) unlockedElements.push('path_start');
  if (currentStreak >= 7) unlockedElements.push('tree_sapling');
  if (currentStreak >= 14) unlockedElements.push('bridge');
  if (currentStreak >= 30) unlockedElements.push('tree_growing');
  if (currentStreak >= 60) unlockedElements.push('waterfall');
  if (currentStreak >= 90) unlockedElements.push('tree_mature');
  if (currentStreak >= 180) unlockedElements.push('flower_garden');
  if (currentStreak >= 365) unlockedElements.push('serenity_lake');

  return {
    stage,
    pathPosition,
    unlockedElements
  };
}

/**
 * Recover a broken streak
 *
 * @param {string} userId - The user ID
 * @param {string} journalType - Journal type
 * @param {string} recoveryReason - Reason for recovery
 * @returns {Object} - Updated streak information
 */
export async function recoverUserStreak(userId, journalType = 'step10', recoveryReason) {
  if (!userId) throw new Error('User ID is required');

  const collection = await getStreaksCollection();

  // Find the user's streak record
  let userStreak = await getUserStreak(userId, journalType);

  // If no streak or streak is not broken, return error
  if (!userStreak._id) {
    throw new Error('No streak found to recover');
  }

  if (userStreak.streakHealth !== 'broken') {
    throw new Error('Streak is not broken and does not need recovery');
  }

  // Check if user has recoveries available
  if (!userStreak.recoveryGrace || userStreak.recoveryGrace.availableRecoveries <= 0) {
    throw new Error('No recovery options available');
  }

  // Apply recovery - restore streak to previous count if possible
  // Find the last continuous sequence before the break
  const sortedHistory = [...(userStreak.streakHistory || [])]
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // If history is empty or too short, set a default recovered streak
  let recoveredStreak = 1;
  let streakBreakDate = null;

  if (sortedHistory.length > 0) {
    // Find the last continuous sequence
    let lastDate = new Date(sortedHistory[0].date);
    let sequenceLength = 1;

    for (let i = 1; i < sortedHistory.length; i++) {
      const currentDate = new Date(sortedHistory[i].date);
      const diffDays = Math.round((lastDate - currentDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 1 || (diffDays === 0 && sortedHistory[i].completed)) {
        // Continuous sequence
        sequenceLength++;
        lastDate = currentDate;
      } else {
        // Break in sequence found
        streakBreakDate = currentDate;
        break;
      }
    }

    recoveredStreak = sequenceLength;
  }

  // Update streak record
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Add recovery entry for yesterday
  const recoveryEntry = {
    date: yesterday,
    completed: false,
    recoveryUsed: true,
    recoveryReason: recoveryReason || 'manual_recovery'
  };

  // Update streak in database
  await collection.updateOne(
    { _id: userStreak._id },
    {
      $set: {
        currentStreak: recoveredStreak,
        streakHealth: 'recovering',
        'recoveryGrace.availableRecoveries': userStreak.recoveryGrace.availableRecoveries - 1,
        'recoveryGrace.lastRecoveryUsed': today,
        'recoveryGrace.nextRecoveryAt': new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days later
        updatedAt: today
      },
      $push: {
        streakHistory: recoveryEntry
      }
    }
  );

  // Get updated streak info
  const updatedStreak = await getUserStreak(userId, journalType);
  return updatedStreak;
}

/**
 * Award a streak freeze to a user
 *
 * @param {string} userId - The user ID
 * @param {string} journalType - Journal type
 * @returns {Object} - Updated streak information
 */
export async function awardStreakFreeze(userId, journalType = 'step10') {
  if (!userId) throw new Error('User ID is required');

  const collection = await getStreaksCollection();

  // Find the user's streak record
  let userStreak = await getUserStreak(userId, journalType);

  if (!userStreak._id) {
    // No streak record yet, create one with a freeze
    const newStreak = {
      userId: new ObjectId(userId),
      journalType,
      currentStreak: 0,
      longestStreak: 0,
      totalEntries: 0,
      streakHealth: 'strong',
      streakFreezes: 1,
      visualProgress: {
        stage: 1,
        pathPosition: 0,
        unlockedElements: []
      },
      milestones: [],
      streakHistory: [],
      recoveryGrace: {
        availableRecoveries: 1,
        lastRecoveryUsed: null,
        nextRecoveryAt: null
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(newStreak);
    return { ...newStreak, _id: result.insertedId };
  }

  // Update streak record to add a freeze
  await collection.updateOne(
    { _id: userStreak._id },
    {
      $inc: { streakFreezes: 1 },
      $set: { updatedAt: new Date() }
    }
  );

  // Get updated streak info
  return getUserStreak(userId, journalType);
}