/**
 * Course API - Data Access Layer
 *
 * Provides functions to fetch and manipulate course data from MongoDB.
 * Integrates with existing AA Companion patterns.
 */

import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/lib/mongodb";
import { calculateDaysSober } from "@/utils/sobrietyUtils";
import { getUserMeetingTrackerStats } from "@/lib/models/MeetingAttendance";
import {
  Course,
  Module,
  Lesson,
  UserCourseProgress,
  UserContext,
  CourseOverviewData,
  LessonPageData,
  ModuleWithStatus,
} from "./types";
import { COLLECTION_NAMES } from "./schema";
import { canAccessModule, getModuleLockReason } from "./gating";
import {
  getNextLesson,
  getPreviousLesson,
  getModuleCompletionStats,
  isLessonCompleted,
} from "./courseState";

// ============================================================================
// USER CONTEXT
// ============================================================================

/**
 * Builds a UserContext object for gating logic.
 * Integrates with existing sobriety and meeting tracking.
 *
 * @param userId - The user's ObjectId (as string or ObjectId)
 * @returns UserContext for gating decisions
 */
export async function getUserContext(
  userId: string | ObjectId
): Promise<UserContext> {
  const { db } = await connectToDatabase();
  const userIdObj = new ObjectId(userId);

  // Fetch user's sobriety data
  const user = await db.collection("users").findOne(
    { _id: userIdObj },
    { projection: { sobriety: 1 } }
  );

  // Calculate sobriety days using existing utility
  const sobrietyDays = user?.sobriety?.date
    ? calculateDaysSober(user.sobriety.date)
    : null;

  // Get meeting attendance using existing model
  const meetingStats = await getUserMeetingTrackerStats(userId.toString());
  const meetingsAttended = meetingStats?.totalMeetings || 0;

  // Get completed lesson IDs from user's course progress
  const progressRecords = await db
    .collection<UserCourseProgress>(COLLECTION_NAMES.USER_COURSE_PROGRESS)
    .find({ userId: userIdObj })
    .toArray();

  const completedLessonIds = progressRecords.flatMap((progress) =>
    progress.completedLessons.map((cl) => String(cl.lessonId))
  );

  return {
    sobrietyDays,
    meetingsAttended,
    completedLessonIds,
  };
}

// ============================================================================
// COURSE QUERIES
// ============================================================================

/**
 * Gets all active courses for a user.
 *
 * @param userId - The user's ObjectId (as string or ObjectId)
 * @returns Array of active courses
 */
export async function getCoursesForUser(
  userId: string | ObjectId
): Promise<Course[]> {
  const { db } = await connectToDatabase();

  const courses = await db
    .collection<Course>(COLLECTION_NAMES.COURSES)
    .find({ isActive: true })
    .sort({ order: 1 })
    .toArray();

  return courses;
}

/**
 * Gets a single course by slug.
 *
 * @param courseSlug - The course slug
 * @returns Course or null if not found
 */
export async function getCourseBySlug(
  courseSlug: string
): Promise<Course | null> {
  const { db } = await connectToDatabase();

  const course = await db
    .collection<Course>(COLLECTION_NAMES.COURSES)
    .findOne({ slug: courseSlug, isActive: true });

  return course;
}

/**
 * Gets course overview data for display on course home page.
 * Includes modules with lock status and user progress.
 *
 * @param params - userId and courseSlug
 * @returns CourseOverviewData or null if course not found
 */
export async function getCourseOverviewForUser(params: {
  userId: string | ObjectId;
  courseSlug: string;
}): Promise<CourseOverviewData | null> {
  const { userId, courseSlug } = params;
  const { db } = await connectToDatabase();
  const userIdObj = new ObjectId(userId);

  // Get course
  const course = await getCourseBySlug(courseSlug);
  if (!course) return null;

  // Get all modules for this course
  const modules = await db
    .collection<Module>(COLLECTION_NAMES.MODULES)
    .find({ courseId: course._id })
    .sort({ order: 1 })
    .toArray();

  // Get all lessons for this course
  const lessons = await db
    .collection<Lesson>(COLLECTION_NAMES.LESSONS)
    .find({ courseId: course._id })
    .toArray();

  // Get user's progress
  const userProgress = await db
    .collection<UserCourseProgress>(COLLECTION_NAMES.USER_COURSE_PROGRESS)
    .findOne({ userId: userIdObj, courseId: course._id });

  // Get user context for gating
  const userContext = await getUserContext(userId);

  // Debug logging
  console.log('User context for course gating:', {
    userId: userId.toString(),
    sobrietyDays: userContext.sobrietyDays,
    meetingsAttended: userContext.meetingsAttended,
    completedLessonCount: userContext.completedLessonIds.length
  });

  // Annotate modules with lock status and completion stats
  const modulesWithStatus: ModuleWithStatus[] = modules.map((module) => {
    const stats = getModuleCompletionStats(module, lessons, userProgress);
    const isLocked = !canAccessModule(module, userContext);

    console.log(`Module "${module.title}" lock status:`, {
      locked: isLocked,
      minSobrietyDays: module.minSobrietyDays,
      maxSobrietyDays: module.maxSobrietyDays,
      userSobrietyDays: userContext.sobrietyDays
    });

    return {
      ...module,
      locked: isLocked,
      completedLessonCount: stats.completedCount,
      totalLessonCount: stats.totalCount,
    };
  });

  // Determine next lesson
  const nextLesson = getNextLesson(
    course,
    modules,
    lessons,
    userContext,
    userProgress
  );

  return {
    course,
    modules: modulesWithStatus,
    userProgress,
    nextLesson,
  };
}

/**
 * Gets all data needed to render a lesson page.
 *
 * @param params - userId, courseSlug, moduleSlug, lessonSlug
 * @returns LessonPageData or null if not found or user can't access
 */
export async function getLessonPageData(params: {
  userId: string | ObjectId;
  courseSlug: string;
  moduleSlug: string;
  lessonSlug: string;
}): Promise<LessonPageData | null> {
  const { userId, courseSlug, moduleSlug, lessonSlug } = params;
  const { db } = await connectToDatabase();
  const userIdObj = new ObjectId(userId);

  // Get course
  const course = await getCourseBySlug(courseSlug);
  if (!course) return null;

  // Get module
  const module = await db
    .collection<Module>(COLLECTION_NAMES.MODULES)
    .findOne({ courseId: course._id, slug: moduleSlug });
  if (!module) return null;

  // Get lesson
  const lesson = await db
    .collection<Lesson>(COLLECTION_NAMES.LESSONS)
    .findOne({ courseId: course._id, moduleId: module._id, slug: lessonSlug });
  if (!lesson) return null;

  // Check if user can access this module
  const userContext = await getUserContext(userId);
  if (!canAccessModule(module, userContext)) {
    return null; // User doesn't have access yet
  }

  // Get all modules and lessons for navigation
  const modules = await db
    .collection<Module>(COLLECTION_NAMES.MODULES)
    .find({ courseId: course._id })
    .sort({ order: 1 })
    .toArray();

  const lessons = await db
    .collection<Lesson>(COLLECTION_NAMES.LESSONS)
    .find({ courseId: course._id })
    .toArray();

  // Get user's progress
  const userProgress = await db
    .collection<UserCourseProgress>(COLLECTION_NAMES.USER_COURSE_PROGRESS)
    .findOne({ userId: userIdObj, courseId: course._id });

  // Determine next lesson
  const nextLesson = getNextLesson(
    course,
    modules,
    lessons,
    userContext,
    userProgress
  );

  // Determine previous lesson
  const previousLesson = getPreviousLesson(
    lesson,
    modules,
    lessons,
    userContext
  );

  // Check if this lesson is already completed
  const isCompleted = isLessonCompleted(lesson._id, userProgress);

  return {
    course,
    module,
    lesson,
    userProgress,
    nextLesson,
    previousLesson,
    isCompleted,
  };
}

// ============================================================================
// PROGRESS MUTATIONS
// ============================================================================

/**
 * Marks a lesson as complete and updates user progress.
 * Creates progress record if it doesn't exist.
 *
 * @param params - userId, courseId, lessonId
 * @returns Updated UserCourseProgress
 */
export async function completeLesson(params: {
  userId: string | ObjectId;
  courseId: string | ObjectId;
  lessonId: string | ObjectId;
}): Promise<UserCourseProgress> {
  const { userId, courseId, lessonId } = params;
  const { db } = await connectToDatabase();

  const userIdObj = new ObjectId(userId);
  const courseIdObj = new ObjectId(courseId);
  const lessonIdObj = new ObjectId(lessonId);

  const now = new Date();

  // Check if lesson is already completed
  const existing = await db
    .collection<UserCourseProgress>(COLLECTION_NAMES.USER_COURSE_PROGRESS)
    .findOne({
      userId: userIdObj,
      courseId: courseIdObj,
      "completedLessons.lessonId": lessonIdObj,
    });

  if (existing) {
    // Already completed, just return existing progress
    return existing;
  }

  // Upsert progress record
  const result = await db
    .collection<UserCourseProgress>(COLLECTION_NAMES.USER_COURSE_PROGRESS)
    .findOneAndUpdate(
      { userId: userIdObj, courseId: courseIdObj },
      {
        $push: {
          completedLessons: {
            lessonId: lessonIdObj,
            completedAt: now,
          },
        },
        $set: {
          currentLessonId: lessonIdObj,
          updatedAt: now,
        },
        $setOnInsert: {
          startedAt: now,
        },
      },
      { upsert: true, returnDocument: "after" }
    );

  // Log event for analytics
  await db.collection(COLLECTION_NAMES.USER_EVENTS).insertOne({
    userId: userIdObj,
    type: "lesson_completed",
    payload: {
      courseId: courseIdObj,
      lessonId: lessonIdObj,
    },
    createdAt: now,
  });

  return result!;
}

/**
 * Records a check-in response from a CheckinBlock.
 *
 * @param params - userId, lessonId, mood
 */
export async function recordCheckin(params: {
  userId: string | ObjectId;
  lessonId: string | ObjectId;
  mood: string;
}): Promise<void> {
  const { userId, lessonId, mood } = params;
  const { db } = await connectToDatabase();

  const userIdObj = new ObjectId(userId);
  const lessonIdObj = new ObjectId(lessonId);

  await db.collection(COLLECTION_NAMES.USER_EVENTS).insertOne({
    userId: userIdObj,
    type: "lesson_checkin",
    payload: {
      lessonId: lessonIdObj,
      mood,
    },
    createdAt: new Date(),
  });
}

/**
 * Records when a user clicks a feature intro CTA button.
 *
 * @param params - userId, lessonId, featureKey
 */
export async function recordFeatureOfferClick(params: {
  userId: string | ObjectId;
  lessonId: string | ObjectId;
  featureKey: string;
}): Promise<void> {
  const { userId, lessonId, featureKey } = params;
  const { db } = await connectToDatabase();

  const userIdObj = new ObjectId(userId);
  const lessonIdObj = new ObjectId(lessonId);

  await db.collection(COLLECTION_NAMES.USER_EVENTS).insertOne({
    userId: userIdObj,
    type: "feature_offer_clicked",
    payload: {
      lessonId: lessonIdObj,
      featureKey,
    },
    createdAt: new Date(),
  });
}
