/**
 * Journal Entry Model
 * Schema and utilities for 10th Step daily inventory entries
 */
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { updateUserStreak } from '@/lib/models/userStreak';

// Journal entry collection name
const COLLECTION_NAME = 'journal_entries';

/**
 * Journal entry schema:
 * {
 *   _id: ObjectId,
 *   userId: ObjectId,      // User who created the entry
 *   date: Date,            // Date of journal entry
 *   mood: Number,          // Mood rating (1-5)
 *   gratitude: [String],   // List of gratitude items
 *   inventory: {
 *     resentments: String, // Daily resentments
 *     fears: String,       // Daily fears
 *     honesty: String,     // Honesty check
 *     amends: String,      // Amends needed
 *     service: String,     // Service performed
 *     prayer: String       // Prayer/meditation notes
 *     selfishness: String, // Instances of selfishness
 *     dishonesty: String,  // Instances of dishonesty
 *     self_seeking: String, // Instances of self-seeking
 *     fear: String,        // Instances of fear
 *   },
 *   reflections: String,   // General reflections
 *   promises: String,      // Promises noticed
 *   improvements: String,  // Areas for improvement tomorrow
 *   assets: [String],      // Character assets displayed today
 *   tags: [String],        // Custom tags for entry
 *   entryType: String,     // "full", "quick", "check-in"
 *   isPrivate: Boolean,    // Privacy setting
 *   createdAt: Date,
 *   updatedAt: Date
 * }
 */

/**
 * Get the journal entries collection from MongoDB
 * @param {boolean} withEncryption - Whether to use encryption for this operation
 */
export async function getJournalCollection(withEncryption = false) {
  if (withEncryption) {
    // Import dynamically to avoid circular dependencies
    const { connectToDatabase } = await import('@/lib/mongodb');
    const { db } = await connectToDatabase({
      withEncryption: true,
      collection: 'journal_entries'
    });
    return db.collection(COLLECTION_NAME);
  } else {
    const client = await clientPromise;
    const db = client.db();
    return db.collection(COLLECTION_NAME);
  }
}

/**
 * Create the necessary indexes for the journal entries collection
 */
export async function createJournalIndexes() {
  const collection = await getJournalCollection();

  // Create compound index for user's entries by date
  await collection.createIndex({ userId: 1, date: -1 });

  // Create index on tags for tag-based queries
  await collection.createIndex({ tags: 1 });

  // Create text index for search functionality
  await collection.createIndex({
    reflections: 'text',
    'inventory.resentments': 'text',
    'inventory.fears': 'text',
    'inventory.honesty': 'text',
    'inventory.amends': 'text',
    'inventory.selfishness': 'text',
    'inventory.dishonesty': 'text',
    'inventory.self_seeking': 'text',
    'inventory.fear': 'text',
    promises: 'text'
  });

  console.log('Journal entry indexes created');
}

/**
 * Get journal entries for a specific user
 * @param {String} userId - The user ID
 * @param {Object} options - Query options
 * @param {Date|String} options.startDate - Start date for range query
 * @param {Date|String} options.endDate - End date for range query
 * @param {Number} options.limit - Maximum number of entries to return
 * @param {Number} options.skip - Number of entries to skip (for pagination)
 * @param {String} options.tag - Filter by tag
 * @returns {Promise<Array>} - Array of journal entries
 */
export async function getUserJournalEntries({
  userId,
  startDate = null,
  endDate = null,
  limit = 30,
  skip = 0,
  tag = null,
  sortBy = 'date',
  sortOrder = -1
} = {}) {
  if (!userId) throw new Error('User ID is required');

  // Use encryption for sensitive journal entries
  const collection = await getJournalCollection(true);

  // Base query for user's entries
  const query = { userId: new ObjectId(userId) };

  // Add date range filter if provided
  if (startDate || endDate) {
    query.date = {};
    if (startDate) {
      query.date.$gte = new Date(startDate);
    }
    if (endDate) {
      query.date.$lte = new Date(endDate);
    }
  }

  // Add tag filter if provided
  if (tag) {
    query.tags = tag;
  }

  // Set sort options
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder;

  // Execute query
  const entries = await collection
    .find(query)
    .sort(sortOptions)
    .skip(skip)
    .limit(limit)
    .toArray();

  // Log query results for debugging
  console.log(`[Journal Entry] Query returned ${entries.length} entries for user ${userId}`);
  if (entries.length > 0) {
    console.log(`[Journal Entry] Sample entry date type: ${typeof entries[0].date}, value: ${entries[0].date}`);
  }

  return entries;
}

/**
 * Get a single journal entry by ID
 * @param {String} id - The entry ID
 * @param {String} userId - The user ID (for security check)
 * @returns {Promise<Object|null>} - The journal entry or null if not found
 */
export async function getJournalEntryById(id, userId) {
  if (!id) throw new Error('Entry ID is required');

  // Use encryption for sensitive journal entries
  const collection = await getJournalCollection(true);
  const query = {
    _id: new ObjectId(id)
  };

  // If userId provided, ensure entry belongs to that user (security)
  if (userId) {
    query.userId = new ObjectId(userId);
  }

  return collection.findOne(query);
}

/**
 * Get a journal entry by date for a specific user
 * @param {String} userId - The user ID
 * @param {Date|String} date - The entry date
 * @returns {Promise<Object|null>} - The journal entry or null if not found
 */
export async function getJournalEntryByDate(userId, date) {
  if (!userId) throw new Error('User ID is required');
  if (!date) throw new Error('Date is required');

  // Use encryption for sensitive journal entries
  const collection = await getJournalCollection(true);

  // Convert string date to Date object if needed
  const queryDate = typeof date === 'string' ? new Date(date) : date;

  // Set time to beginning of day for the query
  const startDate = new Date(queryDate);
  startDate.setHours(0, 0, 0, 0);

  // Set time to end of day for the query
  const endDate = new Date(queryDate);
  endDate.setHours(23, 59, 59, 999);

  return collection.findOne({
    userId: new ObjectId(userId),
    date: {
      $gte: startDate,
      $lte: endDate
    }
  });
}

/**
 * Create a new journal entry
 * @param {Object} entry - The journal entry to create
 * @returns {Promise<Object>} - The created journal entry
 */
export async function createJournalEntry(entry) {
  if (!entry.userId) throw new Error('User ID is required');
  if (!entry.date) throw new Error('Date is required');

  // Use encryption for sensitive journal entries
  const collection = await getJournalCollection(true);

  // Set timestamps
  const now = new Date();
  entry.createdAt = now;
  entry.updatedAt = now;

  // Convert userId to ObjectId
  entry.userId = new ObjectId(entry.userId);

  // Convert date string to Date object if needed
  // Handle both ISO date strings (YYYY-MM-DD) and Date objects
  if (typeof entry.date === 'string') {
    // If it's a date string like "2024-01-15", create a Date object
    // Set to beginning of day to ensure consistent querying
    const dateObj = new Date(entry.date);
    if (isNaN(dateObj.getTime())) {
      throw new Error(`Invalid date format: ${entry.date}`);
    }
    dateObj.setHours(0, 0, 0, 0);
    entry.date = dateObj;
  } else if (entry.date instanceof Date) {
    // If it's already a Date, normalize to beginning of day
    entry.date.setHours(0, 0, 0, 0);
  } else {
    throw new Error(`Date must be a string or Date object, got: ${typeof entry.date}`);
  }
  
  // Log for debugging (remove in production if needed)
  console.log(`[Journal Entry] Creating entry with date: ${entry.date.toISOString()} for user: ${entry.userId}`);

  // Default values
  entry.isPrivate = entry.isPrivate !== false; // Private by default
  entry.entryType = entry.entryType || 'full';
  entry.mood = entry.mood || 3; // Neutral mood
  entry.gratitude = entry.gratitude || [];
  entry.tags = entry.tags || [];

  // Ensure inventory structure
  entry.inventory = entry.inventory || {
    resentments: '',
    fears: '',
    honesty: '',
    amends: '',
    service: '',
    prayer: '',
    selfishness: '',
    dishonesty: '',
    self_seeking: '',
    fear: ''
  };

  const result = await collection.insertOne(entry);
  const createdEntry = { ...entry, _id: result.insertedId };

  try {
    // Determine journal type based on entry content
    // Default to 'step10' for 10th step inventory
    const journalType = entry.tags && entry.tags.includes('gratitude') ? 'gratitude' : 'step10';

    // Update the user's streak with this new entry
    await updateUserStreak(
      entry.userId.toString(),
      result.insertedId.toString(),
      journalType
    );

    // Note: We're not awaiting this to avoid slowing down the response
    // If streak update fails, it won't affect the journal entry creation
  } catch (streakError) {
    // Log error but don't fail the entry creation
    console.error('Error updating streak:', streakError);
  }

  return createdEntry;
}

/**
 * Update an existing journal entry
 * @param {String} id - The entry ID
 * @param {Object} updates - The updates to apply
 * @param {String} userId - The user ID (for security check)
 * @returns {Promise<Object>} - The updated journal entry
 */
export async function updateJournalEntry(id, updates, userId) {
  if (!id) throw new Error('Entry ID is required');

  // Use encryption for sensitive journal entries
  const collection = await getJournalCollection(true);

  // Verify the entry exists and belongs to the user
  const existingEntry = await getJournalEntryById(id, userId);
  if (!existingEntry) {
    throw new Error('Journal entry not found or access denied');
  }

  // Set updated timestamp
  updates.updatedAt = new Date();

  // Remove fields that shouldn't be updated
  delete updates._id;
  delete updates.userId;
  delete updates.createdAt;

  await collection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updates }
  );

  return getJournalEntryById(id, userId);
}

/**
 * Delete a journal entry
 * @param {String} id - The entry ID
 * @param {String} userId - The user ID (for security check)
 * @returns {Promise<Boolean>} - True if successful
 */
export async function deleteJournalEntry(id, userId) {
  if (!id) throw new Error('Entry ID is required');
  if (!userId) throw new Error('User ID is required');

  const collection = await getJournalCollection();

  const result = await collection.deleteOne({
    _id: new ObjectId(id),
    userId: new ObjectId(userId)
  });

  return result.deletedCount === 1;
}

/**
 * Get mood statistics for a user
 * @param {String} userId - The user ID
 * @param {Object} options - Query options
 * @param {Date|String} options.startDate - Start date for range query
 * @param {Date|String} options.endDate - End date for range query
 * @returns {Promise<Object>} - Mood statistics
 */
export async function getUserMoodStats(userId, { startDate = null, endDate = null } = {}) {
  if (!userId) throw new Error('User ID is required');

  const collection = await getJournalCollection();

  // Base match stage for user's entries
  const match = { userId: new ObjectId(userId) };

  // Add date range filter if provided
  if (startDate || endDate) {
    match.date = {};
    if (startDate) {
      match.date.$gte = new Date(startDate);
    }
    if (endDate) {
      match.date.$lte = new Date(endDate);
    }
  }

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: null,
        entries: { $sum: 1 },
        avgMood: { $avg: '$mood' },
        moodDistribution: {
          $push: '$mood'
        },
        dates: {
          $push: {
            date: '$date',
            mood: '$mood'
          }
        }
      }
    }
  ];

  const results = await collection.aggregate(pipeline).toArray();

  if (results.length === 0) {
    return {
      entries: 0,
      avgMood: 0,
      moodDistribution: {
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0
      },
      moodTrend: []
    };
  }

  const stats = results[0];

  // Process mood distribution
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  stats.moodDistribution.forEach(mood => {
    if (mood >= 1 && mood <= 5) {
      distribution[mood] = (distribution[mood] || 0) + 1;
    }
  });

  // Process mood trend data (for charts)
  const trendData = stats.dates
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(item => ({
      date: item.date,
      mood: item.mood
    }));

  return {
    entries: stats.entries,
    avgMood: parseFloat(stats.avgMood.toFixed(2)),
    moodDistribution: distribution,
    moodTrend: trendData
  };
}

/**
 * Get tag statistics for a user
 * @param {String} userId - The user ID
 * @returns {Promise<Array>} - Array of tag stats objects
 */
export async function getUserTagStats(userId) {
  if (!userId) throw new Error('User ID is required');

  const collection = await getJournalCollection();

  const pipeline = [
    { $match: { userId: new ObjectId(userId) } },
    { $unwind: '$tags' },
    {
      $group: {
        _id: '$tags',
        count: { $sum: 1 },
        avgMood: { $avg: '$mood' }
      }
    },
    { $sort: { count: -1 } }
  ];

  const results = await collection.aggregate(pipeline).toArray();

  return results.map(item => ({
    tag: item._id,
    count: item.count,
    avgMood: parseFloat(item.avgMood.toFixed(2))
  }));
}

/**
 * Get entry count by day of week
 * @param {String} userId - The user ID
 * @returns {Promise<Object>} - Count by day of week
 */
export async function getEntriesByDayOfWeek(userId) {
  if (!userId) throw new Error('User ID is required');

  const collection = await getJournalCollection();

  const pipeline = [
    { $match: { userId: new ObjectId(userId) } },
    {
      $group: {
        _id: { $dayOfWeek: '$date' }, // 1 = Sunday, 2 = Monday, etc.
        count: { $sum: 1 },
        avgMood: { $avg: '$mood' }
      }
    },
    { $sort: { _id: 1 } }
  ];

  const results = await collection.aggregate(pipeline).toArray();

  // Convert to days of week
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayStats = {};

  daysOfWeek.forEach((day, index) => {
    const dayData = results.find(item => item._id === index + 1);
    dayStats[day] = dayData
      ? { count: dayData.count, avgMood: parseFloat(dayData.avgMood.toFixed(2)) }
      : { count: 0, avgMood: 0 };
  });

  return dayStats;
}

/**
 * Get streak information (consecutive days with entries)
 * @param {String} userId - The user ID
 * @returns {Promise<Object>} - Streak information
 */
export async function getUserStreakInfo(userId) {
  if (!userId) throw new Error('User ID is required');

  const collection = await getJournalCollection();

  // Get all entry dates for the user, sorted by date
  const entries = await collection
    .find({ userId: new ObjectId(userId) }, { projection: { date: 1 } })
    .sort({ date: -1 })
    .toArray();

  if (entries.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastEntryDate: null
    };
  }

  // Format dates to remove time component (YYYY-MM-DD)
  const formatDate = date => new Date(date).toISOString().split('T')[0];

  // Get unique entry dates (in case of multiple entries per day)
  const uniqueDates = [...new Set(entries.map(entry => formatDate(entry.date)))].sort((a, b) =>
    new Date(b) - new Date(a)
  );

  const today = formatDate(new Date());
  const yesterday = formatDate(new Date(Date.now() - 86400000)); // 24 hours ago

  let currentStreak = 0;
  let streakActive = false;

  // Check if the streak is still active
  if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
    streakActive = true;

    // Calculate current streak
    const checkDate = new Date();
    let consecutiveDays = 0;

    while (true) {
      const dateToCheck = formatDate(checkDate);
      if (uniqueDates.includes(dateToCheck)) {
        consecutiveDays++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    currentStreak = consecutiveDays;
  }

  // Calculate longest streak
  let longestStreak = 0;
  let currentRunStreak = 1;

  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const currentDate = new Date(uniqueDates[i]);
    const nextDate = new Date(uniqueDates[i + 1]);

    // Check if dates are consecutive
    const diffDays = Math.round((currentDate - nextDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day
      currentRunStreak++;
    } else {
      // Break in streak
      longestStreak = Math.max(longestStreak, currentRunStreak);
      currentRunStreak = 1;
    }
  }

  // Check final run
  longestStreak = Math.max(longestStreak, currentRunStreak);

  // If current streak is active and longer than calculated longest, update longest
  if (streakActive && currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  return {
    currentStreak: streakActive ? currentStreak : 0,
    longestStreak,
    lastEntryDate: new Date(uniqueDates[0])
  };
}