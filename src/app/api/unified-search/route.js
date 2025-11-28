import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { searchReflections } from '@/lib/vectorSearch';
import { getJournalCollection } from '@/lib/models/journalEntry';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import Resource from '@/lib/models/Resource';
import mongoose from '@/lib/mongoose';
import { getMeetingsCollection } from '@/lib/models/meeting';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTION_NAMES } from '@/lib/course/schema';

/**
 * POST /api/unified-search
 * Unified search across all searchable content in the app
 *
 * Body parameters:
 * - query: String to search for (required)
 * - limit: Maximum number of results per category (default: 10)
 * - categories: Array of categories to search (optional)
 *   Available: ['reflections', 'journal', 'bigbook', 'articles', 'meetings', 'courses']
 *   If not provided, searches all categories
 *
 * Response includes categorized results from all searched sources
 */
export async function POST(request) {
  console.log('🔍 API: Unified search request received');

  const startTime = Date.now();

  try {
    // Try to get session (optional for some searches)
    let session = null;
    try {
      session = await getSession(request);
    } catch (authError) {
      console.log('Unified search without authentication');
    }

    // Parse request body
    const body = await request.json();
    const {
      query,
      limit = 10,
      categories = ['reflections', 'journal', 'bigbook', 'articles', 'meetings', 'courses']
    } = body;

    console.log('📊 API: Unified search params', {
      query,
      limit,
      categories,
      authenticated: !!session?.user
    });

    // Validate inputs
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Query string must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Validate categories
    const validCategories = ['reflections', 'journal', 'bigbook', 'articles', 'meetings', 'courses'];
    const searchCategories = Array.isArray(categories)
      ? categories.filter(cat => validCategories.includes(cat))
      : validCategories;

    if (searchCategories.length === 0) {
      return NextResponse.json(
        { error: 'No valid search categories provided' },
        { status: 400 }
      );
    }

    const searchLimit = Math.min(Math.max(1, parseInt(limit) || 10), 50);

    // Execute all searches in parallel
    const searchPromises = {};

    // Search Daily Reflections
    if (searchCategories.includes('reflections')) {
      searchPromises.reflections = searchReflections(query, {
        limit: searchLimit,
        minScore: 0.6
      }).then(results => ({
        results: results.map(r => ({
          ...r,
          _id: r._id.toString(),
          score: parseFloat(r.score?.toFixed(4) || 0),
          url: `/${r.dateKey}`
        })),
        count: results.length
      })).catch(err => {
        console.error('Reflections search error:', err);
        return { results: [], count: 0 };
      });
    }

    // Search Journal Entries (requires authentication)
    if (searchCategories.includes('journal') && session?.user?.id) {
      searchPromises.journal = (async () => {
        try {
          const collection = await getJournalCollection(true);
          const userId = session.user.id;
          const regexPattern = { $regex: query, $options: 'i' };

          const results = await collection
            .find({
              userId: new ObjectId(userId),
              $or: [
                { reflections: regexPattern },
                { 'inventory.resentments': regexPattern },
                { 'inventory.fears': regexPattern },
                { 'inventory.honesty': regexPattern },
                { promises: regexPattern },
                { tags: regexPattern }
              ]
            })
            .sort({ date: -1 })
            .limit(searchLimit)
            .toArray();

          return {
            results: results.map(entry => {
              let excerpt = entry.reflections || entry.promises || '';
              if (excerpt.length > 200) {
                excerpt = excerpt.substring(0, 200) + '...';
              }

              return {
                _id: entry._id.toString(),
                date: entry.date,
                entryType: entry.entryType,
                excerpt,
                tags: entry.tags || [],
                mood: entry.mood,
                score: 0.5,
                url: `/journal/${entry._id.toString()}`
              };
            }),
            count: results.length
          };
        } catch (err) {
          console.error('Journal search error:', err);
          return { results: [], count: 0 };
        }
      })();
    }

    // Search Big Book
    if (searchCategories.includes('bigbook')) {
      searchPromises.bigbook = (async () => {
        try {
          const client = await clientPromise;
          const db = client.db();
          const collection = db.collection('bigbook_pages');

          const regexPattern = { $regex: query, $options: 'i' };
          const results = await collection
            .find({ text: regexPattern })
            .limit(searchLimit)
            .toArray();

          return {
            results: results.map(page => {
              let snippet = page.text || '';
              const matchIndex = snippet.toLowerCase().indexOf(query.toLowerCase());
              if (matchIndex >= 0) {
                const start = Math.max(0, matchIndex - 100);
                const end = Math.min(snippet.length, matchIndex + 100);
                snippet = (start > 0 ? '...' : '') +
                         snippet.substring(start, end) +
                         (end < snippet.length ? '...' : '');
              } else {
                snippet = snippet.substring(0, 200) + (snippet.length > 200 ? '...' : '');
              }

              return {
                _id: page._id.toString(),
                pageNumber: page.page,
                chapter: page.chapter || 'Unknown Chapter',
                snippet,
                score: 0.5,
                url: `/big-book/page/${page.page}`
              };
            }),
            count: results.length
          };
        } catch (err) {
          console.error('Big Book search error:', err);
          return { results: [], count: 0 };
        }
      })();
    }

    // Search Blog Articles
    if (searchCategories.includes('articles')) {
      searchPromises.articles = (async () => {
        try {
          await mongoose.connect();

          const results = await Resource
            .find({
              status: 'published',
              $or: [
                { title: { $regex: query, $options: 'i' } },
                { summary: { $regex: query, $options: 'i' } },
                { body: { $regex: query, $options: 'i' } }
              ]
            })
            .select('slug title summary resourceType topics publishedAt')
            .limit(searchLimit)
            .lean();

          return {
            results: results.map(article => {
              let excerpt = article.summary || '';
              if (excerpt.length > 200) {
                excerpt = excerpt.substring(0, 200) + '...';
              }

              return {
                _id: article._id.toString(),
                slug: article.slug,
                title: article.title,
                excerpt,
                resourceType: article.resourceType,
                topics: article.topics || [],
                publishedAt: article.publishedAt,
                score: 0.5,
                url: `/blog/${article.slug}`
              };
            }),
            count: results.length
          };
        } catch (err) {
          console.error('Articles search error:', err);
          return { results: [], count: 0 };
        }
      })();
    }

    // Search Meetings
    if (searchCategories.includes('meetings')) {
      searchPromises.meetings = (async () => {
        try {
          const collection = await getMeetingsCollection();
          const regexPattern = { $regex: query, $options: 'i' };

          const results = await collection
            .find({
              active: { $ne: false },
              $or: [
                { name: regexPattern },
                { location: regexPattern },
                { group: regexPattern },
                { notes: regexPattern },
                { city: regexPattern }
              ]
            })
            .limit(searchLimit)
            .toArray();

          const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

          return {
            results: results.map(meeting => {
              let excerpt = meeting.notes || meeting.location_notes || '';
              if (excerpt.length > 200) {
                excerpt = excerpt.substring(0, 200) + '...';
              }

              const dayName = Array.isArray(meeting.day)
                ? meeting.day.map(d => daysOfWeek[d]).join(', ')
                : daysOfWeek[meeting.day];

              const address = meeting.formatted_address ||
                [meeting.address, meeting.city, meeting.state].filter(Boolean).join(', ');

              return {
                _id: meeting._id.toString(),
                slug: meeting.slug,
                name: meeting.name,
                day: meeting.day,
                dayName,
                time: meeting.time,
                endTime: meeting.end_time,
                address,
                location: meeting.location,
                excerpt,
                types: meeting.types || [],
                isOnline: !!(meeting.conference_url || meeting.conference_phone),
                conferenceUrl: meeting.conference_url,
                score: 0.5,
                url: `/meetings/${meeting.slug}`
              };
            }),
            count: results.length
          };
        } catch (err) {
          console.error('Meetings search error:', err);
          return { results: [], count: 0 };
        }
      })();
    }

    // Search Courses
    if (searchCategories.includes('courses')) {
      searchPromises.courses = (async () => {
        try {
          const { db } = await connectToDatabase();
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

          const results = [];

          // Add course results
          for (const course of courses) {
            results.push({
              _id: course._id.toString(),
              type: 'course',
              title: course.title,
              excerpt: course.description?.substring(0, 200) + (course.description?.length > 200 ? '...' : ''),
              slug: course.slug,
              score: 1.0,
              url: `/course/${course.slug}`
            });
          }

          // Add lesson results
          for (const lesson of lessons) {
            const module = await db
              .collection(COLLECTION_NAMES.MODULES)
              .findOne({ _id: lesson.moduleId });

            if (module) {
              const course = await db
                .collection(COLLECTION_NAMES.COURSES)
                .findOne({ _id: module.courseId, isActive: true });

              if (course) {
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

          results.sort((a, b) => b.score - a.score);
          const limitedResults = results.slice(0, searchLimit);

          return {
            results: limitedResults,
            count: limitedResults.length
          };
        } catch (err) {
          console.error('Courses search error:', err);
          return { results: [], count: 0 };
        }
      })();
    }

    // Wait for all searches to complete
    console.log(`🚀 Executing ${Object.keys(searchPromises).length} parallel searches...`);
    const searchResults = await Promise.all(
      Object.entries(searchPromises).map(async ([key, promise]) => {
        const result = await promise;
        return [key, result];
      })
    );

    // Convert array back to object
    const results = Object.fromEntries(searchResults);

    // Calculate totals
    let totalResults = 0;
    const categoryCounts = {};

    for (const [category, data] of Object.entries(results)) {
      const count = data.count || 0;
      categoryCounts[category] = count;
      totalResults += count;
    }

    // Fill in missing categories with empty results
    for (const category of validCategories) {
      if (!results[category]) {
        results[category] = { results: [], count: 0 };
        categoryCounts[category] = 0;
      }
    }

    const executionTime = Date.now() - startTime;

    // Build response
    const response = {
      query,
      totalResults,
      executionTime: `${executionTime}ms`,
      categoryCounts,
      results: {
        reflections: results.reflections?.results || [],
        journal: results.journal?.results || [],
        bigbook: results.bigbook?.results || [],
        articles: results.articles?.results || [],
        meetings: results.meetings?.results || [],
        courses: results.courses?.results || []
      },
      metadata: {
        authenticated: !!session?.user,
        searchedCategories: searchCategories,
        limit: searchLimit
      }
    };

    console.log(`✅ API: Unified search complete in ${executionTime}ms`);
    console.log(`📊 Results breakdown:`, categoryCounts);

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ API: Error performing unified search:', error);
    console.error('Error details:', error.message, error.stack);

    return NextResponse.json(
      {
        error: 'Failed to perform unified search.',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// Short cache for unified search (1 minute)
// User-specific results (journal) won't be cached due to authentication
export const revalidate = 60;
