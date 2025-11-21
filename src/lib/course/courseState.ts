/**
 * Course State Management
 *
 * Determines user's current position in a course and computes next steps.
 */

import { ObjectId } from "mongodb";
import {
  Course,
  Module,
  Lesson,
  UserCourseProgress,
  UserContext,
  LessonReference,
} from "./types";
import { canAccessModule } from "./gating";

/**
 * Determines the next lesson a user should take in a course.
 *
 * Logic:
 * 1. Find the first accessible module (in order) that has uncompleted lessons
 * 2. Within that module, find the first uncompleted lesson (in order)
 * 3. Return null if course is complete
 *
 * @param course - The course
 * @param modules - All modules in the course (sorted by order)
 * @param lessons - All lessons in the course
 * @param userContext - User's current context
 * @param userProgress - User's progress in this course (can be null for new users)
 * @returns The next lesson to take, or null if course is complete
 */
export function getNextLesson(
  course: Course,
  modules: Module[],
  lessons: Lesson[],
  userContext: UserContext,
  userProgress: UserCourseProgress | null
): LessonReference | null {
  // Build set of completed lesson IDs for fast lookup
  const completedLessonIds = new Set(
    (userProgress?.completedLessons || []).map((cl) => String(cl.lessonId))
  );

  // Sort modules by order
  const sortedModules = [...modules].sort((a, b) => a.order - b.order);

  // Find first accessible module with uncompleted lessons
  for (const module of sortedModules) {
    // Check if user can access this module
    if (!canAccessModule(module, userContext)) {
      continue;
    }

    // Get lessons for this module, sorted by order
    const moduleLessons = lessons
      .filter((lesson) => String(lesson.moduleId) === String(module._id))
      .sort((a, b) => a.order - b.order);

    // Find first uncompleted lesson in this module
    for (const lesson of moduleLessons) {
      if (!completedLessonIds.has(String(lesson._id))) {
        return {
          lessonId: lesson._id,
          moduleSlug: module.slug,
          lessonSlug: lesson.slug,
          title: lesson.title,
        };
      }
    }

    // All lessons in this module are complete, continue to next module
  }

  // No uncompleted lessons found in any accessible module
  return null;
}

/**
 * Determines the previous lesson relative to the current lesson.
 *
 * @param currentLesson - The current lesson
 * @param modules - All modules in the course (sorted by order)
 * @param lessons - All lessons in the course
 * @param userContext - User's current context
 * @returns The previous lesson, or null if this is the first lesson
 */
export function getPreviousLesson(
  currentLesson: Lesson,
  modules: Module[],
  lessons: Lesson[],
  userContext: UserContext
): LessonReference | null {
  // Sort modules by order
  const sortedModules = [...modules].sort((a, b) => a.order - b.order);

  // Build a flat list of all accessible lessons in order
  const allAccessibleLessons: Array<Lesson & { moduleSlug: string }> = [];

  for (const module of sortedModules) {
    if (!canAccessModule(module, userContext)) {
      continue;
    }

    const moduleLessons = lessons
      .filter((lesson) => String(lesson.moduleId) === String(module._id))
      .sort((a, b) => a.order - b.order)
      .map((lesson) => ({ ...lesson, moduleSlug: module.slug }));

    allAccessibleLessons.push(...moduleLessons);
  }

  // Find current lesson index
  const currentIndex = allAccessibleLessons.findIndex(
    (lesson) => String(lesson._id) === String(currentLesson._id)
  );

  // If not found or is first lesson, return null
  if (currentIndex <= 0) {
    return null;
  }

  // Return previous lesson
  const prevLesson = allAccessibleLessons[currentIndex - 1];
  return {
    lessonId: prevLesson._id,
    moduleSlug: prevLesson.moduleSlug,
    lessonSlug: prevLesson.slug,
    title: prevLesson.title,
  };
}

/**
 * Determines if a user has completed an entire course.
 *
 * @param modules - All modules in the course
 * @param lessons - All lessons in the course
 * @param userContext - User's current context
 * @param userProgress - User's progress in this course
 * @returns true if all accessible lessons are completed
 */
export function isCourseComplete(
  modules: Module[],
  lessons: Lesson[],
  userContext: UserContext,
  userProgress: UserCourseProgress | null
): boolean {
  const nextLesson = getNextLesson(
    { modules: [] } as Course, // Course object not needed for this check
    modules,
    lessons,
    userContext,
    userProgress
  );

  return nextLesson === null;
}

/**
 * Calculates completion percentage for a course.
 *
 * @param modules - All modules in the course
 * @param lessons - All lessons in the course
 * @param userContext - User's current context (for gating)
 * @param userProgress - User's progress in this course
 * @returns Percentage (0-100) of accessible lessons completed
 */
export function calculateCourseProgress(
  modules: Module[],
  lessons: Lesson[],
  userContext: UserContext,
  userProgress: UserCourseProgress | null
): number {
  // Get all accessible modules
  const accessibleModules = modules.filter((m) =>
    canAccessModule(m, userContext)
  );

  // Get all lessons in accessible modules
  const accessibleModuleIds = new Set(
    accessibleModules.map((m) => String(m._id))
  );
  const accessibleLessons = lessons.filter((l) =>
    accessibleModuleIds.has(String(l.moduleId))
  );

  if (accessibleLessons.length === 0) {
    return 0;
  }

  // Count completed lessons
  const completedLessonIds = new Set(
    (userProgress?.completedLessons || []).map((cl) => String(cl.lessonId))
  );

  const completedCount = accessibleLessons.filter((lesson) =>
    completedLessonIds.has(String(lesson._id))
  ).length;

  return Math.round((completedCount / accessibleLessons.length) * 100);
}

/**
 * Gets completion stats for a specific module.
 *
 * @param module - The module to check
 * @param lessons - All lessons in the course
 * @param userProgress - User's progress in this course
 * @returns Object with completedCount and totalCount
 */
export function getModuleCompletionStats(
  module: Module,
  lessons: Lesson[],
  userProgress: UserCourseProgress | null
): { completedCount: number; totalCount: number } {
  // Get all lessons for this module
  const moduleLessons = lessons.filter(
    (lesson) => String(lesson.moduleId) === String(module._id)
  );

  // Count completed lessons
  const completedLessonIds = new Set(
    (userProgress?.completedLessons || []).map((cl) => String(cl.lessonId))
  );

  const completedCount = moduleLessons.filter((lesson) =>
    completedLessonIds.has(String(lesson._id))
  ).length;

  return {
    completedCount,
    totalCount: moduleLessons.length,
  };
}

/**
 * Checks if a specific lesson is completed.
 *
 * @param lessonId - The lesson ID to check
 * @param userProgress - User's progress in this course
 * @returns true if lesson is completed
 */
export function isLessonCompleted(
  lessonId: ObjectId,
  userProgress: UserCourseProgress | null
): boolean {
  if (!userProgress) return false;

  return userProgress.completedLessons.some(
    (cl) => String(cl.lessonId) === String(lessonId)
  );
}
