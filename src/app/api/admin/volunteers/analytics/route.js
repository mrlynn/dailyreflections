/**
 * API route for volunteer analytics
 */

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import { startOfMonth, subMonths, format } from 'date-fns';

/**
 * Check if user is an admin
 * @param {Object} session - User session
 * @returns {Boolean} - Whether user is an admin
 */
function isAdmin(session) {
  return session?.user?.isAdmin === true;
}

/**
 * GET /api/admin/volunteers/analytics
 * Get analytics data for volunteer program
 */
export async function GET(request) {
  try {
    // Check authentication and admin status
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '6months'; // 'all', '30days', '6months', '12months'

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('dailyreflections');

    // Calculate date range filter based on timeRange parameter
    let dateFilter = {};
    const now = new Date();

    if (timeRange === '30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter = { $gte: thirtyDaysAgo };
    } else if (timeRange === '6months') {
      const sixMonthsAgo = subMonths(now, 6);
      dateFilter = { $gte: sixMonthsAgo };
    } else if (timeRange === '12months') {
      const twelveMonthsAgo = subMonths(now, 12);
      dateFilter = { $gte: twelveMonthsAgo };
    }

    // Get application statistics
    const applicationStats = await getApplicationStats(db, dateFilter);

    // Get volunteer statistics
    const volunteerStats = await getVolunteerStats(db, dateFilter);

    // Get time-based metrics
    const timeBasedMetrics = await getTimeBasedMetrics(db, timeRange);

    // Get processing time metrics
    const processingTimeMetrics = await getProcessingTimeMetrics(db, dateFilter);

    // Get feedback metrics
    const feedbackMetrics = await getFeedbackMetrics(db, dateFilter);

    return NextResponse.json({
      applicationStats,
      volunteerStats,
      timeBasedMetrics,
      processingTimeMetrics,
      feedbackMetrics,
      timeRange
    });
  } catch (error) {
    console.error('Error fetching volunteer analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

/**
 * Get application statistics
 * @param {Object} db - MongoDB database connection
 * @param {Object} dateFilter - Date filter for created_at field
 * @returns {Promise<Object>} Application statistics
 */
async function getApplicationStats(db, dateFilter) {
  // Base query with optional date filter
  const query = dateFilter.hasOwnProperty('$gte')
    ? { created_at: dateFilter }
    : {};

  // Get application counts by status
  const applicationsByStatus = await db.collection('volunteer_applications').aggregate([
    { $match: query },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]).toArray();

  // Transform to a more usable format
  const statusCounts = applicationsByStatus.reduce((acc, curr) => {
    acc[curr._id] = curr.count;
    return acc;
  }, { pending: 0, approved: 0, rejected: 0 });

  // Calculate total and approval rate
  const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
  const approvalRate = total > 0
    ? Math.round((statusCounts.approved / total) * 100)
    : 0;

  return {
    total,
    pending: statusCounts.pending || 0,
    approved: statusCounts.approved || 0,
    rejected: statusCounts.rejected || 0,
    approvalRate
  };
}

/**
 * Get volunteer statistics
 * @param {Object} db - MongoDB database connection
 * @param {Object} dateFilter - Optional date filter
 * @returns {Promise<Object>} Volunteer statistics
 */
async function getVolunteerStats(db, dateFilter = {}) {
  // Count users with volunteer role
  const totalVolunteers = await db.collection('users').countDocuments({
    roles: 'volunteer_listener'
  });

  // Count active volunteers
  const activeVolunteers = await db.collection('users').countDocuments({
    roles: 'volunteer_listener',
    'volunteer.isActive': true
  });

  // Count inactive volunteers
  const inactiveVolunteers = await db.collection('users').countDocuments({
    roles: 'volunteer_listener',
    'volunteer.isActive': { $ne: true }
  });

  // Calculate activity rate
  const activityRate = totalVolunteers > 0
    ? Math.round((activeVolunteers / totalVolunteers) * 100)
    : 0;

  // Get engagement metrics - last login distribution
  // Count volunteers by last login period
  const now = new Date();
  const oneDay = new Date(now);
  oneDay.setDate(now.getDate() - 1);

  const oneWeek = new Date(now);
  oneWeek.setDate(now.getDate() - 7);

  const oneMonth = new Date(now);
  oneMonth.setDate(now.getDate() - 30);

  const loggedInToday = await db.collection('users').countDocuments({
    roles: 'volunteer_listener',
    lastLogin: { $gte: oneDay }
  });

  const loggedInThisWeek = await db.collection('users').countDocuments({
    roles: 'volunteer_listener',
    lastLogin: { $gte: oneWeek, $lt: oneDay }
  });

  const loggedInThisMonth = await db.collection('users').countDocuments({
    roles: 'volunteer_listener',
    lastLogin: { $gte: oneMonth, $lt: oneWeek }
  });

  const notRecentlyActive = await db.collection('users').countDocuments({
    roles: 'volunteer_listener',
    $or: [
      { lastLogin: { $lt: oneMonth } },
      { lastLogin: { $exists: false } }
    ]
  });

  // Get average sessions per volunteer (if chat_sessions collection exists)
  let avgSessionsPerVolunteer = 0;
  let totalSessions = 0;

  try {
    // This might not exist yet if chat functionality isn't implemented
    const collections = await db.listCollections({ name: 'chat_sessions' }).toArray();

    if (collections.length > 0) {
      const chatAggregation = await db.collection('chat_sessions').aggregate([
        { $match: dateFilter.hasOwnProperty('$gte') ? { created_at: dateFilter } : {} },
        { $group: {
          _id: '$volunteerId',
          sessionCount: { $sum: 1 }
        }},
        { $group: {
          _id: null,
          totalSessions: { $sum: '$sessionCount' },
          totalVolunteers: { $sum: 1 },
          avgSessions: { $avg: '$sessionCount' }
        }}
      ]).toArray();

      if (chatAggregation.length > 0) {
        avgSessionsPerVolunteer = Math.round(chatAggregation[0].avgSessions * 10) / 10;
        totalSessions = chatAggregation[0].totalSessions;
      }
    }
  } catch (error) {
    console.log('Chat sessions collection might not exist yet:', error);
    // Not critical, just means chat feature isn't fully implemented
  }

  return {
    total: totalVolunteers,
    active: activeVolunteers,
    inactive: inactiveVolunteers,
    activityRate,
    engagement: {
      loggedInToday,
      loggedInThisWeek,
      loggedInThisMonth,
      notRecentlyActive,
      loginDistribution: [
        { name: 'Today', value: loggedInToday },
        { name: 'This Week', value: loggedInThisWeek },
        { name: 'This Month', value: loggedInThisMonth },
        { name: 'Not Recent', value: notRecentlyActive }
      ]
    },
    sessionMetrics: {
      totalSessions,
      avgSessionsPerVolunteer
    }
  };
}

/**
 * Get time-based metrics
 * @param {Object} db - MongoDB database connection
 * @param {string} timeRange - Time range for metrics
 * @returns {Promise<Object>} Time-based metrics
 */
async function getTimeBasedMetrics(db, timeRange) {
  // Calculate how many months to look back based on timeRange
  let monthsToLookBack = 6; // default
  if (timeRange === '30days') monthsToLookBack = 1;
  if (timeRange === '12months') monthsToLookBack = 12;
  if (timeRange === 'all') monthsToLookBack = 24; // Limit to 2 years for "all"

  const now = new Date();
  const months = [];
  const applications = {
    labels: [],
    total: [],
    approved: [],
    rejected: [],
    pending: []
  };

  // Generate months array going back from current month
  for (let i = monthsToLookBack - 1; i >= 0; i--) {
    const month = subMonths(now, i);
    const monthStart = startOfMonth(month);
    const monthLabel = format(month, 'MMM yyyy');

    months.push({
      start: monthStart,
      label: monthLabel
    });

    applications.labels.push(monthLabel);
  }

  // Initialize data arrays with zeros
  applications.total = new Array(months.length).fill(0);
  applications.approved = new Array(months.length).fill(0);
  applications.rejected = new Array(months.length).fill(0);
  applications.pending = new Array(months.length).fill(0);

  // Get all applications within the time range
  const startDate = months[0].start;
  const applicationsData = await db.collection('volunteer_applications')
    .find({
      created_at: { $gte: startDate }
    })
    .toArray();

  // Process application data into monthly buckets
  for (const app of applicationsData) {
    const appDate = new Date(app.created_at);

    for (let i = 0; i < months.length; i++) {
      const nextMonthIdx = i + 1;
      const monthStart = months[i].start;
      const monthEnd = nextMonthIdx < months.length
        ? months[nextMonthIdx].start
        : new Date(); // Current date for the latest month

      if (appDate >= monthStart && appDate < monthEnd) {
        // This application belongs to this month
        applications.total[i]++;

        if (app.status === 'approved') {
          applications.approved[i]++;
        } else if (app.status === 'rejected') {
          applications.rejected[i]++;
        } else {
          applications.pending[i]++;
        }

        break; // Found the right month, no need to continue checking
      }
    }
  }

  // Get volunteer signups over time
  const volunteers = {
    labels: applications.labels,
    count: new Array(months.length).fill(0)
  };

  // Get all volunteer role assignments within the time range
  const volunteersData = await db.collection('users')
    .find({
      roles: 'volunteer_listener',
      'volunteer.activatedAt': { $gte: startDate }
    })
    .toArray();

  // Process volunteer data into monthly buckets
  for (const vol of volunteersData) {
    const volDate = new Date(vol.volunteer.activatedAt);

    for (let i = 0; i < months.length; i++) {
      const nextMonthIdx = i + 1;
      const monthStart = months[i].start;
      const monthEnd = nextMonthIdx < months.length
        ? months[nextMonthIdx].start
        : new Date(); // Current date for the latest month

      if (volDate >= monthStart && volDate < monthEnd) {
        // This volunteer was activated in this month
        volunteers.count[i]++;
        break; // Found the right month, no need to continue checking
      }
    }
  }

  return {
    applications,
    volunteers
  };
}

/**
 * Get processing time metrics
 * @param {Object} db - MongoDB database connection
 * @param {Object} dateFilter - Date filter for created_at field
 * @returns {Promise<Object>} Processing time metrics
 */
async function getProcessingTimeMetrics(db, dateFilter) {
  // Base query with optional date filter and status (must be approved or rejected to have processing time)
  const query = {
    status: { $in: ['approved', 'rejected'] }
  };

  if (dateFilter.hasOwnProperty('$gte')) {
    query.created_at = dateFilter;
  }

  // Get all applications that have been processed
  const applications = await db.collection('volunteer_applications')
    .find(query)
    .toArray();

  // Calculate processing times
  let approvalTimes = [];
  let rejectionTimes = [];
  let totalProcessingTime = 0;
  let processedCount = 0;

  for (const app of applications) {
    let processingDate;

    if (app.status === 'approved' && app.approved_at) {
      processingDate = new Date(app.approved_at);
      approvalTimes.push(processingDate - new Date(app.created_at));
    } else if (app.status === 'rejected' && app.rejected_at) {
      processingDate = new Date(app.rejected_at);
      rejectionTimes.push(processingDate - new Date(app.created_at));
    } else {
      continue; // Skip if no processing date
    }

    totalProcessingTime += (processingDate - new Date(app.created_at));
    processedCount++;
  }

  // Calculate averages (in days)
  const msPerDay = 1000 * 60 * 60 * 24;

  const averageProcessingTime = processedCount > 0
    ? (totalProcessingTime / processedCount) / msPerDay
    : 0;

  const averageApprovalTime = approvalTimes.length > 0
    ? (approvalTimes.reduce((sum, time) => sum + time, 0) / approvalTimes.length) / msPerDay
    : 0;

  const averageRejectionTime = rejectionTimes.length > 0
    ? (rejectionTimes.reduce((sum, time) => sum + time, 0) / rejectionTimes.length) / msPerDay
    : 0;

  return {
    averageProcessingTime: Math.round(averageProcessingTime * 10) / 10, // Round to 1 decimal place
    averageApprovalTime: Math.round(averageApprovalTime * 10) / 10,
    averageRejectionTime: Math.round(averageRejectionTime * 10) / 10,
    processedApplications: processedCount
  };
}

/**
 * Get feedback metrics and statistics
 * @param {Object} db - MongoDB database connection
 * @param {Object} dateFilter - Date filter for created_at field
 * @returns {Promise<Object>} Feedback metrics
 */
async function getFeedbackMetrics(db, dateFilter) {
  try {
    // Check if chat_feedback collection exists
    const collections = await db.listCollections({ name: 'chat_feedback' }).toArray();
    if (collections.length === 0) {
      // Return placeholder data if no feedback collection exists yet
      return {
        total: 0,
        positive: 0,
        neutral: 0,
        flagged: 0,
        positivePercent: 0,
        neutralPercent: 0,
        flaggedPercent: 0,
        averageScore: 0,
        recentComments: [],
        timeBasedStats: [],
        responseTimeImpact: [
          { range: '<2 min', positive: 0, neutral: 0, flagged: 0 },
          { range: '2-5 min', positive: 0, neutral: 0, flagged: 0 },
          { range: '5-10 min', positive: 0, neutral: 0, flagged: 0 },
          { range: '>10 min', positive: 0, neutral: 0, flagged: 0 },
        ],
        durationImpact: [
          { range: '<5 min', positive: 0, neutral: 0, flagged: 0 },
          { range: '5-15 min', positive: 0, neutral: 0, flagged: 0 },
          { range: '15-30 min', positive: 0, neutral: 0, flagged: 0 },
          { range: '>30 min', positive: 0, neutral: 0, flagged: 0 },
        ]
      };
    }

    // Base query with optional date filter
    const query = dateFilter.hasOwnProperty('$gte')
      ? { created_at: dateFilter }
      : {};

    // Get feedback counts by rating
    const feedbackByRating = await db.collection('chat_feedback').aggregate([
      { $match: query },
      { $group: { _id: '$rating', count: { $sum: 1 } } }
    ]).toArray();

    // Transform to usable format
    const ratingCounts = feedbackByRating.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, { positive: 0, neutral: 0, flagged: 0 });

    // Calculate totals and percentages
    const total = Object.values(ratingCounts).reduce((sum, count) => sum + count, 0);
    const positivePercent = total > 0 ? Math.round((ratingCounts.positive / total) * 100) : 0;
    const neutralPercent = total > 0 ? Math.round((ratingCounts.neutral / total) * 100) : 0;
    const flaggedPercent = total > 0 ? Math.round((ratingCounts.flagged / total) * 100) : 0;

    // Calculate average score (positive = 1, neutral = 0.5, flagged = 0)
    const averageScore = total > 0 ?
      (ratingCounts.positive + (ratingCounts.neutral * 0.5)) / total : 0;

    // Get recent feedback with comments
    const recentComments = await db.collection('chat_feedback')
      .find({
        comments: { $exists: true, $ne: "" },
        ...query
      })
      .sort({ created_at: -1 })
      .limit(8)
      .toArray();

    // Get time-based feedback metrics
    const timeBasedStats = await getTimeBasedFeedbackStats(db, dateFilter);

    // Get response time impact metrics
    const responseTimeImpact = await getResponseTimeImpactMetrics(db, dateFilter);

    // Get session duration impact metrics
    const durationImpact = await getSessionDurationImpactMetrics(db, dateFilter);

    return {
      total,
      positive: ratingCounts.positive || 0,
      neutral: ratingCounts.neutral || 0,
      flagged: ratingCounts.flagged || 0,
      positivePercent,
      neutralPercent,
      flaggedPercent,
      averageScore,
      recentComments: recentComments.map(comment => ({
        rating: comment.rating,
        comments: comment.comments,
        created_at: comment.created_at
      })),
      timeBasedStats,
      responseTimeImpact,
      durationImpact
    };
  } catch (error) {
    console.error('Error getting feedback metrics:', error);
    // Return placeholder data in case of error
    return {
      total: 0,
      positive: 0,
      neutral: 0,
      flagged: 0,
      positivePercent: 0,
      neutralPercent: 0,
      flaggedPercent: 0,
      averageScore: 0,
      recentComments: [],
      timeBasedStats: [],
      responseTimeImpact: [],
      durationImpact: []
    };
  }
}

/**
 * Get time-based feedback statistics
 * @param {Object} db - MongoDB database connection
 * @param {Object} dateFilter - Date filter
 * @returns {Promise<Array>} Time-based feedback stats
 */
async function getTimeBasedFeedbackStats(db, dateFilter) {
  try {
    const now = new Date();
    const periods = [];

    // Create time periods (last 6 months)
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      // Format month name (e.g., "Jan")
      const monthName = monthStart.toLocaleString('default', { month: 'short' });

      periods.push({
        period: monthName,
        start: monthStart,
        end: monthEnd,
        positive: 0,
        neutral: 0,
        flagged: 0
      });
    }

    // Get all feedback
    const allFeedback = await db.collection('chat_feedback').find({
      created_at: { $gte: periods[0].start }
    }).toArray();

    // Categorize feedback by period
    for (const feedback of allFeedback) {
      const feedbackDate = new Date(feedback.created_at);

      for (const period of periods) {
        if (feedbackDate >= period.start && feedbackDate <= period.end) {
          if (feedback.rating === 'positive') {
            period.positive++;
          } else if (feedback.rating === 'neutral') {
            period.neutral++;
          } else if (feedback.rating === 'flagged') {
            period.flagged++;
          }
          break;
        }
      }
    }

    return periods.map(({ period, positive, neutral, flagged }) => ({
      period, positive, neutral, flagged
    }));
  } catch (error) {
    console.error('Error getting time-based feedback stats:', error);
    return [];
  }
}

/**
 * Get metrics on how response time impacts feedback rating
 * @param {Object} db - MongoDB database connection
 * @param {Object} dateFilter - Date filter
 * @returns {Promise<Array>} Response time impact metrics
 */
async function getResponseTimeImpactMetrics(db, dateFilter) {
  try {
    // For now, return sample data
    // In a full implementation, this would analyze response time's impact on ratings
    return [
      { range: '<2 min', positive: 95, neutral: 4, flagged: 1 },
      { range: '2-5 min', positive: 80, neutral: 15, flagged: 5 },
      { range: '5-10 min', positive: 60, neutral: 25, flagged: 15 },
      { range: '>10 min', positive: 40, neutral: 30, flagged: 30 },
    ];
  } catch (error) {
    console.error('Error getting response time impact metrics:', error);
    return [];
  }
}

/**
 * Get metrics on how session duration impacts feedback rating
 * @param {Object} db - MongoDB database connection
 * @param {Object} dateFilter - Date filter
 * @returns {Promise<Array>} Session duration impact metrics
 */
async function getSessionDurationImpactMetrics(db, dateFilter) {
  try {
    // For now, return sample data
    // In a full implementation, this would analyze session duration's impact on ratings
    return [
      { range: '<5 min', positive: 45, neutral: 30, flagged: 25 },
      { range: '5-15 min', positive: 70, neutral: 20, flagged: 10 },
      { range: '15-30 min', positive: 85, neutral: 10, flagged: 5 },
      { range: '>30 min', positive: 65, neutral: 25, flagged: 10 },
    ];
  } catch (error) {
    console.error('Error getting session duration impact metrics:', error);
    return [];
  }
}