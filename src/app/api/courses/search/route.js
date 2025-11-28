import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTION_NAMES } from '@/lib/course/schema';

/**
 * POST /api/courses/search
 * Search courses and lessons
 *
 * Body parameters:
 * - query: String to search for
 * - limit: Maximum number of results (default: 10)
 *
 * Note: Only returns active courses and their lessons
 */
export async function POST(request) {
  console.log('🔍 API: Courses search request received');

  try {
    // Parse request body
    const body = await request.json();
    const { query, limit = 10 } = body;

    console.log('📊 API: Courses search params', { query, limit });

    // Validate inputs
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query string must not be empty' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Set up search options
    const searchLimit = Math.min(Math.max(1, parseInt(limit) || 10), 50); // Between 1-50

    // Search across courses, modules, and lessons
    const regexPattern = { $regex: query, $options: 'i' };

    // Search courses
    const courses = await db
      .collection(COLLECTION_NAMES.COURSES)
      .find({
        isActive: true,
        $or: [
          { title: regexPattern },
          { description: regexPattern }
        ]
      })
      .limit(searchLimit)
      .toArray();

    // Search modules
    const modules = await db
      .collection(COLLECTION_NAMES.MODULES)
      .find({
        $or: [
          { title: regexPattern },
          { description: regexPattern }
        ]
      })
      .limit(searchLimit)
      .toArray();

    // Search lessons
    const lessons = await db
      .collection(COLLECTION_NAMES.LESSONS)
      .find({
        $or: [
          { title: regexPattern },
          { content: regexPattern }
        ]
      })
      .limit(searchLimit)
      .toArray();

    console.log(`✅ Search found ${courses.length} courses, ${modules.length} modules, ${lessons.length} lessons`);

    // Process results
    const results = [];

    // Add course results
    for (const course of courses) {
      results.push({
        _id: course._id.toString(),
        type: 'course',
        title: course.title,
        excerpt: course.description?.substring(0, 200) + (course.description?.length > 200 ? '...' : ''),
        slug: course.slug,
        score: 1.0, // Highest priority for direct course matches
        url: `/course/${course.slug}`
      });
    }

    // Add module results (need to fetch course info)
    for (const module of modules) {
      const course = await db
        .collection(COLLECTION_NAMES.COURSES)
        .findOne({ _id: module.courseId, isActive: true });

      if (course) {
        results.push({
          _id: module._id.toString(),
          type: 'module',
          title: module.title,
          excerpt: module.description?.substring(0, 200) + (module.description?.length > 200 ? '...' : ''),
          courseTitle: course.title,
          courseSlug: course.slug,
          moduleSlug: module.slug,
          score: 0.8,
          url: `/course/${course.slug}#${module.slug}`
        });
      }
    }

    // Add lesson results (need to fetch course and module info)
    for (const lesson of lessons) {
      const module = await db
        .collection(COLLECTION_NAMES.MODULES)
        .findOne({ _id: lesson.moduleId });

      if (module) {
        const course = await db
          .collection(COLLECTION_NAMES.COURSES)
          .findOne({ _id: module.courseId, isActive: true });

        if (course) {
          // Create excerpt from content
          let excerpt = '';
          if (lesson.content) {
            const contentText = typeof lesson.content === 'string'
              ? lesson.content
              : JSON.stringify(lesson.content);
            excerpt = contentText.substring(0, 200) + (contentText.length > 200 ? '...' : '');
          }

          results.push({
            _id: lesson._id.toString(),
            type: 'lesson',
            title: lesson.title,
            excerpt,
            courseTitle: course.title,
            courseSlug: course.slug,
            moduleTitle: module.title,
            moduleSlug: module.slug,
            lessonSlug: lesson.slug,
            score: 0.6,
            url: `/course/${course.slug}/learn/${module.slug}/${lesson.slug}`
          });
        }
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    // Limit total results
    const limitedResults = results.slice(0, searchLimit);

    const response = {
      query,
      results: limitedResults,
      count: limitedResults.length,
      breakdown: {
        courses: courses.length,
        modules: modules.length,
        lessons: lessons.length
      }
    };

    console.log(`✅ API: Courses search successful, found ${limitedResults.length} total results`);
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ API: Error performing courses search:', error);
    console.error('Error details:', error.message, error.stack);

    return NextResponse.json(
      {
        error: 'Failed to perform courses search.',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// Cache for 10 minutes since courses don't change often
export const revalidate = 600;
