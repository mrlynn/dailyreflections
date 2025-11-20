import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import {
  updateUserOnboarding,
  updateUserSobriety,
  updateUserNotificationPreferences,
  updateUserAccountabilityPreferences,
  getUserPreferences
} from '@/lib/models/User';

/**
 * API handler for user onboarding
 * Saves onboarding data and updates user preferences
 */

export async function POST(request) {
  try {
    // Get the authenticated user's session
    const session = await auth();
    
    if (!session || !session.user) {
      console.error('No session found in POST');
      return NextResponse.json(
        { success: false, error: 'No session found', details: 'Authentication required', code: 'AUTH_NO_SESSION' },
        { status: 401 }
      );
    }

    if (!session.user.id) {
      console.error('Session user exists but has no ID in POST');
      return NextResponse.json(
        { success: false, error: 'Invalid user data', details: 'User ID missing from session', code: 'AUTH_MISSING_USER_ID' },
        { status: 400 }
      );
    }

    // Parse request body
    let requestData;
    try {
      requestData = await request.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body', details: error.message, code: 'REQUEST_INVALID_JSON' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!requestData) {
      return NextResponse.json(
        { success: false, error: 'No data provided', code: 'REQUEST_EMPTY_DATA' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    console.log(`Processing onboarding data for user: ${userId}`);
    console.log('Received request data:', JSON.stringify(requestData, null, 2));

    try {
      // Check if we're resetting onboarding (from test page)
      if (requestData.onboarding && requestData.onboarding.setupComplete === false) {
        console.log('Resetting onboarding status');
        await updateUserOnboarding(userId, {
          setupComplete: false,
          lastStep: requestData.onboarding.lastStep || 0
        });
        return NextResponse.json({
          success: true,
          message: 'Onboarding status reset successfully',
          userId: userId,
          timestamp: new Date().toISOString()
        });
      }

      // Check if we're just setting setupComplete flag (fast path - skip if we have full data)
      if (requestData.setupComplete === true && !requestData.sobrietyDate && !requestData.notifications) {
        console.log('Fast path: Marking onboarding as complete (no additional data)');
        await updateUserOnboarding(userId, {
          setupComplete: true,
          lastStep: 3
        });
      } else {
        // Full onboarding data processing
        console.log('Processing full onboarding data');
        console.log('Has sobrietyDate:', !!requestData.sobrietyDate);
        console.log('Has notifications:', !!requestData.notifications);
        console.log('Has accountability:', !!requestData.accountability);

        // Update onboarding status
        await updateUserOnboarding(userId, {
          setupComplete: true,
          lastStep: 3 // Last step of the onboarding process
        });

        // Update sobriety information if provided
        if (requestData.sobrietyDate) {
          console.log('Updating sobriety information:', {
            date: requestData.sobrietyDate,
            timezone: requestData.timezone
          });
          await updateUserSobriety(userId, {
            date: requestData.sobrietyDate,
            timezone: requestData.timezone
          });
        }

        // Update notification preferences if provided
        if (requestData.notifications) {
          console.log('Updating notification preferences:', requestData.notifications);
          await updateUserNotificationPreferences(userId, requestData.notifications);
        }

        // Update accountability preferences if provided
        if (requestData.accountability) {
          console.log('Updating accountability preferences:', requestData.accountability);
          await updateUserAccountabilityPreferences(userId, requestData.accountability);
        }

        // Log successful updates
        console.log(`Successfully updated onboarding data for user ${userId}`);
      }
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to save user preferences',
          details: dbError.message,
          stack: process.env.NODE_ENV === 'development' ? dbError.stack : undefined,
          code: 'DB_OPERATION_FAILED'
        },
        { status: 500 }
      );
    }

    // Update other preferences as needed
    // Additional updates could be added here for accountability contacts, theme preferences, etc.

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      userId: userId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to complete onboarding',
        details: error.message,
        code: 'ONBOARDING_GENERAL_ERROR'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check onboarding status
export async function GET(request) {
  try {
    // Get the authenticated user's session
    const session = await auth();
    
    if (!session || !session.user) {
      console.error('No session found in GET');
      return NextResponse.json(
        { success: false, error: 'No session found', details: 'Authentication required', code: 'AUTH_NO_SESSION' },
        { status: 401 }
      );
    }

    if (!session.user.id) {
      console.error('Session user exists but has no ID in GET');
      return NextResponse.json(
        { success: false, error: 'Invalid user data', details: 'User ID missing from session', code: 'AUTH_MISSING_USER_ID' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    console.log(`Fetching onboarding data for user: ${userId}`);

    try {
      // Get user preferences including onboarding status
      const userPreferences = await getUserPreferences(userId);

      // Check if user was actually found
      if (!userPreferences) {
        console.error(`User with ID ${userId} not found in database`);
        return NextResponse.json({
          success: true, // Still return success to allow UI to function
          onboarding: { setupComplete: false },
          sobriety: null,
          preferences: null,
          warning: 'User not found in database',
          code: 'USER_NOT_FOUND'
        });
      }

      // Log successful data retrieval
      console.log(`Successfully retrieved onboarding data for user ${userId}`);

      // Return onboarding status
      return NextResponse.json({
        success: true,
        onboarding: userPreferences?.onboarding || { setupComplete: false },
        sobriety: userPreferences?.sobriety || null,
        preferences: userPreferences?.preferences || null,
        userId: userId,
        timestamp: new Date().toISOString()
      });
    } catch (dbError) {
      console.error('Failed to fetch user preferences:', dbError);

      // Return default values on error to prevent UI from breaking
      return NextResponse.json({
        success: true, // Still return success to allow UI to function
        onboarding: { setupComplete: false },
        sobriety: null,
        preferences: null,
        error: 'Database error',
        details: dbError.message,
        code: 'DB_FETCH_ERROR',
        recoverable: true
      });
    }
  } catch (error) {
    console.error('Unhandled error in onboarding GET endpoint:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Server error',
        details: error.message || 'Unknown error occurred',
        code: 'ONBOARDING_GET_ERROR',
        recoverable: false
      },
      { status: 500 }
    );
  }
}