/**
 * System configuration key constants
 *
 * This file contains all the configuration keys used throughout the application
 */

// Chat system configuration keys
export const CHAT_CONFIG = {
  // Volunteer welcome message when joining a chat
  VOLUNTEER_WELCOME_MESSAGE: 'chat.volunteer_welcome_message',

  // Default waiting message for users in queue
  USER_WAITING_MESSAGE: 'chat.user_waiting_message',

  // Auto-close chat session after inactivity (minutes)
  SESSION_INACTIVITY_TIMEOUT: 'chat.session_inactivity_timeout',

  // Maximum waiting time before notifying admins (minutes)
  MAX_WAIT_TIME_ALERT: 'chat.max_wait_time_alert',
};

// System-wide configuration keys
export const SYSTEM_CONFIG = {
  // Site maintenance mode
  MAINTENANCE_MODE: 'system.maintenance_mode',

  // Site announcement message
  ANNOUNCEMENT_MESSAGE: 'system.announcement_message',

  // Feature flags
  FEATURE_FLAGS: 'system.feature_flags',
};

// User-related configuration keys
export const USER_CONFIG = {
  // Default user settings
  DEFAULT_USER_SETTINGS: 'user.default_settings',

  // Password policy
  PASSWORD_POLICY: 'user.password_policy',
};