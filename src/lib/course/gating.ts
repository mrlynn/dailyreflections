/**
 * Gating Logic for Course System
 *
 * Determines which modules and lessons are accessible to a user
 * based on their sobriety days, meeting attendance, and completed lessons.
 */

import { Module, UserContext } from "./types";

/**
 * Determines if a user can access a specific module based on gating rules.
 *
 * @param module - The module to check access for
 * @param userContext - User's current context (sobriety, meetings, completed lessons)
 * @returns true if the user can access this module, false otherwise
 */
export function canAccessModule(
  module: Module,
  userContext: UserContext
): boolean {
  const { sobrietyDays, meetingsAttended, completedLessonIds } = userContext;

  // ============================================================================
  // SOBRIETY DAYS GATING
  // ============================================================================

  // Check minimum sobriety days requirement
  if (typeof module.minSobrietyDays === "number") {
    // If user has no sobriety date and module requires ANY sobriety days, allow access
    // (newcomers without date set should still access day 0 content)
    if (sobrietyDays === null) {
      // Allow access to modules with minSobrietyDays of 0
      if (module.minSobrietyDays > 0) {
        return false;
      }
    } else if (sobrietyDays < module.minSobrietyDays) {
      return false;
    }
  }

  // Check maximum sobriety days requirement
  // (used for modules that are only relevant for early days)
  if (typeof module.maxSobrietyDays === "number" && sobrietyDays !== null) {
    if (sobrietyDays > module.maxSobrietyDays) {
      return false;
    }
  }
  // If user has no sobriety date, allow access to modules with max days
  // (they're likely newcomers, perfect for early-day content)

  // ============================================================================
  // MEETINGS ATTENDED GATING
  // ============================================================================

  if (module.gatingRules?.requireMeetingsAttended) {
    if (meetingsAttended < module.gatingRules.requireMeetingsAttended) {
      return false;
    }
  }

  // ============================================================================
  // PRIOR LESSONS GATING
  // ============================================================================

  // Check if user has completed all required prerequisite lessons
  if (module.gatingRules?.requireCompletedLessonIds?.length) {
    const completedSet = new Set(completedLessonIds.map(String));
    for (const requiredLessonId of module.gatingRules.requireCompletedLessonIds) {
      if (!completedSet.has(String(requiredLessonId))) {
        return false;
      }
    }
  }

  // ============================================================================
  // ALL CHECKS PASSED
  // ============================================================================

  return true;
}

/**
 * Filters a list of modules to only those accessible by the user.
 *
 * @param modules - Array of modules to filter
 * @param userContext - User's current context
 * @returns Array of modules the user can access
 */
export function getAccessibleModules(
  modules: Module[],
  userContext: UserContext
): Module[] {
  return modules.filter((module) => canAccessModule(module, userContext));
}

/**
 * Gets a human-readable explanation for why a module is locked.
 * Useful for displaying to users.
 *
 * @param module - The locked module
 * @param userContext - User's current context
 * @returns A friendly explanation string, or null if module is accessible
 */
export function getModuleLockReason(
  module: Module,
  userContext: UserContext
): string | null {
  const { sobrietyDays, meetingsAttended, completedLessonIds } = userContext;

  // Check minimum sobriety days
  if (typeof module.minSobrietyDays === "number" && sobrietyDays !== null) {
    if (sobrietyDays < module.minSobrietyDays) {
      const daysRemaining = module.minSobrietyDays - sobrietyDays;
      return `This module becomes available after ${module.minSobrietyDays} days sober (${daysRemaining} days to go)`;
    }
  }

  // Check meetings requirement
  if (module.gatingRules?.requireMeetingsAttended) {
    if (meetingsAttended < module.gatingRules.requireMeetingsAttended) {
      const meetingsNeeded =
        module.gatingRules.requireMeetingsAttended - meetingsAttended;
      return `Attend ${meetingsNeeded} more ${
        meetingsNeeded === 1 ? "meeting" : "meetings"
      } to unlock this module`;
    }
  }

  // Check prior lessons
  if (module.gatingRules?.requireCompletedLessonIds?.length) {
    const completedSet = new Set(completedLessonIds.map(String));
    const incompleteCount = module.gatingRules.requireCompletedLessonIds.filter(
      (id) => !completedSet.has(String(id))
    ).length;

    if (incompleteCount > 0) {
      return `Complete previous lessons to unlock this module`;
    }
  }

  // Module is accessible
  return null;
}
