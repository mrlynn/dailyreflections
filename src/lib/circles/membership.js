import { ObjectId } from 'mongodb';
import {
  CIRCLE_COLLECTIONS,
  CIRCLE_MEMBER_STATUS,
  CIRCLE_ROLES,
  CIRCLE_VISIBILITY,
} from './constants';
import { getCirclesCollection } from './db';

function asObjectId(id) {
  if (id instanceof ObjectId) return id;
  if (!ObjectId.isValid(id)) {
    const error = new Error('Invalid identifier provided.');
    error.status = 400;
    error.code = 'INVALID_ID';
    throw error;
  }
  return new ObjectId(id);
}

export async function requireCircle(circleId) {
  const circlesCollection = await getCirclesCollection('CIRCLES');
  const circle = await circlesCollection.findOne({
    _id: asObjectId(circleId),
    isDeleted: { $ne: true },
  });

  if (!circle) {
    const error = new Error('Circle not found.');
    error.status = 404;
    error.code = 'CIRCLE_NOT_FOUND';
    throw error;
  }

  return circle;
}

export async function getMembership(circleId, userId) {
  const membersCollection = await getCirclesCollection('MEMBERS');
  return membersCollection.findOne({
    circleId: asObjectId(circleId),
    userId: asObjectId(userId),
  });
}

export async function requireActiveMembership(circleId, userId) {
  const membership = await getMembership(circleId, userId);
  if (!membership || membership.status !== CIRCLE_MEMBER_STATUS.ACTIVE) {
    const error = new Error('You are not an active member of this circle.');
    error.status = 403;
    error.code = 'CIRCLE_ACCESS_DENIED';
    throw error;
  }
  return membership;
}

export function isAdminMembership(membership) {
  return (
    membership &&
    (membership.role === CIRCLE_ROLES.OWNER || membership.role === CIRCLE_ROLES.ADMIN)
  );
}

export async function requireAdminMembership(circleId, userId) {
  const membership = await requireActiveMembership(circleId, userId);
  if (!isAdminMembership(membership)) {
    const error = new Error('Only circle owners or admins can perform this action.');
    error.status = 403;
    error.code = 'CIRCLE_ADMIN_REQUIRED';
    throw error;
  }
  return membership;
}

export async function countActiveMembers(circleId) {
  const membersCollection = await getCirclesCollection('MEMBERS');
  return membersCollection.countDocuments({
    circleId: asObjectId(circleId),
    status: CIRCLE_MEMBER_STATUS.ACTIVE,
  });
}

export function ensureCircleCapacity(circle, { additional = 1, activeCount }) {
  const current = activeCount ?? circle.memberCount ?? 0;
  if (current + additional > circle.maxMembers) {
    const error = new Error('Circle has reached its member limit.');
    error.status = 400;
    error.code = 'CIRCLE_FULL';
    throw error;
  }
}

export async function incrementMemberCount(circleId, amount) {
  if (!amount) return;

  const circlesCollection = await getCirclesCollection('CIRCLES');
  await circlesCollection.updateOne(
    { _id: asObjectId(circleId) },
    { $inc: { memberCount: amount }, $set: { updatedAt: new Date() } },
  );
}

export function membershipResponse(membershipDoc) {
  if (!membershipDoc) return null;
  return {
    id: membershipDoc._id?.toString(),
    userId: membershipDoc.userId?.toString(),
    circleId: membershipDoc.circleId?.toString(),
    role: membershipDoc.role,
    status: membershipDoc.status,
    joinedAt: membershipDoc.joinedAt,
    createdAt: membershipDoc.createdAt,
    updatedAt: membershipDoc.updatedAt,
  };
}

export function publicCircleFilter() {
  return { visibility: CIRCLE_VISIBILITY.PUBLIC, isDeleted: { $ne: true } };
}

export async function resolveCircleByIdentifier(identifier) {
  if (!identifier) {
    const error = new Error('Circle not found.');
    error.status = 404;
    error.code = 'CIRCLE_NOT_FOUND';
    throw error;
  }

  const circlesCollection = await getCirclesCollection('CIRCLES');

  let circle = null;
  if (ObjectId.isValid(identifier)) {
    circle = await circlesCollection.findOne({
      _id: new ObjectId(identifier),
      isDeleted: { $ne: true },
    });
  }

  if (!circle) {
    circle = await circlesCollection.findOne({
      slug: identifier.toString().toLowerCase(),
      isDeleted: { $ne: true },
    });
  }

  if (!circle) {
    const error = new Error('Circle not found.');
    error.status = 404;
    error.code = 'CIRCLE_NOT_FOUND';
    throw error;
  }

  return circle;
}

export async function resolveCircleFromParams(paramsPromise) {
  const params = typeof paramsPromise?.then === 'function' ? await paramsPromise : paramsPromise;
  return resolveCircleByIdentifier(params?.circleId);
}

