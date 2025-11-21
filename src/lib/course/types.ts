import { ObjectId } from "mongodb";

// ============================================================================
// LESSON BLOCK TYPES
// ============================================================================

export type HeroProps = {
  heading: string;
  body?: string;
  mascotVariant?: "lantern-soft" | "path" | "night-sky";
  imagePath?: string;
};

export type TextProps = {
  body: string;
};

export type QuoteProps = {
  source: string;
  body: string;
};

export type CheckinProps = {
  question: string;
  scale: string[]; // e.g. ["overwhelmed", "scared", "numb", "hopeful"]
};

export type JournalPromptProps = {
  title?: string;
  prompt: string;
  linkToJournalFeature?: boolean;
};

export type VideoProps = {
  url: string;
  title?: string;
  description?: string;
};

export type FeatureIntroProps = {
  featureKey: "meeting-finder" | "sobriety-tracker" | "ninety-in-ninety" | "daily-reflection" | string;
  title: string;
  description?: string;
  buttonLabel: string;
};

export type DividerProps = Record<string, never>; // Empty object

// Discriminated union of all block types
export type LessonBlock =
  | { type: "hero"; props: HeroProps }
  | { type: "text"; props: TextProps }
  | { type: "quote"; props: QuoteProps }
  | { type: "checkin"; props: CheckinProps }
  | { type: "journal-prompt"; props: JournalPromptProps }
  | { type: "video"; props: VideoProps }
  | { type: "cta-feature-intro"; props: FeatureIntroProps }
  | { type: "divider"; props: DividerProps };

// ============================================================================
// CORE DATA MODELS
// ============================================================================

export interface Course {
  _id: ObjectId;
  slug: string;
  title: string;
  description: string;
  isActive: boolean;
  order: number;
  modules: {
    moduleId: ObjectId;
    order: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GatingRules {
  requireMeetingsAttended?: number;
  requireCompletedLessonIds?: ObjectId[];
}

export interface Module {
  _id: ObjectId;
  courseId: ObjectId;
  slug: string;
  title: string;
  description: string;
  order: number;
  minSobrietyDays?: number | null;
  maxSobrietyDays?: number | null;
  gatingRules?: GatingRules;
  lessonIds: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Lesson {
  _id: ObjectId;
  courseId: ObjectId;
  moduleId: ObjectId;
  slug: string;
  title: string;
  subtitle?: string;
  order: number;
  approximateDurationMinutes?: number;
  blocks: LessonBlock[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CompletedLesson {
  lessonId: ObjectId;
  completedAt: Date;
}

export interface UserCourseProgress {
  _id: ObjectId;
  userId: ObjectId;
  courseId: ObjectId;
  currentModuleId?: ObjectId | null;
  currentLessonId?: ObjectId | null;
  completedLessons: CompletedLesson[];
  startedAt: Date;
  updatedAt: Date;
}

export interface UserEvent {
  _id: ObjectId;
  userId: ObjectId;
  type: "lesson_completed" | "meeting_joined" | "journal_entry" | "course_started" | "lesson_checkin" | "feature_offer_clicked";
  payload: Record<string, any>;
  createdAt: Date;
}

// ============================================================================
// USER CONTEXT (for gating logic)
// ============================================================================

export interface UserContext {
  sobrietyDays: number | null;
  meetingsAttended: number;
  completedLessonIds: string[]; // ObjectId strings
}

// ============================================================================
// API RESPONSE SHAPES
// ============================================================================

export interface ModuleWithStatus extends Module {
  locked: boolean;
  completedLessonCount: number;
  totalLessonCount: number;
}

export interface LessonReference {
  lessonId: ObjectId;
  moduleSlug: string;
  lessonSlug: string;
  title: string;
}

export interface CourseOverviewData {
  course: Course;
  modules: ModuleWithStatus[];
  userProgress: UserCourseProgress | null;
  nextLesson: LessonReference | null;
}

export interface LessonPageData {
  course: Course;
  module: Module;
  lesson: Lesson;
  userProgress: UserCourseProgress | null;
  nextLesson: LessonReference | null;
  previousLesson: LessonReference | null;
  isCompleted: boolean;
}
