/**
 * Date utility functions for Daily Reflections app
 */

/**
 * Format date to "MM-DD" string
 * @param {Date} date - Date object or today's date
 * @returns {string} "MM-DD" format
 */
export function getDateKey(date = new Date()) {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${month}-${day}`;
}

/**
 * Get today's date key in America/New_York timezone
 * @returns {string} "MM-DD" format
 */
export function getTodayKey() {
  const dateStr = new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: '2-digit',
    day: '2-digit',
  });
  return dateStr.replace('/', '-');
}

/**
 * Parse dateKey to month and day
 * @param {string} dateKey - "MM-DD" format
 * @returns {object} { month, day }
 */
export function parseDateKey(dateKey) {
  const [month, day] = dateKey.split('-').map(Number);
  return { month, day };
}

/**
 * Get yesterday's date key
 * @returns {string} "MM-DD" format
 */
export function getYesterdayKey() {
  const today = new Date();
  today.setDate(today.getDate() - 1);
  return getDateKey(today);
}

/**
 * Get tomorrow's date key
 * @returns {string} "MM-DD" format
 */
export function getTomorrowKey() {
  const today = new Date();
  today.setDate(today.getDate() + 1);
  return getDateKey(today);
}

/**
 * Format dateKey to readable string
 * @param {string} dateKey - "MM-DD" format
 * @returns {string} "Month Day" format (e.g., "January 8")
 */
export function formatDateKey(dateKey) {
  const { month, day } = parseDateKey(dateKey);
  const date = new Date(2024, month - 1, day); // Use 2024 as base year
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

/**
 * Parse natural language date references from user queries
 * Supports formats like: "January 1st", "Jan 1", "01-01", "1/1",
 * as well as relative dates like "today", "yesterday", "tomorrow"
 * @param {string} query - User query text
 * @returns {string|null} - DateKey in "MM-DD" format or null if no date found
 */
export function parseDateFromQuery(query) {
  const text = query.toLowerCase().trim();

  // Pattern 0: Check for relative date references
  const todayPattern = /\b(today|today['']?s|current|this)\b/i;
  const yesterdayPattern = /\b(yesterday|yesterday['']?s|previous)\b/i;
  const tomorrowPattern = /\b(tomorrow|tomorrow['']?s|next)\b/i;

  // Check for "today's reflection", "current reflection", "this reflection" etc.
  if (todayPattern.test(text) && /\b(reflection|reading|message|daily)\b/i.test(text)) {
    return getTodayKey();
  }

  // Check for "yesterday's reflection"
  if (yesterdayPattern.test(text) && /\b(reflection|reading|message|daily)\b/i.test(text)) {
    return getYesterdayKey();
  }

  // Check for "tomorrow's reflection"
  if (tomorrowPattern.test(text) && /\b(reflection|reading|message|daily)\b/i.test(text)) {
    return getTomorrowKey();
  }

  // Full month names
  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];

  // Abbreviated month names
  const monthAbbrevs = [
    'jan', 'feb', 'mar', 'apr', 'may', 'jun',
    'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec'
  ];

  // Pattern 1: "MM-DD" format (e.g., "01-01")
  const mmddPattern = /(\d{1,2})-(\d{1,2})/;
  const mmddMatch = text.match(mmddPattern);
  if (mmddMatch) {
    const month = parseInt(mmddMatch[1], 10);
    const day = parseInt(mmddMatch[2], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // Pattern 2: "M/D" or "MM/DD" format (e.g., "1/1", "01/01")
  const slashPattern = /\b(\d{1,2})\/(\d{1,2})\b/;
  const slashMatch = text.match(slashPattern);
  if (slashMatch) {
    const month = parseInt(slashMatch[1], 10);
    const day = parseInt(slashMatch[2], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // Pattern 3: Full month name + day (e.g., "January 1st", "January 1", "january 1st")
  for (let i = 0; i < monthNames.length; i++) {
    const monthName = monthNames[i];
    const regex = new RegExp(`\\b${monthName}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'i');
    const match = text.match(regex);
    if (match) {
      const day = parseInt(match[1], 10);
      if (day >= 1 && day <= 31) {
        const month = i + 1;
        return `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
  }

  // Pattern 4: Abbreviated month + day (e.g., "Jan 1st", "Jan 1", "jan 1")
  for (let i = 0; i < monthAbbrevs.length; i++) {
    const monthAbbrev = monthAbbrevs[i];
    const regex = new RegExp(`\\b${monthAbbrev}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'i');
    const match = text.match(regex);
    if (match) {
      const day = parseInt(match[1], 10);
      if (day >= 1 && day <= 31) {
        // Map abbreviation index to month number
        // Jan=1, Feb=2, Mar=3, Apr=4, May=5, Jun=6,
        // Jul=7, Aug=8, Sep=9, Sept=9, Oct=10, Nov=11, Dec=12
        let month;
        if (i < 9) {
          month = i + 1; // Jan through Sep
        } else if (i === 9) {
          month = 9; // Sept (duplicate of Sep)
        } else {
          month = i; // Oct, Nov, Dec (after Sept)
        }
        return `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
  }

  return null;
}

