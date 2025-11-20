/**
 * Utility functions for managing sobriety dates and calculations
 */

/**
 * Calculate the number of days between two dates
 * @param {Date|string} startDate - Start date as Date object or ISO string
 * @param {Date|string} endDate - End date as Date object or ISO string (defaults to today)
 * @returns {number} - Number of days between dates (rounded down)
 */
export function calculateDaysBetween(startDate, endDate = new Date()) {
  // Convert string dates to Date objects if needed
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);

  // Reset hours to avoid time zone issues
  const startDateReset = new Date(start);
  startDateReset.setHours(0, 0, 0, 0);

  const endDateReset = new Date(end);
  endDateReset.setHours(0, 0, 0, 0);

  // Calculate the time difference in milliseconds
  const timeDiff = endDateReset.getTime() - startDateReset.getTime();

  // Convert time difference to days
  return Math.floor(timeDiff / (1000 * 3600 * 24));
}

/**
 * Calculate the number of days sober
 * @param {Date|string} sobrietyDate - Sobriety start date as Date object or ISO string
 * @returns {number} - Number of days sober
 */
export function calculateDaysSober(sobrietyDate) {
  if (!sobrietyDate) return 0;
  return calculateDaysBetween(sobrietyDate);
}

/**
 * Format sobriety date to readable string
 * @param {Date|string} sobrietyDate - Sobriety date as Date object or ISO string
 * @returns {string} - Formatted date string (e.g., "January 1, 2023")
 */
export function formatSobrietyDate(sobrietyDate) {
  if (!sobrietyDate) return '';

  const date = sobrietyDate instanceof Date ? sobrietyDate : new Date(sobrietyDate);

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Calculate sobriety milestones (30 days, 60 days, 90 days, 6 months, 9 months, 1 year, etc.)
 * @param {Date|string} sobrietyDate - Sobriety date as Date object or ISO string
 * @returns {Array} - Array of milestone objects with days and achieved status
 */
export function calculateSobrietyMilestones(sobrietyDate) {
  if (!sobrietyDate) return [];

  const daysSober = calculateDaysSober(sobrietyDate);

  // Define common milestones in AA
  const milestones = [
    { days: 1, name: "24 Hours" },
    { days: 30, name: "30 Days" },
    { days: 60, name: "60 Days" },
    { days: 90, name: "90 Days" },
    { days: 180, name: "6 Months" },
    { days: 270, name: "9 Months" },
    { days: 365, name: "1 Year" },
    { days: 730, name: "2 Years" },
    { days: 1095, name: "3 Years" },
    { days: 1825, name: "5 Years" },
    { days: 3650, name: "10 Years" }
  ];

  // Mark milestones as achieved or not
  return milestones.map(milestone => ({
    ...milestone,
    achieved: daysSober >= milestone.days,
    daysUntil: Math.max(0, milestone.days - daysSober)
  }));
}

/**
 * Generate a description of sobriety time
 * @param {Date|string} sobrietyDate - Sobriety date as Date object or ISO string
 * @returns {string} - Human-readable description of sobriety time
 */
export function generateSobrietyTimeDescription(sobrietyDate) {
  if (!sobrietyDate) return '';

  const days = calculateDaysSober(sobrietyDate);

  if (days === 0) return 'Less than a day';
  if (days === 1) return '1 day';

  const years = Math.floor(days / 365);
  const remainingDays = days % 365;
  const months = Math.floor(remainingDays / 30);
  const remainingDaysAfterMonths = remainingDays % 30;

  let description = '';

  if (years > 0) {
    description += years === 1 ? '1 year' : `${years} years`;
  }

  if (months > 0) {
    if (description) description += ', ';
    description += months === 1 ? '1 month' : `${months} months`;
  }

  if (remainingDaysAfterMonths > 0 || (years === 0 && months === 0)) {
    if (description) description += ', ';
    description += remainingDaysAfterMonths === 1 ? '1 day' : `${remainingDaysAfterMonths} days`;
  }

  return description;
}

/**
 * Calculate detailed sobriety time measurements
 * @param {Date|string} sobrietyDate - Sobriety date as Date object or ISO string
 * @returns {Object} - Object with various time measurements (years, months, days, hours, etc.)
 */
export function calculateSobrietyDetails(sobrietyDate) {
  if (!sobrietyDate) return {
    totalDays: 0,
    totalHours: 0,
    years: 0,
    months: 0,
    days: 0,
    hours: 0
  };

  const start = sobrietyDate instanceof Date ? sobrietyDate : new Date(sobrietyDate);
  const now = new Date();

  // Total time measurements
  const totalMilliseconds = now.getTime() - start.getTime();
  const totalHours = Math.floor(totalMilliseconds / (1000 * 60 * 60));
  const totalDays = calculateDaysSober(sobrietyDate);

  // Broken down time measurements
  const years = Math.floor(totalDays / 365);
  const remainingDays = totalDays % 365;
  const months = Math.floor(remainingDays / 30);
  const days = remainingDays % 30;

  // Calculate current hours of the day passed
  const currentHour = now.getHours();
  const startHour = start.getHours();
  let hours = currentHour - startHour;
  if (hours < 0) hours += 24;

  return {
    totalDays,
    totalHours,
    years,
    months,
    days,
    hours
  };
}