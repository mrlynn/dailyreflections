/**
 * Streak Utilities
 *
 * Helper functions for managing user streaks and engagement features.
 */

/**
 * Determine if a streak is at risk of breaking
 *
 * @param {Object} streakData - User's streak data
 * @returns {boolean} - Whether the streak is at risk
 */
export function isStreakAtRisk(streakData) {
  if (!streakData || !streakData.lastEntryDate) {
    return false;
  }

  // Check if the user has already completed an entry today
  const lastEntryDate = new Date(streakData.lastEntryDate);
  const today = new Date();

  const isEntryToday =
    lastEntryDate.getDate() === today.getDate() &&
    lastEntryDate.getMonth() === today.getMonth() &&
    lastEntryDate.getFullYear() === today.getFullYear();

  // Is it past afternoon and no entry today?
  return !isEntryToday && today.getHours() >= 15 && streakData.currentStreak > 0;
}

/**
 * Check if user is approaching a milestone
 *
 * @param {Object} streakData - User's streak data
 * @returns {Object|null} - Milestone data if approaching, null otherwise
 */
export function getNextMilestone(streakData) {
  if (!streakData) return null;

  const milestoneThresholds = [3, 7, 14, 30, 60, 90, 180, 365];
  const nextMilestone = milestoneThresholds.find(t => t > streakData.currentStreak);

  if (!nextMilestone) return null;

  const daysToMilestone = nextMilestone - streakData.currentStreak;

  // Return milestone info if approaching (3 days or less)
  if (daysToMilestone <= 3) {
    return {
      threshold: nextMilestone,
      daysToGo: daysToMilestone
    };
  }

  return null;
}

/**
 * Calculate engagement score based on user's streak metrics
 *
 * @param {Object} streakData - User's streak data
 * @returns {Number} - Engagement score from 0-100
 */
export function calculateEngagementScore(streakData) {
  if (!streakData) return 0;

  // Components of engagement score
  const streakScore = Math.min(50, streakData.currentStreak * 2);
  const totalEntriesScore = Math.min(30, Math.floor(streakData.totalEntries / 3));

  // Milestones score
  const milestonesCount = streakData.milestones?.length || 0;
  const milestoneScore = Math.min(20, milestonesCount * 4);

  return Math.min(100, streakScore + totalEntriesScore + milestoneScore);
}

/**
 * Format streak duration in a human-readable way
 *
 * @param {Number} days - Number of days in streak
 * @returns {String} - Formatted streak duration
 */
export function formatStreakDuration(days) {
  if (days === 0) return "No active streak";
  if (days === 1) return "1 day";

  if (days < 7) return `${days} days`;

  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;

  if (weeks === 1) {
    return remainingDays > 0 ? `1 week, ${remainingDays} days` : "1 week";
  }

  return remainingDays > 0 ? `${weeks} weeks, ${remainingDays} days` : `${weeks} weeks`;
}

/**
 * Get appropriate messaging for the current streak status
 *
 * @param {Object} streakData - User's streak data
 * @returns {Object} - Messaging object with title and message
 */
export function getStreakMessage(streakData) {
  if (!streakData) {
    return {
      title: "Start Your Journey",
      message: "Begin your reflection practice today to start tracking your progress."
    };
  }

  if (streakData.streakHealth === 'broken') {
    return {
      title: "Rebuild Your Streak",
      message: "Every journey has setbacks. Start your inventory today to begin a new streak."
    };
  }

  if (streakData.streakHealth === 'recovering') {
    return {
      title: "Recovery in Progress",
      message: "You're rebuilding momentum. Continue your practice to strengthen your streak."
    };
  }

  // Strong streak
  if (streakData.currentStreak >= 90) {
    return {
      title: "Exceptional Consistency!",
      message: "Your dedication to daily reflection is remarkable. Keep going!"
    };
  }

  if (streakData.currentStreak >= 30) {
    return {
      title: "Solid Practice Established!",
      message: "You've built a strong habit of daily reflection. This consistency supports your recovery."
    };
  }

  if (streakData.currentStreak >= 7) {
    return {
      title: "Great Progress!",
      message: "You're building momentum with your daily practice. Keep the streak going!"
    };
  }

  return {
    title: "Building Your Streak",
    message: "Consistency is key. Continue your daily practice to see your progress grow."
  };
}

/**
 * Determine if a reminder notification should be shown
 *
 * @param {Object} streakData - User's streak data
 * @param {Object} userPreferences - User's notification preferences
 * @returns {boolean} - Whether to show a reminder
 */
export function shouldShowReminder(streakData, userPreferences = {}) {
  // Respect user preferences first
  if (userPreferences.disableReminders) return false;

  // No reminders needed if streak is broken
  if (!streakData || streakData.streakHealth === 'broken') return false;

  const now = new Date();
  const hour = now.getHours();

  // Check if entry was made today
  const lastEntryDate = streakData.lastEntryDate ? new Date(streakData.lastEntryDate) : null;
  const entryMadeToday = lastEntryDate &&
    lastEntryDate.getDate() === now.getDate() &&
    lastEntryDate.getMonth() === now.getMonth() &&
    lastEntryDate.getFullYear() === now.getFullYear();

  // If entry already made today, no reminder needed
  if (entryMadeToday) return false;

  // User preference for reminder time, defaulting to evening (18)
  const preferredReminderTime = userPreferences.reminderHour || 18;

  // Show reminder if within 1 hour of preferred time or after preferred time
  return hour >= preferredReminderTime;
}