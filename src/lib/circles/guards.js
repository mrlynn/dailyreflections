import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getFeatureFlag } from '@/lib/featureFlags';

const PROFILE_COMPLETE_ERROR = {
  code: 'PROFILE_INCOMPLETE',
  message: 'Please complete your profile to access circles.',
};

const FEATURE_DISABLED_ERROR = {
  code: 'CIRCLES_DISABLED',
  message: 'Circles are not available right now.',
};

const AUTH_REQUIRED_ERROR = {
  code: 'AUTH_REQUIRED',
  message: 'You must be signed in to access circles.',
};

/**
 * Throws if the Circles feature flag is disabled.
 */
export function assertCirclesFeatureEnabled() {
  if (!getFeatureFlag('CIRCLES')) {
    const error = new Error(FEATURE_DISABLED_ERROR.message);
    error.status = 404;
    error.code = FEATURE_DISABLED_ERROR.code;
    throw error;
  }
}

/**
 * Ensures the request is authenticated and returns the session.
 */
export async function requireCirclesSession() {
  const session = await auth();

  if (!session?.user?.id) {
    const error = new Error(AUTH_REQUIRED_ERROR.message);
    error.status = 401;
    error.code = AUTH_REQUIRED_ERROR.code;
    throw error;
  }

  return session;
}

/**
 * Ensures the authenticated user has completed their profile.
 * Returns the user document (limited fields) when successful.
 */
export async function requireProfileComplete(userId) {
  if (!ObjectId.isValid(userId)) {
    const error = new Error(AUTH_REQUIRED_ERROR.message);
    error.status = 401;
    error.code = AUTH_REQUIRED_ERROR.code;
    throw error;
  }

  const client = await clientPromise;
  const db = client.db('dailyreflections');

  const user = await db.collection('users').findOne(
    { _id: new ObjectId(userId) },
    {
      projection: {
        onboarding: 1,
        profile: 1,
        displayName: 1,
      },
    },
  );

  const onboardingComplete =
    user?.onboarding?.setupComplete === true || user?.onboarding?.setupComplete === 'true';
  const profileComplete =
    user?.profile?.isComplete === true || user?.profile?.isComplete === 'true';

  if (!onboardingComplete && !profileComplete) {
    const error = new Error(PROFILE_COMPLETE_ERROR.message);
    error.status = 403;
    error.code = PROFILE_COMPLETE_ERROR.code;
    throw error;
  }

  return user;
}

/**
 * Asserts the Circles feature is enabled, the user is authenticated,
 * and their profile is complete. Returns session and user information.
 */
export async function requireCirclesAccess() {
  assertCirclesFeatureEnabled();
  const session = await requireCirclesSession();
  const user = await requireProfileComplete(session.user.id);

  return { session, user };
}

