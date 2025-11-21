/**
 * MongoDB Schema Definitions and Index Creation for Course System
 *
 * This file contains:
 * - Collection names
 * - Index definitions for each collection
 * - Helper function to ensure indexes are created
 */

import { Db } from "mongodb";

export const COLLECTION_NAMES = {
  COURSES: "courses",
  MODULES: "modules",
  LESSONS: "lessons",
  USER_COURSE_PROGRESS: "userCourseProgress",
  USER_EVENTS: "userEvents", // Shared telemetry collection
} as const;

/**
 * Ensures all required indexes exist for the course system.
 * Safe to call multiple times (MongoDB will skip existing indexes).
 *
 * @param db - MongoDB database instance
 */
export async function ensureCourseIndexes(db: Db): Promise<void> {
  // ============================================================================
  // COURSES COLLECTION INDEXES
  // ============================================================================
  await db.collection(COLLECTION_NAMES.COURSES).createIndexes([
    {
      key: { slug: 1 },
      unique: true,
      name: "slug_unique",
    },
    {
      key: { isActive: 1, order: 1 },
      name: "active_order",
    },
  ]);

  // ============================================================================
  // MODULES COLLECTION INDEXES
  // ============================================================================
  await db.collection(COLLECTION_NAMES.MODULES).createIndexes([
    {
      key: { courseId: 1, order: 1 },
      name: "course_order",
    },
    {
      key: { slug: 1, courseId: 1 },
      unique: true,
      name: "slug_course_unique",
    },
  ]);

  // ============================================================================
  // LESSONS COLLECTION INDEXES
  // ============================================================================
  await db.collection(COLLECTION_NAMES.LESSONS).createIndexes([
    {
      key: { courseId: 1, moduleId: 1, order: 1 },
      name: "course_module_order",
    },
    {
      key: { courseId: 1, slug: 1 },
      unique: true,
      name: "slug_course_unique",
    },
  ]);

  // ============================================================================
  // USER_COURSE_PROGRESS COLLECTION INDEXES
  // ============================================================================
  await db.collection(COLLECTION_NAMES.USER_COURSE_PROGRESS).createIndexes([
    {
      key: { userId: 1, courseId: 1 },
      unique: true,
      name: "user_course_unique",
    },
    {
      key: { userId: 1, updatedAt: -1 },
      name: "user_recent",
    },
  ]);

  // ============================================================================
  // USER_EVENTS COLLECTION INDEXES
  // ============================================================================
  // Note: This collection may already exist with indexes.
  // We only add course-specific indexes if needed.
  await db.collection(COLLECTION_NAMES.USER_EVENTS).createIndexes([
    {
      key: { userId: 1, createdAt: -1 },
      name: "user_timeline",
    },
    {
      key: { type: 1, createdAt: -1 },
      name: "type_timeline",
    },
  ]);

  console.log("✓ Course system indexes ensured");
}

/**
 * Validation schemas for MongoDB (optional but recommended)
 * These can be applied using db.command() if you want strict validation
 */
export const VALIDATION_SCHEMAS = {
  courses: {
    $jsonSchema: {
      bsonType: "object",
      required: ["slug", "title", "isActive", "order", "createdAt", "updatedAt"],
      properties: {
        slug: { bsonType: "string" },
        title: { bsonType: "string" },
        description: { bsonType: "string" },
        isActive: { bsonType: "bool" },
        order: { bsonType: "int" },
        modules: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["moduleId", "order"],
            properties: {
              moduleId: { bsonType: "objectId" },
              order: { bsonType: "int" },
            },
          },
        },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
      },
    },
  },
  modules: {
    $jsonSchema: {
      bsonType: "object",
      required: ["courseId", "slug", "title", "order", "createdAt", "updatedAt"],
      properties: {
        courseId: { bsonType: "objectId" },
        slug: { bsonType: "string" },
        title: { bsonType: "string" },
        description: { bsonType: "string" },
        order: { bsonType: "int" },
        minSobrietyDays: { bsonType: ["int", "null"] },
        maxSobrietyDays: { bsonType: ["int", "null"] },
        gatingRules: {
          bsonType: "object",
          properties: {
            requireMeetingsAttended: { bsonType: "int" },
            requireCompletedLessonIds: {
              bsonType: "array",
              items: { bsonType: "objectId" },
            },
          },
        },
        lessonIds: {
          bsonType: "array",
          items: { bsonType: "objectId" },
        },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
      },
    },
  },
  lessons: {
    $jsonSchema: {
      bsonType: "object",
      required: ["courseId", "moduleId", "slug", "title", "order", "blocks", "createdAt", "updatedAt"],
      properties: {
        courseId: { bsonType: "objectId" },
        moduleId: { bsonType: "objectId" },
        slug: { bsonType: "string" },
        title: { bsonType: "string" },
        subtitle: { bsonType: "string" },
        order: { bsonType: "int" },
        approximateDurationMinutes: { bsonType: "int" },
        blocks: { bsonType: "array" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
      },
    },
  },
  userCourseProgress: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "courseId", "startedAt", "updatedAt"],
      properties: {
        userId: { bsonType: "objectId" },
        courseId: { bsonType: "objectId" },
        currentModuleId: { bsonType: ["objectId", "null"] },
        currentLessonId: { bsonType: ["objectId", "null"] },
        completedLessons: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["lessonId", "completedAt"],
            properties: {
              lessonId: { bsonType: "objectId" },
              completedAt: { bsonType: "date" },
            },
          },
        },
        startedAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
      },
    },
  },
};
